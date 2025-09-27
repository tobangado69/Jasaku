"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  QrCode,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  CreditCard,
  Banknote,
} from "lucide-react";

interface Payment {
  id: string;
  amount: number;
  status: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED" | "PROCESSING";
  paymentMethod: string;
  transactionId?: string;
  booking: {
    id: string;
    service: {
      title: string;
      provider: {
        name: string;
        email: string;
      };
    };
    customer: {
      name: string;
      email: string;
    };
    scheduledDate: string;
  };
  createdAt: string;
  completedAt?: string;
}

interface SeekerPaymentProps {
  bookingId: string;
  onPaymentComplete?: (payment: Payment) => void;
  onPaymentCancel?: () => void;
}

export function SeekerPayment({
  bookingId,
  onPaymentComplete,
  onPaymentCancel,
}: SeekerPaymentProps) {
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [xenditInvoice, setXenditInvoice] = useState<any>(null);

  // Fetch existing payment for this booking
  useEffect(() => {
    const fetchPayment = async () => {
      try {
        const response = await fetch(`/api/payments?bookingId=${bookingId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.length > 0) {
            setPayment(data[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching payment:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayment();
  }, [bookingId]);

  const handleCreatePayment = async () => {
    setIsProcessingPayment(true);

    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPayment(data.payment);
        setXenditInvoice(data.xenditInvoice);

        // Open Xendit invoice in new tab
        if (data.xenditInvoice?.invoice_url) {
          window.open(data.xenditInvoice.invoice_url, "_blank");

          // Show success message
          alert(
            "Payment page opened! Please complete your payment on the Xendit page."
          );

          // Refresh after delay to check payment status
          setTimeout(() => {
            window.location.reload();
          }, 5000);
        } else {
          alert(
            "Payment created successfully! Please check your email for payment instructions."
          );
        }

        onPaymentComplete?.(data.payment);
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to create payment");
      }
    } catch (error) {
      console.error("Error creating payment:", error);
      alert("Failed to create payment. Please try again.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: {
      [key: string]: "default" | "secondary" | "destructive" | "outline";
    } = {
      COMPLETED: "default",
      PENDING: "outline",
      PROCESSING: "outline",
      FAILED: "destructive",
      CANCELLED: "destructive",
    };

    const icons = {
      COMPLETED: <CheckCircle className="h-3 w-3 mr-1" />,
      PENDING: <Clock className="h-3 w-3 mr-1" />,
      PROCESSING: <Clock className="h-3 w-3 mr-1" />,
      FAILED: <AlertCircle className="h-3 w-3 mr-1" />,
      CANCELLED: <AlertCircle className="h-3 w-3 mr-1" />,
    };

    return (
      <Badge variant={variants[status]} className="flex items-center">
        {icons[status as keyof typeof icons]}
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  if (payment) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Payment Status
                {getStatusBadge(payment.status)}
              </CardTitle>
              <CardDescription>
                {payment.booking.service.title} -{" "}
                {payment.booking.service.provider.name}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium">Amount</div>
                <div className="text-lg font-bold">
                  Rp {payment.amount.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="font-medium">Method</div>
                <div>Xendit</div>
              </div>
              <div>
                <div className="font-medium">Transaction ID</div>
                <div className="font-mono text-xs">
                  {payment.transactionId || "N/A"}
                </div>
              </div>
              <div>
                <div className="font-medium">Date</div>
                <div>{new Date(payment.createdAt).toLocaleDateString()}</div>
              </div>
            </div>

            {xenditInvoice && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <QrCode className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-medium text-blue-900">
                      Payment Link
                    </div>
                    <div className="text-sm text-blue-700">
                      Invoice ID: {xenditInvoice.id}
                    </div>
                    <a
                      href={xenditInvoice.invoice_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline text-sm"
                    >
                      View Payment Page →
                    </a>
                  </div>
                </div>
              </div>
            )}

            {payment.status === "PENDING" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                  <div>
                    <div className="font-medium text-yellow-800">
                      Payment Pending
                    </div>
                    <div className="text-sm text-yellow-700">
                      Please complete your payment to confirm the booking.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {payment.status === "COMPLETED" && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <div>
                    <div className="font-medium text-green-800">
                      Payment Completed
                    </div>
                    <div className="text-sm text-green-700">
                      Your booking is confirmed and ready to proceed.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Complete Payment</CardTitle>
        <CardDescription>
          You will be redirected to Xendit's secure payment page to complete
          your booking.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <QrCode className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <div className="font-medium text-blue-900">Secure Payment</div>
                <div className="text-sm text-blue-700">
                  You will be redirected to Xendit's secure payment page where
                  you can choose from various payment methods including QRIS,
                  bank transfer, e-wallet, and credit card.
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={handleCreatePayment}
              disabled={isProcessingPayment}
              className="flex-1"
            >
              {isProcessingPayment ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Creating Payment...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Create Payment Link
                </>
              )}
            </Button>
            {onPaymentCancel && (
              <Button variant="outline" onClick={onPaymentCancel}>
                Cancel
              </Button>
            )}
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <CreditCard className="h-5 w-5 text-gray-600 mt-0.5" />
              <div>
                <div className="font-medium text-gray-900">
                  Payment Methods Supported
                </div>
                <div className="text-sm text-gray-700 mt-1">
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center space-x-1">
                      <QrCode className="h-4 w-4 text-green-600" />
                      <span className="text-xs">QRIS</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Banknote className="h-4 w-4 text-blue-600" />
                      <span className="text-xs">Bank Transfer</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CreditCard className="h-4 w-4 text-purple-600" />
                      <span className="text-xs">E-Wallet</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
