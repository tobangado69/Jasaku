import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== "PROVIDER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const limit = parseInt(searchParams.get("limit") || "10")
    const offset = parseInt(searchParams.get("offset") || "0")

    const where: any = {
      providerId: (session.user as any)?.id
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
        review: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true
          }
        },
        payment: true
      },
      orderBy: {
        scheduledAt: "asc"
      }
    })

    // Transform the data to match the expected interface
    const transformedBookings = bookings.map(booking => ({
      id: booking.id,
      status: booking.status,
      scheduledAt: booking.scheduledAt.toISOString(),
      completedAt: booking.completedAt?.toISOString(),
      notes: booking.notes,
      totalAmount: booking.totalAmount,
      service: {
        id: booking.service.id,
        title: booking.service.title,
        category: booking.service.category,
      },
      customer: {
        id: booking.customer.id,
        name: booking.customer.name,
      },
      review: booking.review ? {
        id: booking.review.id,
        rating: booking.review.rating,
        comment: booking.review.comment,
      } : undefined,
      createdAt: booking.createdAt.toISOString(),
      updatedAt: booking.updatedAt.toISOString(),
    }))

    return NextResponse.json(transformedBookings)
  } catch (error) {
    console.error("Error fetching provider bookings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
