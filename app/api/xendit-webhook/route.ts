import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { prisma } from "@/lib/db"

// Xendit webhook endpoint for payment notifications
export async function POST(request: NextRequest) {
  try {
    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] ======= XENDIT WEBHOOK RECEIVED =======`)

    const headersList = await headers()
    const webhookToken = headersList.get("x-callback-token")
    const userAgent = headersList.get("user-agent")
    const contentType = headersList.get("content-type")

    console.log("Headers:", {
      webhookToken: webhookToken ? "Present" : "Missing",
      userAgent,
      contentType
    })

    // Verify webhook token (if configured)
    if (process.env.XENDIT_WEBHOOK_TOKEN && webhookToken !== process.env.XENDIT_WEBHOOK_TOKEN) {
      console.error("❌ Invalid webhook token")
      console.log("Expected:", process.env.XENDIT_WEBHOOK_TOKEN ? "SET" : "NOT_SET") 
      console.log("Received:", webhookToken ? "SET" : "NOT_SET")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    console.log("📦 RAW Webhook Payload:")
    console.log(JSON.stringify(body, null, 2))
    
    console.log("🔍 Parsed Webhook Structure:")
    console.log({
      event: body.event,
      data_id: body.data?.id,
      external_id: body.data?.external_id,
      status: body.data?.status,
      payment_method: body.data?.payment_method,
      amount: body.data?.amount,
      paid_amount: body.data?.paid_amount,
      payment_channel: body.data?.payment_channel,
      bank_code: body.data?.bank_code,
      ewallet_type: body.data?.ewallet_type
    })

    // Extract required fields from Xendit webhook
    const {
      event,
      data: webhookData,
      created,
      id: webhookId
    } = body

    if (!webhookData?.external_id || !event) {
      console.error("❌ Invalid webhook data: missing external_id or event")
      console.error("Missing fields:", {
        external_id: !webhookData?.external_id,
        event: !event
      })
      return NextResponse.json({ error: "Invalid webhook data" }, { status: 400 })
    }

    // Extract booking ID from external_id (format: JASAKU-bookingId-paymentId)
    console.log("🔄 Processing webhook for external_id:", webhookData.external_id)
    const externalIdMatch = webhookData.external_id.match(/JASAKU-(.+?)-(.+)$/)
    if (!externalIdMatch) {
      console.error("❌ Invalid external_id format:", webhookData.external_id)
      console.error("Expected format: JASAKU-bookingId-paymentId")
      return NextResponse.json({ error: "Invalid external ID format" }, { status: 400 })
    }

    const bookingId = externalIdMatch[1]
    const paymentId = externalIdMatch[2]
    console.log("✅ Extracted booking ID:", bookingId, "payment ID:", paymentId)
    
    // Check if booking and payment exist - use flexible matching
    const existingBooking = await prisma.booking.findUnique({
      where: { id: bookingId }
    })
    
    // Try multiple ways to find the payment:
    // 1. By transactionId (if already set)
    // 2. By bookingId only (if transactionId not set yet)
    let existingPayment = await prisma.payment.findFirst({
      where: { 
        bookingId: bookingId,
        transactionId: webhookData.id 
      }
    })
    
    // If not found by transactionId, try finding by bookingId and update the transactionId
    if (!existingPayment) {
      existingPayment = await prisma.payment.findFirst({
        where: { 
          bookingId: bookingId,
          status: "PENDING" // Only match pending payments
        }
      })
      
      if (existingPayment) {
        console.log("Found payment by bookingId, updating transactionId")
        // Update the transactionId for future webhook calls
        await prisma.payment.update({
          where: { id: existingPayment.id },
          data: { transactionId: webhookData.id }
        })
      }
    }
    
    console.log("🔍 Database lookup results:")
    console.log("- Booking:", existingBooking ? `✅ Found (ID: ${existingBooking.id}, Status: ${existingBooking.status})` : "❌ Not found")
    console.log("- Payment:", existingPayment ? `✅ Found (ID: ${existingPayment.id}, Status: ${existingPayment.status}, Method: ${existingPayment.paymentMethod})` : "❌ Not found")
    
    if (!existingBooking) {
      console.error("❌ CRITICAL: Booking not found:", bookingId)
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }
    
    if (!existingPayment) {
      console.error("❌ CRITICAL: Payment not found for booking:", bookingId)
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // Update payment and booking status based on Xendit event
    let paymentStatus: string
    let bookingStatus: string
    
    // Extract payment method from webhook data with comprehensive mapping (declare early)
    let paymentMethod = "UNKNOWN"
    
    // Log the complete webhook data structure for debugging
    console.log("Complete webhook data structure:", JSON.stringify(webhookData, null, 2))
    
    if (webhookData.payment_method) {
      const method = webhookData.payment_method
      console.log("Payment method object:", JSON.stringify(method, null, 2))
      
      switch (method.type) {
        case "BANK_TRANSFER":
          // Handle various bank codes from Indonesia
          const bankCode = method.bank_code || method.channelCode || webhookData.bank_code
          const bankMapping: { [key: string]: string } = {
            'BCA': 'BCA Virtual Account',
            'BNI': 'BNI Virtual Account', 
            'BRI': 'BRI Virtual Account',
            'MANDIRI': 'Mandiri Virtual Account',
            'PERMATA': 'Permata Virtual Account',
            'SAHABAT_SAMPOERNA': 'Sahabat Sampoerna Virtual Account',
            'BJB': 'BJB Virtual Account',
            'CIMB': 'CIMB Virtual Account'
          }
          paymentMethod = bankMapping[bankCode] || `Bank Transfer (${bankCode})`
          break
          
        case "EWALLET":
          // Handle Indonesian e-wallets
          const ewalletType = method.ewallet_type || method.channelCode || webhookData.ewallet_type
          const ewalletMapping: { [key: string]: string } = {
            'GOPAY': 'GoPay',
            'OVO': 'OVO',
            'DANA': 'DANA',
            'SHOPEEPAY': 'ShopeePay',
            'LINKAJA': 'LinkAja',
            'JENIUS': 'Jenius',
            'ASTRAPAY': 'AstraPay'
          }
          paymentMethod = ewalletMapping[ewalletType] || `E-Wallet (${ewalletType})`
          break
          
        case "QRIS":
          paymentMethod = "QRIS"
          break
          
        case "CREDIT_CARD":
          const cardType = method.card_type || 'Credit Card'
          const cardBrand = method.card_brand || ''
          paymentMethod = cardBrand ? `${cardBrand} ${cardType}` : cardType
          break
          
        case "RETAIL_OUTLET":
          const retailCode = method.retail_outlet_name || method.channelCode
          const retailMapping: { [key: string]: string } = {
            'ALFAMART': 'Alfamart',
            'INDOMARET': 'Indomaret'
          }
          paymentMethod = retailMapping[retailCode] || `Retail Outlet (${retailCode})`
          break
          
        default:
          paymentMethod = method.type || "Unknown Payment Method"
      }
    } else {
      // Fallback: try to extract from direct webhook fields
      if (webhookData.bank_code) {
        paymentMethod = `Bank Transfer (${webhookData.bank_code})`
      } else if (webhookData.ewallet_type) {
        paymentMethod = `E-Wallet (${webhookData.ewallet_type})`
      } else if (webhookData.payment_channel) {
        paymentMethod = webhookData.payment_channel
      } else if (webhookData.channel_code) {
        paymentMethod = webhookData.channel_code
      } else {
        // Check if this is a QRIS payment by examining other fields
        if (webhookData.qr_string || webhookData.qr_code) {
          paymentMethod = "QRIS"
        } else {
          paymentMethod = "Xendit Payment"
        }
      }
    }

    switch (event) {
      case "invoice.paid":
      case "invoice.completed":
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
      case "invoice.pending":
        paymentStatus = "PENDING"
        bookingStatus = "PENDING"
        break
      case "invoice.processing":
        paymentStatus = "PROCESSING"
        bookingStatus = "PENDING"
        break
      default:
        console.log("Unhandled Xendit event:", event)
        // Still try to extract payment method for unhandled events
        if (existingPayment.paymentMethod === null && paymentMethod !== "UNKNOWN") {
          await prisma.payment.update({
            where: { id: existingPayment.id },
            data: { paymentMethod: paymentMethod }
          })
        }
        return NextResponse.json({
          message: "Event acknowledged but not processed",
          event,
          external_id: webhookData.external_id
        })
    }

    console.log(`🎯 Target Status Updates:`)
    console.log(`- Payment: ${existingPayment.status} → ${paymentStatus}`)
    console.log(`- Booking: ${existingBooking.status} → ${bookingStatus}`)
    console.log(`- Payment Method: ${existingPayment.paymentMethod} → ${paymentMethod}`)
    console.log("Available webhook fields:", Object.keys(webhookData))

    // Update payment using the specific payment ID we found
    console.log("🔄 Updating payment in database...")
    const paymentUpdate = await prisma.payment.update({
      where: { 
        id: existingPayment.id
      },
      data: {
        status: paymentStatus as any,
        paymentMethod: paymentMethod,
        transactionId: webhookData.id, // Ensure transaction ID is set
        paidAt: paymentStatus === "COMPLETED" ? new Date() : null
      }
    })

    console.log("✅ Payment Successfully Updated:", {
      id: paymentUpdate.id,
      oldStatus: existingPayment.status,
      newStatus: paymentUpdate.status,
      oldMethod: existingPayment.paymentMethod,
      newMethod: paymentUpdate.paymentMethod,
      transactionId: paymentUpdate.transactionId,
      paidAt: paymentUpdate.paidAt
    })

    // Update booking status based on payment status
    if (paymentStatus === "COMPLETED") {
      const bookingUpdate = await prisma.booking.update({
        where: { id: bookingId },
        data: { 
          status: "CONFIRMED",
          updatedAt: new Date()
        }
      })
      console.log("Booking status updated to CONFIRMED after payment completion:", {
        id: bookingUpdate.id,
        status: bookingUpdate.status,
        updatedAt: bookingUpdate.updatedAt
      })
    } else if (paymentStatus === "FAILED" || paymentStatus === "CANCELLED") {
      const bookingUpdate = await prisma.booking.update({
        where: { id: bookingId },
        data: { 
          status: "CANCELLED",
          updatedAt: new Date()
        }
      })
      console.log("Booking status updated to CANCELLED after payment failure:", {
        id: bookingUpdate.id,
        status: bookingUpdate.status,
        updatedAt: bookingUpdate.updatedAt
      })
    }

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

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-callback-token',
    },
  })
}
