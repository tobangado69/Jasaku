import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { CoreApi } from "midtrans-client"

const createPaymentSchema = z.object({
  bookingId: z.string(),
  paymentMethod: z.enum(["gopay", "bank_transfer", "credit_card", "qris"]).default("gopay"),
})

const midtrans = new CoreApi({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY!,
  clientKey: process.env.MIDTRANS_CLIENT_KEY!,
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get("bookingId")
    const isAdmin = (session.user as any)?.role === "ADMIN"

    if (bookingId) {
      // Get specific payment
      const payment = await prisma.payment.findUnique({
        where: { bookingId },
        include: { 
          booking: {
            include: {
              service: {
                include: {
                  provider: {
                    select: {
                      name: true,
                      email: true
                    }
                  }
                }
              },
              customer: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      })

      if (!payment) {
        return NextResponse.json({ error: "Payment not found" }, { status: 404 })
      }

      // Check if user has access to this payment
      if (!isAdmin && 
          payment.booking.customerId !== (session.user as any)?.id && 
          payment.booking.providerId !== (session.user as any)?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      return NextResponse.json(payment)
    }

    // Get payments - all for admin, user-specific for others
    const where: any = isAdmin ? {} : {
      booking: {
        OR: [
          { customerId: (session.user as any)?.id },
          { providerId: (session.user as any)?.id }
        ]
      }
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        booking: {
          include: {
            service: {
              include: {
                provider: {
                  select: {
                    name: true,
                    email: true
                  }
                }
              }
            },
            customer: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    // Transform data to match expected interface
    const transformedPayments = payments.map(payment => ({
      id: payment.id,
      amount: payment.amount,
      status: payment.status,
      paymentMethod: payment.paymentMethod || "Unknown",
      transactionId: payment.transactionId,
      booking: {
        id: payment.booking.id,
        service: {
          title: payment.booking.service.title,
          provider: {
            name: payment.booking.service.provider.name,
            email: payment.booking.service.provider.email
          }
        },
        customer: {
          name: payment.booking.customer.name,
          email: payment.booking.customer.email
        },
        scheduledDate: payment.booking.scheduledAt?.toISOString()
      },
      createdAt: payment.createdAt.toISOString(),
      completedAt: payment.paidAt?.toISOString()
    }))

    return NextResponse.json(transformedPayments)
  } catch (error) {
    console.error("Error fetching payments:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== "SEEKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createPaymentSchema.parse(body)

    // Get booking details
    const booking = await prisma.booking.findUnique({
      where: { id: validatedData.bookingId },
      include: {
        service: true,
        customer: { select: { name: true, email: true } },
        provider: { select: { name: true, email: true } }
      }
    })

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    if (booking.customerId !== (session.user as any)?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (booking.status !== "CONFIRMED") {
      return NextResponse.json({ error: "Booking must be confirmed first" }, { status: 400 })
    }

    // Check if payment already exists
    const existingPayment = await prisma.payment.findUnique({
      where: { bookingId: validatedData.bookingId }
    })

    if (existingPayment) {
      return NextResponse.json({ error: "Payment already exists for this booking" }, { status: 400 })
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        bookingId: validatedData.bookingId,
        amount: booking.totalAmount,
        paymentMethod: validatedData.paymentMethod,
        status: "PENDING"
      }
    })

    // Create Midtrans transaction
    const parameter = {
      payment_type: "qris", // Default to QRIS for Indonesian market
      transaction_details: {
        order_id: `JASAKU-${booking.id}-${Date.now()}`,
        gross_amount: booking.totalAmount,
      },
      customer_details: {
        first_name: booking.customer.name?.split(" ")[0] || "Customer",
        email: booking.customer.email,
      },
      item_details: [{
        id: booking.service.id,
        price: booking.totalAmount,
        quantity: 1,
        name: booking.service.title,
      }],
      qris: {
        acquirer: "gopay" // Can be gopay, shopeepay, etc.
      }
    }

    try {
      const transaction = await midtrans.charge(parameter)

      // Update payment with transaction details
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          transactionId: transaction.transaction_id,
          status: "PROCESSING"
        }
      })

      return NextResponse.json({
        payment,
        midtransTransaction: transaction
      }, { status: 201 })

    } catch (midtransError) {
      console.error("Midtrans error:", midtransError)

      // Update payment status to failed
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED" }
      })

      return NextResponse.json({
        error: "Payment processing failed",
        details: midtransError
      }, { status: 500 })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error creating payment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Webhook endpoint for Midtrans notifications
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    // Verify webhook signature (simplified for demo)
    const { order_id, transaction_status, payment_type } = body

    if (!order_id || !transaction_status) {
      return NextResponse.json({ error: "Invalid webhook data" }, { status: 400 })
    }

    // Extract booking ID from order_id
    const bookingId = order_id.split("-")[1]

    if (!bookingId) {
      return NextResponse.json({ error: "Invalid order ID format" }, { status: 400 })
    }

    // Update payment status based on transaction status
    let paymentStatus: string
    let bookingStatus: string

    switch (transaction_status) {
      case "capture":
      case "settlement":
        paymentStatus = "COMPLETED"
        bookingStatus = "IN_PROGRESS"
        break
      case "pending":
        paymentStatus = "PENDING"
        bookingStatus = "CONFIRMED"
        break
      case "deny":
      case "cancel":
      case "expire":
      case "failure":
        paymentStatus = "FAILED"
        bookingStatus = "CANCELLED"
        break
      default:
        paymentStatus = "PROCESSING"
        bookingStatus = "CONFIRMED"
    }

    // Update payment
    await prisma.payment.updateMany({
      where: { bookingId },
      data: { status: paymentStatus as any }
    })

    // Update booking status
    await prisma.booking.updateMany({
      where: { id: bookingId },
      data: { status: bookingStatus as any }
    })

    return NextResponse.json({ message: "Payment status updated" })
  } catch (error) {
    console.error("Error processing webhook:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Approve payment endpoint
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get("paymentId")
    const action = searchParams.get("action")

    if (!paymentId || !action) {
      return NextResponse.json({ error: "Missing paymentId or action parameter" }, { status: 400 })
    }

    // Check if payment exists
    const existingPayment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { booking: true }
    })

    if (!existingPayment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    let newStatus: string
    let bookingStatus: string

    if (action === "approve") {
      newStatus = "COMPLETED"
      bookingStatus = "IN_PROGRESS"
    } else if (action === "reject") {
      newStatus = "FAILED"
      bookingStatus = "CANCELLED"
    } else {
      return NextResponse.json({ error: "Invalid action. Use 'approve' or 'reject'" }, { status: 400 })
    }

    // Update payment status
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: newStatus as any,
        paidAt: action === "approve" ? new Date() : null
      },
      include: {
        booking: {
          include: {
            service: {
              include: {
                provider: {
                  select: {
                    name: true,
                    email: true
                  }
                }
              }
            },
            customer: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    // Update booking status
    await prisma.booking.update({
      where: { id: existingPayment.bookingId },
      data: { status: bookingStatus as any }
    })

    // Transform response to match frontend interface
    const transformedPayment = {
      id: updatedPayment.id,
      amount: updatedPayment.amount,
      status: updatedPayment.status,
      paymentMethod: updatedPayment.paymentMethod || "Unknown",
      transactionId: updatedPayment.transactionId,
      booking: {
        id: updatedPayment.booking.id,
        service: {
          title: updatedPayment.booking.service.title,
          provider: {
            name: updatedPayment.booking.service.provider.name,
            email: updatedPayment.booking.service.provider.email
          }
        },
        customer: {
          name: updatedPayment.booking.customer.name,
          email: updatedPayment.booking.customer.email
        },
        scheduledDate: updatedPayment.booking.scheduledAt?.toISOString()
      },
      createdAt: updatedPayment.createdAt.toISOString(),
      completedAt: updatedPayment.paidAt?.toISOString()
    }

    return NextResponse.json({
      message: `Payment ${action}d successfully`,
      payment: transformedPayment
    })

  } catch (error) {
    console.error("Error updating payment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
