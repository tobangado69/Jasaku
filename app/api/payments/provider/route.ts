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
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    const where: any = {
      booking: {
        providerId: (session.user as any)?.id
      }
    }

    if (status) where.status = status

    const payments = await prisma.payment.findMany({
      where,
      take: limit,
      skip: offset,
      include: {
        booking: {
          select: {
            id: true,
            service: {
              select: {
                id: true,
                title: true,
              }
            },
            customer: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    // Transform the data to match the expected interface
    const transformedPayments = payments.map(payment => ({
      id: payment.id,
      amount: payment.amount,
      status: payment.status,
      paymentMethod: payment.paymentMethod || "Unknown",
      booking: {
        id: payment.booking.id,
        service: {
          title: payment.booking.service.title,
        },
        customer: {
          name: payment.booking.customer.name,
        }
      },
      completedAt: payment.paidAt?.toISOString() || payment.createdAt.toISOString(),
    }))

    return NextResponse.json(transformedPayments)
  } catch (error) {
    console.error("Error fetching provider payments:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
