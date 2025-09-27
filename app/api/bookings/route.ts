import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { CoreApi } from "midtrans-client"

const midtrans = new CoreApi({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY!,
  clientKey: process.env.MIDTRANS_CLIENT_KEY!,
})

const createBookingSchema = z.object({
  serviceId: z.string(),
  scheduledAt: z.string().datetime(),
  notes: z.string().optional(),
  location: z.string().optional(),
})

const updateBookingSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  completedAt: z.string().datetime().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const limit = parseInt(searchParams.get("limit") || "10")
    const offset = parseInt(searchParams.get("offset") || "0")

    const where: any = {
      OR: [
        { customerId: (session.user as any)?.id },
        { providerId: (session.user as any)?.id }
      ]
    }

    if (status) where.status = status

    const bookings = await prisma.booking.findMany({
      where,
      take: limit,
      skip: offset,
      include: {
        service: {
          select: {
            id: true,
            title: true,
            category: true,
            images: true,
            provider: {
              select: {
                id: true,
                name: true,
                profileImage: true,
                phone: true
              }
            }
          }
        },
        customer: {
          select: {
            id: true,
            name: true,
            profileImage: true,
            phone: true
          }
        },
        provider: {
          select: {
            id: true,
            name: true,
            profileImage: true,
            phone: true
          }
        },
        payment: true,
        _count: {
          select: {
            messages: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json(bookings)
  } catch (error) {
    console.error("Error fetching bookings:", error)
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
    const validatedData = createBookingSchema.parse(body)

    // Get service details
    const service = await prisma.service.findUnique({
      where: { id: validatedData.serviceId },
      include: { provider: true }
    })

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 })
    }

    // Check if service is available
    if (service.status !== "ACTIVE") {
      return NextResponse.json({ error: "Service is not available" }, { status: 400 })
    }

    // Check for conflicting bookings at the same time
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        serviceId: validatedData.serviceId,
        scheduledAt: new Date(validatedData.scheduledAt),
        status: {
          in: ["PENDING", "CONFIRMED", "IN_PROGRESS"]
        }
      }
    })

    if (conflictingBooking) {
      return NextResponse.json({ error: "Time slot is already booked" }, { status: 400 })
    }

    // Create the booking first
    const booking = await prisma.booking.create({
      data: {
        serviceId: validatedData.serviceId,
        customerId: (session.user as any)?.id || "",
        providerId: service.provider.id,
        scheduledAt: new Date(validatedData.scheduledAt),
        notes: validatedData.notes,
        totalAmount: service.price,
        status: "PENDING"
      }
    })

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: service.price,
        paymentMethod: "qris", // Default to QRIS, user will choose on Midtrans page
        status: "PENDING"
      }
    })

    // Create Midtrans transaction
    const parameter = {
      payment_type: "qris", // Default to QRIS for Indonesian market
      transaction_details: {
        order_id: `JASAKU-${booking.id}-${Date.now()}`,
        gross_amount: service.price,
      },
      customer_details: {
        first_name: (session.user as any)?.name?.split(" ")[0] || "Customer",
        email: (session.user as any)?.email,
      },
      item_details: [{
        id: service.id,
        price: service.price,
        quantity: 1,
        name: service.title,
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

      // Get complete booking with payment info
      const completeBooking = await prisma.booking.findUnique({
        where: { id: booking.id },
        include: {
          service: {
            select: {
              id: true,
              title: true,
              category: true,
              provider: {
                select: {
                  id: true,
                  name: true,
                  profileImage: true,
                  phone: true
                }
              }
            }
          },
          customer: {
            select: {
              id: true,
              name: true,
              profileImage: true,
              phone: true
            }
          },
          provider: {
            select: {
              id: true,
              name: true,
              profileImage: true,
              phone: true
            }
          },
          payment: true
        }
      })

      return NextResponse.json({
        booking: completeBooking,
        midtransTransaction: transaction
      }, { status: 201 })

    } catch (midtransError) {
      console.error("Midtrans error:", midtransError)

      // Delete booking and payment if Midtrans fails
      await prisma.payment.delete({ where: { id: payment.id } })
      await prisma.booking.delete({ where: { id: booking.id } })

      return NextResponse.json({
        error: "Payment processing failed. Please try again.",
        details: midtransError
      }, { status: 500 })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error creating booking:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { pathname } = new URL(request.url)
    const bookingId = pathname.split('/').pop()

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID required" }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = updateBookingSchema.parse(body)

    // Check if user is authorized to update this booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { service: true }
    })

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    // Check if user is the provider or admin
    const userRole = (session.user as any)?.role
    const isProvider = booking.providerId === (session.user as any)?.id
    const isAdmin = userRole === "ADMIN"

    if (!isProvider && !isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Update booking
    const updateData: any = {}
    if (validatedData.status) {
      updateData.status = validatedData.status
    }
    if (validatedData.completedAt) {
      updateData.completedAt = new Date(validatedData.completedAt)
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
      include: {
        service: {
          select: {
            id: true,
            title: true,
            category: true,
          }
        },
        customer: {
          select: {
            id: true,
            name: true,
          }
        },
        review: {
          select: {
            id: true,
            rating: true,
            comment: true,
          }
        }
      }
    })

    return NextResponse.json(updatedBooking)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error updating booking:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
