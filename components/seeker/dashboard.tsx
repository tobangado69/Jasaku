"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, Heart, Star } from "lucide-react";

interface DashboardData {
  stats: {
    totalBookings: number;
    completedBookings: number;
    totalSpent: number;
    favoriteProviders: number;
  };
  recentBookings: Array<{
    id: string;
    status: string;
    scheduledAt: string;
    totalAmount: number;
    service: {
      title: string;
      category: string;
      provider?: {
        name: string;
      };
    };
  }>;
}

export function SeekerDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await fetch("/api/dashboard?type=seeker");
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error("Error fetching dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const stats = data?.stats || {
    totalBookings: 0,
    completedBookings: 0,
    totalSpent: 0,
    favoriteProviders: 0,
  };

  const getStatusVariant = (
    status: string
  ): "default" | "secondary" | "destructive" | "outline" => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      PENDING: "outline",
      CONFIRMED: "default",
      IN_PROGRESS: "secondary",
      COMPLETED: "default",
      CANCELLED: "destructive",
    };
    return variants[status] || "outline";
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Bookings
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedBookings} completed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rp {stats.totalSpent.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Favorites</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.favoriteProviders}
            </div>
            <p className="text-xs text-muted-foreground">Saved providers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.completedBookings}
            </div>
            <p className="text-xs text-muted-foreground">Services completed</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
          <CardDescription>Your latest service bookings</CardDescription>
        </CardHeader>
        <CardContent>
          {data?.recentBookings && data.recentBookings.length > 0 ? (
            <div className="space-y-4">
              {data.recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div>
                    <p className="font-medium">{booking.service.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {booking.service.provider?.name} &middot;{" "}
                      {new Date(booking.scheduledAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium">
                      Rp {booking.totalAmount.toLocaleString()}
                    </span>
                    <Badge variant={getStatusVariant(booking.status)}>
                      {booking.status}
                    </Badge>
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
