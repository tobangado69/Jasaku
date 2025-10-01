import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

// Debug endpoint to check payment status and trigger manual updates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get("bookingId")
    const action = searchParams.get("action")

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId parameter required" }, { status: 400 })
    }

    // Get payment and booking details
    const payment = await prisma.payment.findFirst({
      where: { bookingId },
      include: {
        booking: {
          include: {
            service: {
              select: { title: true }
            },
            customer: {
              select: { name: true, email: true }
            }
          }
        }
      }
    })

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // Check if user has access
    const isAdmin = (session.user as any)?.role === "ADMIN"
    const isCustomer = payment.booking.customerId === (session.user as any)?.id
    
    if (!isAdmin && !isCustomer) {
      return NextResponse.json({ error: "Unauthorized access to this payment" }, { status: 401 })
    }

    // If action is "manual-complete", mark payment as completed (admin only)
    if (action === "manual-complete" && isAdmin) {
      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "COMPLETED",
          paidAt: new Date(),
          paymentMethod: payment.paymentMethod || "Manual Completion"
        }
      })

      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: "CONFIRMED",
          updatedAt: new Date()
        }
      })

      return NextResponse.json({
        message: "Payment manually marked as completed",
        payment: updatedPayment
      })
    }

    // Return debug information
    return NextResponse.json({
      payment: {
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        transactionId: payment.transactionId,
        paidAt: payment.paidAt,
        createdAt: payment.createdAt
      },
      booking: {
        id: payment.booking.id,
        status: payment.booking.status,
        customerId: payment.booking.customerId,
        service: payment.booking.service.title,
        customer: payment.booking.customer.name,
        scheduledAt: payment.booking.scheduledAt,
        updatedAt: payment.booking.updatedAt
      },
      debug: {
        canManualComplete: isAdmin,
        isCustomer,
        isAdmin,
        userId: (session.user as any)?.id
      }
    })

  } catch (error) {
    console.error("Error in payment debug:", error)
    return NextResponse.json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// Manual webhook trigger for testing (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 401 })
    }

    const body = await request.json()
    const { bookingId, event = "invoice.paid", paymentMethod = "Manual Test" } = body

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId required" }, { status: 400 })
    }

    // Find the payment
    const payment = await prisma.payment.findFirst({
      where: { bookingId }
    })

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // Create a mock webhook payload
    const mockWebhookPayload = {
      event,
      data: {
        id: payment.transactionId || `manual-${Date.now()}`,
        external_id: `JASAKU-${bookingId}-${payment.id}`,
        status: event === "invoice.paid" ? "PAID" : "PENDING",
        amount: payment.amount,
        payment_method: {
          type: paymentMethod.includes("BCA") ? "BANK_TRANSFER" : "QRIS",
          bank_code: paymentMethod.includes("BCA") ? "BCA" : undefined
        },
        paid_amount: payment.amount,
        paid_at: new Date().toISOString()
      },
      created: new Date().toISOString(),
      id: `webhook-${Date.now()}`
    }

    // Forward to webhook endpoint
    const webhookUrl = `${process.env.NEXTAUTH_URL}/api/xendit-webhook`
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-callback-token': process.env.XENDIT_WEBHOOK_TOKEN || '',
      },
      body: JSON.stringify(mockWebhookPayload)
    })

    const result = await response.json()

    return NextResponse.json({
      message: "Manual webhook triggered successfully",
      webhookResponse: result,
      mockPayload: mockWebhookPayload
    })

  } catch (error) {
    console.error("Error triggering manual webhook:", error)
    return NextResponse.json({
      error: "Failed to trigger manual webhook",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
