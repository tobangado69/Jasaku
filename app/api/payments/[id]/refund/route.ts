import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

const refundSchema = z.object({
  reason: z.string().min(1, "Refund reason is required"),
  amount: z.number().positive("Refund amount must be positive"),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: paymentId } = await params
    const body = await request.json()
    const validatedData = refundSchema.parse(body)

    // Check if payment exists
    const existingPayment = await prisma.payment.findUnique({
      where: { id: paymentId },
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

    if (!existingPayment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // Check if payment can be refunded
    if (existingPayment.status !== "COMPLETED") {
      return NextResponse.json({ 
        error: "Only completed payments can be refunded" 
      }, { status: 400 })
    }

    // Validate refund amount
    if (validatedData.amount > existingPayment.amount) {
      return NextResponse.json({ 
        error: "Refund amount cannot exceed original payment amount" 
      }, { status: 400 })
    }

    // Update payment status to REFUNDED
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: "REFUNDED",
        // You might want to store refund details in a separate table
        // For now, we'll just update the status
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

    // Update booking status to cancelled
    await prisma.booking.update({
      where: { id: existingPayment.bookingId },
      data: { status: "CANCELLED" }
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
      message: "Payment refunded successfully",
      payment: transformedPayment,
      refundDetails: {
        amount: validatedData.amount,
        reason: validatedData.reason,
        refundedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error processing refund:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
