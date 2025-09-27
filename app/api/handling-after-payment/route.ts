import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { prisma } from "@/lib/db"

// Xendit webhook endpoint for payment notifications
export async function POST(request: NextRequest) {
  try {
    console.log("Received Xendit webhook notification")

    const headersList = await headers()
    const webhookToken = headersList.get("x-callback-token")

    // Verify webhook token (if configured)
    if (process.env.XENDIT_WEBHOOK_TOKEN && webhookToken !== process.env.XENDIT_WEBHOOK_TOKEN) {
      console.error("Invalid webhook token")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    console.log("Xendit webhook payload:", JSON.stringify(body, null, 2))

    // Extract required fields from Xendit webhook
    const {
      event,
      data: webhookData,
      created,
      id: webhookId
    } = body

    if (!webhookData?.external_id || !event) {
      console.error("Invalid webhook data: missing external_id or event")
      return NextResponse.json({ error: "Invalid webhook data" }, { status: 400 })
    }

    // Extract booking ID from external_id (format: JASAKU-bookingId-paymentId)
    const externalIdMatch = webhookData.external_id.match(/JASAKU-(.+?)-(.+)$/)
    if (!externalIdMatch) {
      console.error("Invalid external_id format:", webhookData.external_id)
      return NextResponse.json({ error: "Invalid external ID format" }, { status: 400 })
    }

    const bookingId = externalIdMatch[1]
    const paymentId = externalIdMatch[2]
    console.log("Extracted booking ID:", bookingId, "payment ID:", paymentId)

    // Update payment and booking status based on Xendit event
    let paymentStatus: string
    let bookingStatus: string

    switch (event) {
      case "invoice.paid":
        paymentStatus = "COMPLETED"
        bookingStatus = "CONFIRMED"
        break
      case "invoice.expired":
        paymentStatus = "CANCELLED"
        bookingStatus = "CANCELLED"
        break
      case "invoice.failed":
        paymentStatus = "FAILED"
        bookingStatus = "CANCELLED"
        break
      default:
        console.log("Unhandled Xendit event:", event)
        return NextResponse.json({
          message: "Event acknowledged but not processed",
          event
        })
    }

    console.log(`Updating payment status to: ${paymentStatus}, booking status to: ${bookingStatus}`)

    // Update payment
    const paymentUpdate = await prisma.payment.updateMany({
      where: { bookingId, transactionId: webhookData.id },
      data: {
        status: paymentStatus as any,
        paidAt: paymentStatus === "COMPLETED" ? new Date() : null
      }
    })

    console.log("Payment update result:", paymentUpdate)

    // Update booking status
    const bookingUpdate = await prisma.booking.updateMany({
      where: { id: bookingId },
      data: { status: bookingStatus as any }
    })

    console.log("Booking update result:", bookingUpdate)

    // Log the successful webhook processing
    console.log(`Successfully processed Xendit webhook for booking ${bookingId}: ${event}`)

    return NextResponse.json({
      message: "Webhook processed successfully",
      external_id: webhookData.external_id,
      event,
      payment_status: paymentStatus,
      booking_status: bookingStatus
    })

  } catch (error) {
    console.error("Error processing Xendit webhook:", error)
    return NextResponse.json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// Also handle GET requests (for testing)
export async function GET() {
  return NextResponse.json({
    message: "Xendit webhook endpoint is active",
    timestamp: new Date().toISOString()
  })
}
