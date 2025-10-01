/**
 * EXAMPLE: Refactored bookings API route using new auth utilities
 * This demonstrates the improved authentication pattern
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { 
  requireAuth, 
  requireRole, 
  requireOwnershipOrAdmin,
  createAuthErrorResponse 
} from "@/lib/auth/middleware"

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

/**
 * GET /api/bookings - Get bookings for authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await requireAuth()
    if (!authResult.success || !authResult.session) {
      return createAuthErrorResponse(authResult)
    }

    const { user } = authResult.session
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const limit = parseInt(searchParams.get("limit") || "10")
    const offset = parseInt(searchParams.get("offset") || "0")

    // Build query based on user role
    const where: any = {
      OR: [
        { customerId: user.id },
        { providerId: user.id }
      ]
    }

    if (status) {
      where.status = status
    }

    // Admins can see all bookings
    if (user.role === "ADMIN") {
      delete where.OR
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        service: {
          select: {
            id: true,
            title: true,
            category: true,
          }
        },
        provider: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        payment: true,
        review: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    })

    const total = await prisma.booking.count({ where })

    return NextResponse.json({
      bookings,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      }
    })
  } catch (error) {
    console.error("Error fetching bookings:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/bookings - Create new booking (seeker only)
 */
export async function POST(request: NextRequest) {
  try {
    // Require SEEKER role
    const authResult = await requireRole(["SEEKER"])
    if (!authResult.success || !authResult.session) {
      return createAuthErrorResponse(authResult)
    }

    const { user } = authResult.session
    const body = await request.json()
    const validatedData = createBookingSchema.parse(body)

    // Get service details
    const service = await prisma.service.findUnique({
      where: { id: validatedData.serviceId },
      include: { provider: true }
    })

    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      )
    }

    // Check if service is available
    if (service.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Service is not available" },
        { status: 400 }
      )
    }

    // Check for conflicting bookings
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
      return NextResponse.json(
        { error: "Time slot is already booked" },
        { status: 400 }
      )
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        serviceId: validatedData.serviceId,
        customerId: user.id,
        providerId: service.provider.id,
        scheduledAt: new Date(validatedData.scheduledAt),
        notes: validatedData.notes,
        totalAmount: service.price,
        status: "PENDING"
      },
      include: {
        service: true,
        provider: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    return NextResponse.json(booking, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error creating booking:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/bookings/[id] - Update booking
 */
export async function PATCH(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await requireAuth()
    if (!authResult.success || !authResult.session) {
      return createAuthErrorResponse(authResult)
    }

    const { user } = authResult.session
    const { pathname } = new URL(request.url)
    const bookingId = pathname.split('/').pop()

    if (!bookingId) {
      return NextResponse.json(
        { error: "Booking ID required" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = updateBookingSchema.parse(body)

    // Check if booking exists and get ownership info
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        providerId: true,
        customerId: true,
      }
    })

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      )
    }

    // Check authorization - provider, customer, or admin
    const isProvider = booking.providerId === user.id
    const isCustomer = booking.customerId === user.id
    const isAdmin = user.role === "ADMIN"

    if (!isProvider && !isCustomer && !isAdmin) {
      return NextResponse.json(
        { error: "Forbidden - You don't have access to this booking" },
        { status: 403 }
      )
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
        provider: {
          select: {
            id: true,
            name: true,
          }
        },
        review: true,
      }
    })

    return NextResponse.json(updatedBooking)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error updating booking:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

