import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userRole = (session.user as any)?.role
    const userId = (session.user as any)?.id

    // Only providers can access their own reviews
    if (userRole !== "PROVIDER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const reviews = await prisma.review.findMany({
      where: {
        service: {
          providerId: userId
        }
      },
      include: {
        service: {
          select: {
            id: true,
            title: true,
            category: true
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            profileImage: true
          }
        },
        booking: {
          select: {
            id: true,
            scheduledAt: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json(reviews)
  } catch (error) {
    console.error("Error fetching provider reviews:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
