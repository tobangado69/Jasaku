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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  MapPin,
  Clock,
  Star,
  MessageCircle,
  X,
  CreditCard,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { SeekerPayment } from "./payment";

interface Category {
  id: string;
  name: string;
  description?: string;
}

interface Payment {
  id: string;
  amount: number;
  status: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED" | "PROCESSING";
  paymentMethod: string;
  transactionId?: string;
}

interface Booking {
  id: string;
  status: "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  scheduledAt: string;
  completedAt?: string;
  notes?: string;
  totalAmount: number;
  service: {
    id: string;
    title: string;
    category: Category | string;
    images?: string[];
  };
  provider: {
    id: string;
    name: string;
    profileImage?: string;
    phone?: string;
    location?: string;
  };
  payment?: Payment;
  review?: {
    id: string;
    rating: number;
    comment?: string;
    createdAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export function SeekerMyBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [selectedBookingForPayment, setSelectedBookingForPayment] =
    useState<Booking | null>(null);

  const getCategoryName = (category: Category | string): string => {
    if (typeof category === "string") {
      return category;
    }
    return category?.name || "Unknown Category";
  };

  const fetchBookings = async () => {
    try {
      const response = await fetch("/api/bookings");
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      } else {
        console.error("Failed to fetch bookings");
        setBookings([]);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const filteredBookings = bookings.filter((booking) => {
    if (activeTab === "upcoming") {
      return ["PENDING", "CONFIRMED", "IN_PROGRESS"].includes(booking.status);
    }
    if (activeTab === "completed") {
      return booking.status === "COMPLETED";
    }
    if (activeTab === "cancelled") {
      return booking.status === "CANCELLED";
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    const variants: {
      [key: string]: "default" | "secondary" | "destructive" | "outline";
    } = {
      PENDING: "outline",
      CONFIRMED: "default",
      IN_PROGRESS: "secondary",
      COMPLETED: "default",
      CANCELLED: "destructive",
    };

    const icons = {
      PENDING: <Clock className="h-3 w-3 mr-1" />,
      CONFIRMED: <Calendar className="h-3 w-3 mr-1" />,
      IN_PROGRESS: <Clock className="h-3 w-3 mr-1" />,
      COMPLETED: <Star className="h-3 w-3 mr-1" />,
      CANCELLED: <X className="h-3 w-3 mr-1" />,
    };

    return (
      <Badge variant={variants[status]} className="flex items-center">
        {icons[status as keyof typeof icons]}
        {status}
      </Badge>
    );
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });

      if (response.ok) {
        setBookings((prev) =>
          prev.map((booking) =>
            booking.id === bookingId
              ? { ...booking, status: "CANCELLED" as const }
              : booking
          )
        );
        alert("Booking cancelled successfully!");
      } else {
        alert("Failed to cancel booking");
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
      alert("Failed to cancel booking");
    }
  };

  const handleContactProvider = (provider: Booking["provider"]) => {
    // In a real app, this would open a chat or redirect to contact page
    alert(`Contact ${provider.name} at ${provider.phone}`);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">My Bookings</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setLoading(true);
            fetchBookings();
          }}
          disabled={loading}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="mt-6">
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <Card key={booking.id} className="overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-3">
                  <div className="md:col-span-1">
                    <img
                      src={
                        (booking.service.images && booking.service.images[0]) ||
                        "/placeholder.svg"
                      }
                      alt={booking.service.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge variant="outline" className="mb-2">
                            {getCategoryName(booking.service.category)}
                          </Badge>
                          <CardTitle>{booking.service.title}</CardTitle>
                          <CardDescription>
                            with {booking.provider.name}
                          </CardDescription>
                        </div>
                        {getStatusBadge(booking.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>
                          {new Date(booking.scheduledAt).toLocaleDateString()}{" "}
                          at{" "}
                          {new Date(booking.scheduledAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-lg">
                          Rp {booking.totalAmount.toLocaleString()}
                        </div>
                        <div className="flex gap-2">
                          {booking.status === "PENDING" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelBooking(booking.id)}
                            >
                              Cancel
                            </Button>
                          )}
                          {(booking.status === "PENDING" ||
                            (booking.status === "CONFIRMED" &&
                              !booking.payment)) && (
                            <Button
                              size="sm"
                              onClick={() =>
                                setSelectedBookingForPayment(booking)
                              }
                            >
                              <CreditCard className="h-4 w-4 mr-2" />
                              {booking.payment ? "View Payment" : "Pay Now"}
                            </Button>
                          )}
                          {booking.status !== "CANCELLED" && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() =>
                                handleContactProvider(booking.provider)
                              }
                            >
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Contact
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {filteredBookings.length === 0 && (
            <Card>
              <CardContent className="text-center py-16">
                <p className="text-muted-foreground">
                  No {activeTab} bookings.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Payment Component */}
      {selectedBookingForPayment && (
        <SeekerPayment
          bookingId={selectedBookingForPayment.id}
          onPaymentComplete={(payment) => {
            // Update the booking with payment information and status
            setBookings((prev) =>
              prev.map((booking) =>
                booking.id === selectedBookingForPayment.id
                  ? {
                      ...booking,
                      payment,
                      status:
                        payment.status === "COMPLETED"
                          ? "CONFIRMED"
                          : booking.status,
                    }
                  : booking
              )
            );
            setSelectedBookingForPayment(null);

            // Refresh the entire booking list to ensure we have the latest data
            setTimeout(() => {
              fetchBookings();
            }, 1000);
          }}
          onPaymentCancel={() => setSelectedBookingForPayment(null)}
        />
      )}
    </div>
  );
}
