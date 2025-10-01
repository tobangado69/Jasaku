import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { Xendit } from "xendit-node"

const xendit = new Xendit({
  secretKey: process.env.XENDIT_API_KEY!
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

// Helper function to get category name
function getCategoryName(category: any): string {
  if (typeof category === "string") {
    return category;
  }
  return category?.name || "Unknown Category";
}

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

    // Check if payment already exists for this booking
    const existingPayment = await prisma.payment.findUnique({
      where: { bookingId: booking.id }
    })

    if (existingPayment) {
      console.log("Payment already exists for booking:", booking.id)
      return NextResponse.json({
        error: "Payment already exists for this booking",
        paymentId: existingPayment.id
      }, { status: 409 })
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: service.price,
        paymentMethod: null, // Will be updated from Xendit webhook based on user's choice
        status: "PENDING"
      }
    })

    // Create Xendit invoice
    const orderId = `JASAKU-${booking.id}-${payment.id}`
    const customerEmail = (session.user as any)?.email || ""

    console.log("Creating Xendit invoice with external_id:", orderId)
    const customerName = (session.user as any)?.name || "Customer"
    const nameParts = customerName.split(" ")
    const givenNames = nameParts[0] || "Customer"
    const surname = nameParts.slice(1).join(" ") || ""
    
    // Validate required fields
    if (!customerEmail) {
      throw new Error("Customer email is required for invoice creation")
    }
    
    if (service.price <= 0) {
      throw new Error("Invoice amount must be greater than 0")
    }

    const invoiceData = {
        externalId: `JASAKU-${booking.id}-${payment.id}`,
        amount: service.price,
        payerEmail: customerEmail,
        description: `Payment for ${service.title}`,
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

      // Delete booking and payment if Xendit fails
      await prisma.payment.delete({ where: { id: payment.id } })
      await prisma.booking.delete({ where: { id: booking.id } })

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
