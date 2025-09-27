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
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  MessageCircle,
} from "lucide-react";

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
    category: string;
  };
  customer: {
    id: string;
    name: string;
  };
  review?: {
    id: string;
    rating: number;
    comment?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export function ProviderBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch("/api/bookings/provider");
        if (response.ok) {
          const data = await response.json();
          setBookings(data);
        } else {
          console.error("Failed to fetch bookings");
          // Fallback to empty array
          setBookings([]);
        }
      } catch (error) {
        console.error("Error fetching bookings:", error);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

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
      CONFIRMED: <CheckCircle className="h-3 w-3 mr-1" />,
      IN_PROGRESS: <Clock className="h-3 w-3 mr-1" />,
      COMPLETED: <CheckCircle className="h-3 w-3 mr-1" />,
      CANCELLED: <XCircle className="h-3 w-3 mr-1" />,
    };

    return (
      <Badge variant={variants[status]} className="flex items-center">
        {icons[status as keyof typeof icons]}
        {status}
      </Badge>
    );
  };

  const handleAcceptBooking = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CONFIRMED" }),
      });

      if (response.ok) {
        const data = await response.json();
        setBookings((prev) =>
          prev.map((booking) => (booking.id === bookingId ? data : booking))
        );
        alert("Booking accepted successfully!");
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || "Failed to accept booking");
      }
    } catch (error) {
      console.error("Error accepting booking:", error);
      alert("Failed to accept booking. Please try again.");
    }
  };

  const handleDeclineBooking = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });

      if (response.ok) {
        const data = await response.json();
        setBookings((prev) =>
          prev.map((booking) => (booking.id === bookingId ? data : booking))
        );
        alert("Booking declined successfully!");
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || "Failed to decline booking");
      }
    } catch (error) {
      console.error("Error declining booking:", error);
      alert("Failed to decline booking. Please try again.");
    }
  };

  const handleStartBooking = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "IN_PROGRESS" }),
      });

      if (response.ok) {
        const data = await response.json();
        setBookings((prev) =>
          prev.map((booking) => (booking.id === bookingId ? data : booking))
        );
        alert("Service started successfully!");
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || "Failed to start service");
      }
    } catch (error) {
      console.error("Error starting service:", error);
      alert("Failed to start service. Please try again.");
    }
  };

  const handleCompleteBooking = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "COMPLETED",
          completedAt: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setBookings((prev) =>
          prev.map((booking) => (booking.id === bookingId ? data : booking))
        );
        alert("Service completed successfully!");
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || "Failed to complete service");
      }
    } catch (error) {
      console.error("Error completing service:", error);
      alert("Failed to complete service. Please try again.");
    }
  };

  const handleContactCustomer = async (bookingId: string) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (booking) {
      // Redirect to messaging or open messaging modal
      // For now, we'll just show an alert, but this could be enhanced
      // to redirect to a messaging interface
      alert(`Redirecting to message ${booking.customer.name}...`);
      // In a real implementation, you might navigate to a messaging page:
      // router.push(`/provider/messages?bookingId=${bookingId}`);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {bookings.map((booking) => (
          <Card key={booking.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {booking.service.title}
                </CardTitle>
                {getStatusBadge(booking.status)}
              </div>
              <CardDescription>{booking.service.category}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  {new Date(booking.scheduledAt).toLocaleDateString()} at{" "}
                  {new Date(booking.scheduledAt).toLocaleTimeString()}
                </div>
                <div className="text-sm">
                  <strong>Customer:</strong> {booking.customer.name}
                </div>
                {booking.notes && (
                  <div className="text-sm text-gray-600">
                    <strong>Notes:</strong> {booking.notes}
                  </div>
                )}

                {booking.status === "PENDING" && (
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      onClick={() => handleAcceptBooking(booking.id)}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeclineBooking(booking.id)}
                    >
                      Decline
                    </Button>
                  </div>
                )}

                {booking.status === "CONFIRMED" && (
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      onClick={() => handleStartBooking(booking.id)}
                    >
                      Start Service
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleContactCustomer(booking.id)}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Contact
                    </Button>
                  </div>
                )}

                {booking.status === "IN_PROGRESS" && (
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      onClick={() => handleCompleteBooking(booking.id)}
                    >
                      Complete Service
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleContactCustomer(booking.id)}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Contact
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {bookings.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No bookings found.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
