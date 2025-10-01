// Manual script to complete pending payments
// Run this if webhooks aren't working

const pendingPayments = [
  {
    paymentId: "cmg3l6id4000bqv0vl77g61n2",
    bookingId: "cmg3l6icl0009qv0v2qnv2i0x",
    transactionId: "68d914d0db77b677d9e36b5d",
  },
  {
    paymentId: "cmg3kvsnm0007qv0v6u9twjb1",
    bookingId: "cmg3kvsn80005qv0vud2whmps",
    transactionId: "68d912dcdb77b677d9e3698e",
  },
  {
    paymentId: "cmg3knmik0003qv0v20o1ae0o",
    bookingId: "cmg3knmie0001qv0vkrr69uwa",
    transactionId: "68d9115ddb77b677d9e3683e",
  },
  {
    paymentId: "cmg3k86720003pg0wg4k6hvy2",
    bookingId: "cmg3k866s0001pg0wiyliusia",
    transactionId: "68d90e8debedfc79f5e13c7e",
  },
];

async function completePayment(payment) {
  const webhookPayload = {
    event: "invoice.paid",
    data: {
      id: payment.transactionId,
      external_id: `JASAKU-${payment.bookingId}-${payment.paymentId}`,
      status: "PAID",
      amount: 100000,
      paid_amount: 100000,
      payment_method: {
        type: "BANK_TRANSFER",
        bank_code: "BCA",
      },
      bank_code: "BCA",
      paid_at: new Date().toISOString(),
    },
    created: new Date().toISOString(),
    id: `manual-webhook-${Date.now()}`,
  };

  try {
    const response = await fetch("http://localhost:3000/api/xendit-webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhookPayload),
    });

    const result = await response.json();
    console.log(`✅ Completed payment ${payment.paymentId}:`, result.message);
    return true;
  } catch (error) {
    console.error(
      `❌ Failed to complete payment ${payment.paymentId}:`,
      error.message
    );
    return false;
  }
}

async function completeAllPayments() {
  console.log(`🔄 Completing ${pendingPayments.length} pending payments...`);

  for (const payment of pendingPayments) {
    await completePayment(payment);
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second between requests
  }

  console.log("✅ All payments processed!");
}

// Run the script
completeAllPayments().catch(console.error);
