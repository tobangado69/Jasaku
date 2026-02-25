import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

const createBookingSchema = z.object({
  serviceId: z.string(),
  scheduledAt: z.string().datetime(),
  notes: z.string().optional(),
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
            category: { select: { id: true, name: true } },
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
            phone: true,
            location: true
          }
        },
        review: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true
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

    const transformedBookings = bookings.map(booking => ({
      ...booking,
      service: {
        ...booking.service,
        category: booking.service.category?.name || "Other",
      },
    }))

    return NextResponse.json(transformedBookings)
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

    const booking = await prisma.booking.create({
      data: {
        serviceId: validatedData.serviceId,
        customerId: (session.user as any)?.id || "",
        providerId: service.provider.id,
        scheduledAt: new Date(validatedData.scheduledAt),
        notes: validatedData.notes,
        totalAmount: service.price,
        status: "PENDING"
      },
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
        }
      }
    })

    return NextResponse.json(booking, { status: 201 })
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
