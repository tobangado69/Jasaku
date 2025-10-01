"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  DollarSign,
  Calendar,
  Package,
  Star,
  MoreHorizontal,
} from "lucide-react";

// Mock data for earnings chart
const earningsData = [
  { month: "Jan", earnings: 1200 },
  { month: "Feb", earnings: 1800 },
  { month: "Mar", earnings: 1500 },
  { month: "Apr", earnings: 2200 },
  { month: "May", earnings: 2500 },
  { month: "Jun", earnings: 2300 },
];

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
      <div className="space-y-6 w-full px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 w-full">
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
      <div className="space-y-6 w-full px-4 sm:px-6 lg:px-8">
        <p className="text-center text-muted-foreground">
          Failed to load dashboard data.
        </p>
      </div>
    );
  }

  const kpiData = [
    {
      label: "Total Earnings",
      value: `Rp ${stats.totalEarnings.toLocaleString()}`,
      description: "All-time earnings",
      icon: DollarSign,
    },
    {
      label: "Total Bookings",
      value: stats.totalBookings,
      description: "All-time bookings",
      icon: Calendar,
    },
    {
      label: "Active Services",
      value: stats.activeServices,
      description: `${stats.pendingServices} pending`,
      icon: Package,
    },
    {
      label: "Average Rating",
      value: stats.averageRating,
      description: `from ${stats.totalReviews} reviews`,
      icon: Star,
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((item, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.label}
              </CardTitle>
              <item.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
              <p className="text-xs text-muted-foreground">
                {item.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Earnings</CardTitle>
            <CardDescription>
              Your earnings over the last 6 months.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={earningsData}>
                <defs>
                  <linearGradient
                    id="colorEarnings"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="earnings"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorEarnings)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
            <CardDescription>Your 5 most recent bookings.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div className="font-medium">{booking.customer.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(booking.scheduledAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>{booking.service.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{booking.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Contact Customer</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
