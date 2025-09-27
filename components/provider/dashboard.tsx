"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ProviderStats {
  totalBookings: number;
  totalEarnings: number;
  activeServices: number;
  pendingServices: number;
  averageRating: number;
  totalReviews: number;
  recentBookings: Array<{
    id: string;
    service: {
      title: string;
    };
    customer: {
      name: string;
    };
    scheduledAt: string;
    status: string;
    totalAmount: number;
  }>;
}

export function ProviderDashboard() {
  const [stats, setStats] = useState<ProviderStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch data from multiple endpoints
        const [bookingsRes, servicesRes, paymentsRes, reviewsRes] =
          await Promise.all([
            fetch("/api/bookings/provider"),
            fetch("/api/services/provider"),
            fetch("/api/payments/provider?status=COMPLETED"),
            fetch("/api/reviews/provider"),
          ]);

        if (
          bookingsRes.ok &&
          servicesRes.ok &&
          paymentsRes.ok &&
          reviewsRes.ok
        ) {
          const [bookings, services, payments, reviews] = await Promise.all([
            bookingsRes.json(),
            servicesRes.json(),
            paymentsRes.json(),
            reviewsRes.json(),
          ]);

          const totalEarnings = payments.reduce(
            (sum: number, payment: any) => sum + payment.amount,
            0
          );
          const activeServices = services.filter(
            (service: any) => service.status === "ACTIVE"
          ).length;
          const pendingServices = services.filter(
            (service: any) => service.status === "PENDING_APPROVAL"
          ).length;
          const averageRating =
            reviews.length > 0
              ? reviews.reduce(
                  (sum: number, review: any) => sum + review.rating,
                  0
                ) / reviews.length
              : 0;

          // Get recent bookings (last 5)
          const recentBookings = bookings
            .sort(
              (a: any, b: any) =>
                new Date(b.scheduledAt).getTime() -
                new Date(a.scheduledAt).getTime()
            )
            .slice(0, 5);

          setStats({
            totalBookings: bookings.length,
            totalEarnings,
            activeServices,
            pendingServices,
            averageRating: Math.round(averageRating * 10) / 10,
            totalReviews: reviews.length,
            recentBookings,
          });
        } else {
          console.error("Failed to fetch provider stats");
        }
      } catch (error) {
        console.error("Error fetching provider stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-32"></div>
            <div className="h-4 bg-gray-200 rounded w-48"></div>
          </CardHeader>
          <CardContent>
            <div className="h-16 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <p className="text-center text-muted-foreground">
          Failed to load dashboard data.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground">All time bookings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rp {stats.totalEarnings.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Total completed payments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeServices}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingServices} pending approval
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageRating}</div>
            <p className="text-xs text-muted-foreground">
              Based on {stats.totalReviews} reviews
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
          <CardDescription>Your latest service bookings</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentBookings.length > 0 ? (
            <div className="space-y-4">
              {stats.recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{booking.service.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {booking.customer.name} •{" "}
                      {new Date(booking.scheduledAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      Rp {booking.totalAmount.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {booking.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">
              No recent bookings to display.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
