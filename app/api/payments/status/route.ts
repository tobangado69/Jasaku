import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

// Get all pending payments for debugging
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const showAll = searchParams.get("all") === "true"
    const bookingId = searchParams.get("bookingId")

    // Build where clause
    let where: any = {}
    
    if (bookingId) {
      where.bookingId = bookingId
    } else if (!showAll) {
      // Show only pending payments by default
      where.status = "PENDING"
    }

    // Get payments with full details
    const payments = await prisma.payment.findMany({
      where,
      include: {
        booking: {
          include: {
            service: {
              select: { title: true }
            },
            customer: {
              select: { name: true, email: true, id: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: showAll ? undefined : 10
    })

    const enhancedPayments = payments.map(payment => ({
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      transactionId: payment.transactionId,
      paidAt: payment.paidAt,
      createdAt: payment.createdAt,
      booking: {
        id: payment.booking.id,
        status: payment.booking.status,
        service: payment.booking.service.title,
        customer: {
          id: payment.booking.customer.id,
          name: payment.booking.customer.name,
          email: payment.booking.customer.email
        },
        scheduledAt: payment.booking.scheduledAt
      },
      // Debug info
      debug: {
        externalId: `JASAKU-${payment.booking.id}-${payment.id}`,
        hasTransactionId: !!payment.transactionId,
        daysSinceCreated: Math.floor((Date.now() - payment.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      }
    }))

    return NextResponse.json({
      success: true,
      count: enhancedPayments.length,
      filters: { showAll, bookingId },
      payments: enhancedPayments
    })

  } catch (error) {
    console.error("Error fetching payment status:", error)
    return NextResponse.json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// Manually trigger webhook for a specific payment (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 401 })
    }

    const body = await request.json()
    const { bookingId, event = "invoice.paid", paymentMethod = "BCA Virtual Account" } = body

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId required" }, { status: 400 })
    }

    // Find the payment
    const payment = await prisma.payment.findFirst({
      where: { bookingId },
      include: {
        booking: true
      }
    })

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // Create webhook payload
    const webhookPayload = {
      event,
      data: {
        id: payment.transactionId || `manual-${Date.now()}`,
        external_id: `JASAKU-${bookingId}-${payment.id}`,
        status: event === "invoice.paid" ? "PAID" : "PENDING",
        amount: payment.amount,
        paid_amount: payment.amount,
        payment_method: {
          type: paymentMethod.includes("BCA") ? "BANK_TRANSFER" : 
                paymentMethod.includes("GoPay") ? "EWALLET" : "QRIS",
          bank_code: paymentMethod.includes("BCA") ? "BCA" : undefined,
          ewallet_type: paymentMethod.includes("GoPay") ? "GOPAY" : undefined
        },
        bank_code: paymentMethod.includes("BCA") ? "BCA" : undefined,
        ewallet_type: paymentMethod.includes("GoPay") ? "GOPAY" : undefined,
        paid_at: new Date().toISOString()
      },
      created: new Date().toISOString(),
      id: `webhook-manual-${Date.now()}`
    }

    console.log("🧪 MANUAL WEBHOOK TRIGGER:", {
      bookingId,
      paymentId: payment.id,
      currentStatus: payment.status,
      targetEvent: event,
      payload: webhookPayload
    })

    // Call webhook endpoint directly
    const webhookUrl = `${process.env.NEXTAUTH_URL}/api/xendit-webhook`
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-callback-token': process.env.XENDIT_WEBHOOK_TOKEN || '',
      },
      body: JSON.stringify(webhookPayload)
    })

    const result = await response.json()

    // Check if update was successful
    const updatedPayment = await prisma.payment.findUnique({
      where: { id: payment.id },
      include: {
        booking: true
      }
    })

    return NextResponse.json({
      success: true,
      message: "Manual webhook triggered",
      webhook: {
        url: webhookUrl,
        status: response.status,
        response: result
      },
      before: {
        paymentStatus: payment.status,
        bookingStatus: payment.booking.status,
        paymentMethod: payment.paymentMethod
      },
      after: {
        paymentStatus: updatedPayment?.status,
        bookingStatus: updatedPayment?.booking.status,
        paymentMethod: updatedPayment?.paymentMethod
      },
      payload: webhookPayload
    })

  } catch (error) {
    console.error("Error triggering manual webhook:", error)
    return NextResponse.json({
      error: "Failed to trigger manual webhook",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
