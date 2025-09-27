import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { Xendit } from "xendit-node"

const createPaymentSchema = z.object({
  bookingId: z.string(),
})

const xendit = new Xendit({
  secretKey: process.env.XENDIT_API_KEY!
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
        paymentMethod: "qris", // Default to QRIS, user will choose on Midtrans page
        status: "PENDING"
      }
    })

    // Create Midtrans transaction
    const orderId = `JASAKU-${booking.id}-${payment.id}`
    const parameter = {
      payment_type: "qris",
      transaction_details: {
        order_id: orderId,
        gross_amount: booking.totalAmount,
      },
      customer_details: {
        first_name: booking.customer.name?.split(" ")[0] || "Customer",
        last_name: booking.customer.name?.split(" ").slice(1).join(" ") || "",
        email: booking.customer.email,
        phone: "", // Add phone if available
      },
      item_details: [{
        id: booking.service.id,
        price: booking.totalAmount,
        quantity: 1,
        name: booking.service.title,
        category: "Service",
      }],
      callbacks: {
        finish: `${process.env.NEXTAUTH_URL}/bookings`
      }
    }

    console.log("Creating Xendit invoice with external_id:", orderId)

    // Create Xendit invoice with minimal required structure based on latest API
    const customerEmail = booking.customer.email || ""
    const customerName = booking.customer.name || "Customer"
    
    // Validate required fields
    if (!customerEmail) {
      throw new Error("Customer email is required for invoice creation")
    }
    
    if (booking.totalAmount <= 0) {
      throw new Error("Invoice amount must be greater than 0")
    }

    const invoiceData = {
        externalId: `JASAKU-${booking.id}-${payment.id}`,
        amount: booking.totalAmount,
        payerEmail: customerEmail,
        description: `Payment for ${booking.service.title}`,
        currency: "IDR"
      }

      console.log("Creating Xendit invoice with data:", JSON.stringify(invoiceData, null, 2))

    try {
      const invoice = await xendit.Invoice.createInvoice({
        data: invoiceData
      })

      // Update payment with transaction details
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          transactionId: invoice.id,
          status: "PENDING"
        }
      })

      return NextResponse.json({
        payment,
        xenditInvoice: {
          id: invoice.id,
          invoice_url: invoice.invoiceUrl,
          status: invoice.status
        }
      }, { status: 201 })

    } catch (xenditError: any) {
      console.error("Xendit error details:", {
        message: xenditError?.message,
        status: xenditError?.status,
        errorCode: xenditError?.errorCode,
        errorMessage: xenditError?.errorMessage,
        response: xenditError?.response,
        rawResponse: xenditError?.rawResponse
      })

      // Log the request data that caused the error
      console.error("Invoice data that caused error:", JSON.stringify(invoiceData, null, 2))

      // Update payment status to failed
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED" }
      })

      // Extract safe error details to avoid circular reference
      const errorDetails = {
        message: xenditError?.message || "Unknown error",
        statusCode: xenditError?.status || 500,
        errorCode: xenditError?.errorCode || "UNKNOWN_ERROR",
        errorMessage: xenditError?.errorMessage || "Unknown error message",
        apiResponse: xenditError?.response || null
      }

      // Provide user-friendly error messages based on Xendit error
      let userMessage = "Payment processing failed. Please try again.";
      if (xenditError?.status === 500) {
        userMessage = "Payment system is temporarily unavailable. Please try again in a few minutes.";
      } else if (xenditError?.status === 401) {
        userMessage = "Payment system configuration error. Please contact support.";
      } else if (xenditError?.status === 400) {
        userMessage = "Invalid payment request. Please check your information and try again.";
      } else if (xenditError?.status === 409) {
        userMessage = "Payment request conflict. Please try creating a new booking.";
      }

      return NextResponse.json({
        error: userMessage,
        details: errorDetails
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
        bookingStatus = "CONFIRMED" // Booking is confirmed when payment succeeds
        break
      case "pending":
        paymentStatus = "PENDING"
        bookingStatus = "PENDING" // Keep booking pending until payment completes
        break
      case "deny":
      case "cancel":
      case "expire":
      case "failure":
        paymentStatus = "FAILED"
        bookingStatus = "CANCELLED" // Cancel booking if payment fails
        break
      default:
        paymentStatus = "PROCESSING"
        bookingStatus = "PENDING"
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
