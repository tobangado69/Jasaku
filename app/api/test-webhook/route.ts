import { NextRequest, NextResponse } from "next/server"

// Test endpoint to simulate Xendit webhook calls for development
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("Test webhook received:", JSON.stringify(body, null, 2))

    // Forward to actual webhook endpoint
    const webhookUrl = `${process.env.NEXTAUTH_URL}/api/xendit-webhook`
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-callback-token': process.env.XENDIT_WEBHOOK_TOKEN || '',
      },
      body: JSON.stringify(body)
    })

    const result = await response.json()
    
    return NextResponse.json({
      success: true,
      message: "Test webhook forwarded successfully",
      webhookResponse: result,
      originalPayload: body
    })

  } catch (error) {
    console.error("Error in test webhook:", error)
    return NextResponse.json({
      error: "Test webhook failed",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// Sample webhook payloads for testing different payment methods
export async function GET() {
  const samplePayloads = {
    bca_virtual_account: {
      event: "invoice.paid",
      data: {
        id: "test-invoice-123",
        external_id: "JASAKU-booking123-payment456",
        status: "PAID",
        amount: 100000,
        payment_method: {
          type: "BANK_TRANSFER",
          bank_code: "BCA",
          channel_code: "BCA"
        },
        bank_code: "BCA",
        paid_amount: 100000,
        paid_at: new Date().toISOString()
      },
      created: new Date().toISOString(),
      id: "webhook-event-123"
    },
    gopay_payment: {
      event: "invoice.paid", 
      data: {
        id: "test-invoice-124",
        external_id: "JASAKU-booking123-payment456",
        status: "PAID",
        amount: 100000,
        payment_method: {
          type: "EWALLET",
          ewallet_type: "GOPAY",
          channel_code: "GOPAY"
        },
        ewallet_type: "GOPAY",
        paid_amount: 100000,
        paid_at: new Date().toISOString()
      },
      created: new Date().toISOString(),
      id: "webhook-event-124"
    },
    qris_payment: {
      event: "invoice.paid",
      data: {
        id: "test-invoice-125", 
        external_id: "JASAKU-booking123-payment456",
        status: "PAID",
        amount: 100000,
        payment_method: {
          type: "QRIS",
          channel_code: "QRIS"
        },
        qr_string: "test-qr-string",
        paid_amount: 100000,
        paid_at: new Date().toISOString()
      },
      created: new Date().toISOString(),
      id: "webhook-event-125"
    }
  }

  return NextResponse.json({
    message: "Sample webhook payloads for testing",
    samples: samplePayloads,
    usage: "Send POST requests to /api/test-webhook with these payloads to test different payment methods"
  })
}