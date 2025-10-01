import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Xendit } from "xendit-node"

const xendit = new Xendit({
  secretKey: process.env.XENDIT_API_KEY!
})

// Get available payment methods from Xendit
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Static configuration of Indonesian payment methods supported by Xendit
    // This reflects the actual payment methods available in Indonesia
    const availablePaymentMethods = {
      bank_transfer: [
        { code: 'BCA', name: 'BCA Virtual Account', type: 'BANK_TRANSFER' },
        { code: 'BNI', name: 'BNI Virtual Account', type: 'BANK_TRANSFER' },
        { code: 'BRI', name: 'BRI Virtual Account', type: 'BANK_TRANSFER' },
        { code: 'MANDIRI', name: 'Mandiri Virtual Account', type: 'BANK_TRANSFER' },
        { code: 'PERMATA', name: 'Permata Virtual Account', type: 'BANK_TRANSFER' },
        { code: 'SAHABAT_SAMPOERNA', name: 'Sahabat Sampoerna Virtual Account', type: 'BANK_TRANSFER' },
        { code: 'BJB', name: 'BJB Virtual Account', type: 'BANK_TRANSFER' },
        { code: 'CIMB', name: 'CIMB Virtual Account', type: 'BANK_TRANSFER' }
      ],
      ewallet: [
        { code: 'GOPAY', name: 'GoPay', type: 'EWALLET' },
        { code: 'OVO', name: 'OVO', type: 'EWALLET' },
        { code: 'DANA', name: 'DANA', type: 'EWALLET' },
        { code: 'SHOPEEPAY', name: 'ShopeePay', type: 'EWALLET' },
        { code: 'LINKAJA', name: 'LinkAja', type: 'EWALLET' },
        { code: 'JENIUS', name: 'Jenius', type: 'EWALLET' },
        { code: 'ASTRAPAY', name: 'AstraPay', type: 'EWALLET' }
      ],
      qris: [
        { code: 'QRIS', name: 'QRIS (Scan to Pay)', type: 'QRIS' }
      ],
      credit_card: [
        { code: 'CREDIT_CARD', name: 'Credit/Debit Card', type: 'CREDIT_CARD' }
      ],
      retail_outlet: [
        { code: 'ALFAMART', name: 'Alfamart', type: 'RETAIL_OUTLET' },
        { code: 'INDOMARET', name: 'Indomaret', type: 'RETAIL_OUTLET' }
      ]
    }

    // In a production environment, you might want to call Xendit's API
    // to get the actual available payment methods for your account
    // For now, we'll return the comprehensive list of Indonesian payment methods
    
    const response = {
      success: true,
      data: availablePaymentMethods,
      message: "Available payment methods retrieved successfully"
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error("Error fetching payment methods:", error)
    return NextResponse.json({ 
      error: "Failed to fetch payment methods",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// Get payment method capabilities (fees, limits, etc.)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { paymentMethod, amount } = body

    // Return capabilities for different payment methods
    const capabilities: { [key: string]: any } = {
      QRIS: {
        minAmount: 1000, // Rp 1,000
        maxAmount: 20000000, // Rp 20,000,000
        processingTime: "Real-time",
        fee: "Free for customers"
      },
      BCA: {
        minAmount: 10000, // Rp 10,000
        maxAmount: 50000000, // Rp 50,000,000
        processingTime: "Real-time",
        fee: "Free for customers"
      },
      GOPAY: {
        minAmount: 1000,
        maxAmount: 20000000,
        processingTime: "Real-time",
        fee: "Free for customers"
      },
      OVO: {
        minAmount: 1000,
        maxAmount: 10000000,
        processingTime: "Real-time",
        fee: "Free for customers"
      },
      DANA: {
        minAmount: 1000,
        maxAmount: 20000000,
        processingTime: "Real-time", 
        fee: "Free for customers"
      }
    }

    const methodCapabilities = capabilities[paymentMethod] || {
      minAmount: 1000,
      maxAmount: 50000000,
      processingTime: "1-3 business days",
      fee: "Varies"
    }

    // Check if amount is within limits
    const isAmountValid = amount >= methodCapabilities.minAmount && amount <= methodCapabilities.maxAmount

    return NextResponse.json({
      success: true,
      paymentMethod,
      amount,
      capabilities: methodCapabilities,
      isAmountValid,
      message: isAmountValid ? "Payment method is available for this amount" : "Amount is outside allowed limits"
    })

  } catch (error) {
    console.error("Error checking payment method capabilities:", error)
    return NextResponse.json({ 
      error: "Failed to check payment method capabilities",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
