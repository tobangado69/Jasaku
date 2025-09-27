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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  XCircle,
  TrendingDown,
  Search,
  Filter,
  DollarSign,
} from "lucide-react";

interface AdminPayment {
  id: string;
  amount: number;
  status: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED" | "REFUNDED";
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

function AdminPayments() {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [selectedPaymentForRefund, setSelectedPaymentForRefund] =
    useState<AdminPayment | null>(null);
  const [refundForm, setRefundForm] = useState({
    reason: "",
    amount: "",
  });
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await fetch("/api/payments");
        if (response.ok) {
          const data = await response.json();
          setPayments(data);
        } else {
          console.error("Failed to fetch payments");
          setPayments([]);
        }
      } catch (error) {
        console.error("Error fetching payments:", error);
        setPayments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.booking.service.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      payment.booking.customer.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants: {
      [key: string]: "default" | "secondary" | "destructive" | "outline";
    } = {
      COMPLETED: "default",
      PENDING: "outline",
      FAILED: "destructive",
      CANCELLED: "destructive",
      REFUNDED: "secondary",
    };

    const icons = {
      COMPLETED: <CheckCircle className="h-3 w-3 mr-1" />,
      PENDING: <DollarSign className="h-3 w-3 mr-1" />,
      FAILED: <XCircle className="h-3 w-3 mr-1" />,
      CANCELLED: <XCircle className="h-3 w-3 mr-1" />,
      REFUNDED: <TrendingDown className="h-3 w-3 mr-1" />,
    };

    return (
      <Badge variant={variants[status]} className="flex items-center">
        {icons[status as keyof typeof icons]}
        {status}
      </Badge>
    );
  };

  const handleApprovePayment = async (paymentId: string) => {
    try {
      const response = await fetch(
        `/api/payments?paymentId=${paymentId}&action=approve`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Update the payment in the list
        setPayments((prev) =>
          prev.map((payment) =>
            payment.id === paymentId ? data.payment : payment
          )
        );
        alert("Payment approved successfully!");
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || "Failed to approve payment");
      }
    } catch (error) {
      console.error("Error approving payment:", error);
      alert("Failed to approve payment. Please try again.");
    }
  };

  const handleRefundPayment = (payment: AdminPayment) => {
    setSelectedPaymentForRefund(payment);
    setRefundForm({
      reason: "",
      amount: payment.amount.toString(),
    });
    setIsRefundDialogOpen(true);
  };

  const handleRefundSubmit = async () => {
    if (!selectedPaymentForRefund) return;

    if (!refundForm.reason.trim()) {
      alert("Please provide a reason for the refund");
      return;
    }

    if (!refundForm.amount || parseFloat(refundForm.amount) <= 0) {
      alert("Please provide a valid refund amount");
      return;
    }

    try {
      setIsProcessingRefund(true);
      const response = await fetch(
        `/api/payments/${selectedPaymentForRefund.id}/refund`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reason: refundForm.reason,
            amount: parseFloat(refundForm.amount),
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Update the payment in the list
        setPayments((prev) =>
          prev.map((payment) =>
            payment.id === selectedPaymentForRefund.id ? data.payment : payment
          )
        );
        setIsRefundDialogOpen(false);
        setSelectedPaymentForRefund(null);
        setRefundForm({ reason: "", amount: "" });
        alert("Payment refunded successfully!");
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || "Failed to process refund");
      }
    } catch (error) {
      console.error("Error processing refund:", error);
      alert("Failed to process refund. Please try again.");
    } finally {
      setIsProcessingRefund(false);
    }
  };

  const totalRevenue = payments
    .filter((p) => p.status === "COMPLETED")
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingPayments = payments.filter((p) => p.status === "PENDING").length;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rp {totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              From completed payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Payments
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPayments}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting confirmation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Transactions
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payments.length}</div>
            <p className="text-xs text-muted-foreground">All payment records</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search payments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
            <SelectItem value="REFUNDED">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Management</CardTitle>
          <CardDescription>
            Monitor and manage platform payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredPayments.map((payment) => (
              <div key={payment.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-medium">
                        {payment.booking.service.title}
                      </h3>
                      {getStatusBadge(payment.status)}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <div>
                          <strong>Customer:</strong>{" "}
                          {payment.booking.customer.name}
                        </div>
                        <div>
                          <strong>Method:</strong> {payment.paymentMethod}
                        </div>
                      </div>
                      <div>
                        <div>
                          <strong>Amount:</strong> Rp{" "}
                          {payment.amount.toLocaleString()}
                        </div>
                        <div>
                          <strong>Transaction ID:</strong>{" "}
                          {payment.transactionId || "N/A"}
                        </div>
                        <div>
                          <strong>Date:</strong>{" "}
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2 ml-4">
                    {payment.status === "PENDING" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleApprovePayment(payment.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    )}

                    {payment.status === "COMPLETED" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRefundPayment(payment)}
                      >
                        <TrendingDown className="h-4 w-4 mr-1" />
                        Refund
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredPayments.length === 0 && (
            <p className="text-center text-gray-500 py-8">No payments found.</p>
          )}
        </CardContent>
      </Card>

      {/* Refund Dialog */}
      <Dialog open={isRefundDialogOpen} onOpenChange={setIsRefundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>
              Refund payment for{" "}
              {selectedPaymentForRefund?.booking.service.title}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="refund-amount" className="text-right">
                Amount
              </Label>
              <Input
                id="refund-amount"
                type="number"
                value={refundForm.amount}
                onChange={(e) =>
                  setRefundForm((prev) => ({ ...prev, amount: e.target.value }))
                }
                className="col-span-3"
                placeholder="Enter refund amount"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="refund-reason" className="text-right">
                Reason
              </Label>
              <Input
                id="refund-reason"
                value={refundForm.reason}
                onChange={(e) =>
                  setRefundForm((prev) => ({ ...prev, reason: e.target.value }))
                }
                className="col-span-3"
                placeholder="Reason for refund"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRefundDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleRefundSubmit} disabled={isProcessingRefund}>
              {isProcessingRefund ? "Processing..." : "Process Refund"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminPayments;
