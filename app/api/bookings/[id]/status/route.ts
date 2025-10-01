import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const bookingId = params.id

    // Get booking with payment details
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payment: true,
        service: {
          select: {
            title: true,
            provider: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    // Check if user is authorized to view this booking
    const userRole = (session.user as any)?.role
    const isCustomer = booking.customerId === (session.user as any)?.id
    const isProvider = booking.providerId === (session.user as any)?.id
    const isAdmin = userRole === "ADMIN"

    if (!isCustomer && !isProvider && !isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    return NextResponse.json({
      booking: {
        id: booking.id,
        status: booking.status,
        totalAmount: booking.totalAmount,
        scheduledAt: booking.scheduledAt,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        service: booking.service,
        payment: booking.payment
      }
    })

  } catch (error) {
    console.error("Error fetching booking status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
