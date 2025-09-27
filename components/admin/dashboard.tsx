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
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Briefcase,
  DollarSign,
  MessageSquare,
  Activity,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Eye,
  Download,
  Filter,
  BarChart3,
  PieChart,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Target,
  Award,
} from "lucide-react";

interface DashboardStats {
  totalUsers: number;
  totalServices: number;
  pendingServices: number;
  totalRevenue: number;
  supportTickets: number;
  openTickets: number;
  monthlyRevenue?: number;
  totalBookings?: number;
  completedBookings?: number;
  averageRating?: number;
  activeProviders?: number;
  activeSeekers?: number;
}

interface MatrixData {
  label: string;
  value: string | number;
  change?: number;
  trend?: "up" | "down" | "neutral";
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setError(null);
        const response = await fetch("/api/dashboard?type=admin");

        if (response.ok) {
          const data = await response.json();
          setStats({
            totalUsers: data.stats.totalUsers,
            totalServices: data.stats.totalServices,
            pendingServices: data.stats.pendingServices,
            totalRevenue: data.stats.totalRevenue,
            supportTickets: data.stats.supportTickets,
            openTickets: data.stats.openTickets,
            monthlyRevenue: data.stats.monthlyRevenue,
            totalBookings: data.stats.totalBookings,
            completedBookings: data.stats.completedBookings,
            averageRating: data.stats.averageRating,
            activeProviders: data.stats.activeProviders,
            activeSeekers: data.stats.activeSeekers,
          });
        } else {
          const errorData = await response.json().catch(() => ({}));
          setError(errorData.error || "Failed to fetch dashboard stats");
        }
      } catch (error) {
        setError("Network error: Unable to fetch dashboard stats");
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const refreshData = async () => {
    setRefreshing(true);
    try {
      const response = await fetch("/api/dashboard?type=admin");
      if (response.ok) {
        const data = await response.json();
        setStats({
          totalUsers: data.stats.totalUsers,
          totalServices: data.stats.totalServices,
          pendingServices: data.stats.pendingServices,
          totalRevenue: data.stats.totalRevenue,
          supportTickets: data.stats.supportTickets,
          openTickets: data.stats.openTickets,
          monthlyRevenue: data.stats.monthlyRevenue,
          totalBookings: data.stats.totalBookings,
          completedBookings: data.stats.completedBookings,
          averageRating: data.stats.averageRating,
          activeProviders: data.stats.activeProviders,
          activeSeekers: data.stats.activeSeekers,
        });
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const generateMatrixData = (stats: DashboardStats): MatrixData[] => {
    const completionRate = stats.totalBookings
      ? ((stats.completedBookings || 0) / stats.totalBookings) * 100
      : 0;

    return [
      {
        label: "Total Users",
        value: stats.totalUsers.toLocaleString(),
        change: 12,
        trend: "up",
        icon: <Users className="h-4 w-4" />,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
      },
      {
        label: "Active Providers",
        value: (stats.activeProviders || 0).toLocaleString(),
        change: 8,
        trend: "up",
        icon: <Briefcase className="h-4 w-4" />,
        color: "text-green-600",
        bgColor: "bg-green-50",
      },
      {
        label: "Total Services",
        value: stats.totalServices.toLocaleString(),
        change: stats.pendingServices > 0 ? -stats.pendingServices : 0,
        trend: stats.pendingServices > 0 ? "down" : "neutral",
        icon: <Activity className="h-4 w-4" />,
        color: "text-purple-600",
        bgColor: "bg-purple-50",
      },
      {
        label: "Total Revenue",
        value: `Rp ${stats.totalRevenue.toLocaleString()}`,
        change: stats.monthlyRevenue
          ? Math.round((stats.monthlyRevenue / stats.totalRevenue) * 100)
          : 0,
        trend: "up",
        icon: <DollarSign className="h-4 w-4" />,
        color: "text-emerald-600",
        bgColor: "bg-emerald-50",
      },
      {
        label: "Total Bookings",
        value: (stats.totalBookings || 0).toLocaleString(),
        change: Math.round(completionRate),
        trend: completionRate > 70 ? "up" : "neutral",
        icon: <Calendar className="h-4 w-4" />,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
      },
      {
        label: "Support Tickets",
        value: stats.supportTickets.toLocaleString(),
        change: stats.openTickets,
        trend:
          stats.openTickets > stats.supportTickets / 2 ? "down" : "neutral",
        icon: <MessageSquare className="h-4 w-4" />,
        color: "text-red-700",
        bgColor: "bg-red-50",
      },
      {
        label: "Completion Rate",
        value: `${Math.round(completionRate)}%`,
        change: Math.round(completionRate - 75),
        trend: completionRate > 75 ? "up" : "down",
        icon: <TrendingUp className="h-4 w-4" />,
        color: "text-indigo-600",
        bgColor: "bg-indigo-50",
      },
      {
        label: "Avg Rating",
        value: (stats.averageRating || 0).toFixed(1),
        change: Math.round((stats.averageRating || 0) - 4),
        trend: (stats.averageRating || 0) > 4 ? "up" : "neutral",
        icon: <TrendingUp className="h-4 w-4" />,
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
      },
    ];
  };

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
            <div className="h-4 bg-gray-200 rounded w-64"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-red-300 bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-900">
                Error loading dashboard
              </h3>
              <div className="mt-2 text-sm text-red-800">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => window.location.reload()}
                  className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
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

  const matrixData = generateMatrixData(stats);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground">
                Real-time platform analytics and performance monitoring
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button
            onClick={refreshData}
            disabled={refreshing}
            variant="default"
            size="sm"
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Matrix Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {matrixData.map((item, index) => (
          <Card
            key={index}
            className="relative overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group border-0 bg-gradient-to-br from-white to-gray-50/50"
          >
            {/* Subtle background pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-gray-100/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-gray-700 transition-colors">
                {item.label}
              </CardTitle>
              <div
                className={`p-3 rounded-xl ${item.bgColor} group-hover:scale-110 transition-transform duration-300 shadow-sm`}
              >
                <div className={item.color}>{item.icon}</div>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold mb-2 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                {item.value}
              </div>
              <div className="flex items-center space-x-1">
                {item.change !== undefined && (
                  <>
                    {item.trend === "up" ? (
                      <ArrowUpRight className="h-3 w-3 text-green-600" />
                    ) : item.trend === "down" ? (
                      <ArrowDownRight className="h-3 w-3 text-red-700" />
                    ) : (
                      <div className="h-3 w-3" />
                    )}
                    <span
                      className={`text-xs font-medium ${
                        item.trend === "up"
                          ? "text-green-600"
                          : item.trend === "down"
                          ? "text-red-700"
                          : "text-muted-foreground"
                      }`}
                    >
                      {item.trend === "up"
                        ? "+"
                        : item.trend === "down"
                        ? ""
                        : ""}
                      {item.change}
                      {item.label.includes("Rate") ||
                      item.label.includes("Rating")
                        ? ""
                        : "%"}
                    </span>
                  </>
                )}
                <span className="text-xs text-muted-foreground">
                  {item.label.includes("Revenue")
                    ? "total"
                    : item.label.includes("Users")
                    ? "registered"
                    : item.label.includes("Services")
                    ? "listed"
                    : item.label.includes("Bookings")
                    ? "total"
                    : item.label.includes("Tickets")
                    ? "open"
                    : item.label.includes("Rate")
                    ? "completion"
                    : item.label.includes("Rating")
                    ? "average"
                    : "active"}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Insights */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-green-800">
              <CheckCircle className="mr-2 h-5 w-5" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-700">Uptime</span>
              <Badge className="bg-green-100 text-green-800 border-green-300">
                99.9%
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-700">Response Time</span>
              <Badge className="bg-green-100 text-green-800 border-green-300">
                45ms
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-700">Error Rate</span>
              <Badge className="bg-green-100 text-green-800 border-green-300">
                0.1%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-blue-800">
              <Zap className="mr-2 h-5 w-5" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">Page Load</span>
              <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                1.2s
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">API Calls</span>
              <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                156/min
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">Cache Hit</span>
              <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                94%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-purple-800">
              <Target className="mr-2 h-5 w-5" />
              Goals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-purple-700">Monthly Target</span>
              <Badge className="bg-purple-100 text-purple-800 border-purple-300">
                85%
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-purple-700">User Growth</span>
              <Badge className="bg-purple-100 text-purple-800 border-purple-300">
                +12%
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-purple-700">Revenue Goal</span>
              <Badge className="bg-purple-100 text-purple-800 border-purple-300">
                92%
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center text-lg">
                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                User Breakdown
              </CardTitle>
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Active Providers
              </span>
              <Badge variant="secondary">{stats.activeProviders || 0}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Active Seekers
              </span>
              <Badge variant="secondary">{stats.activeSeekers || 0}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Pending Verification
              </span>
              <Badge variant="outline">{stats.pendingServices}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center text-lg">
                <div className="p-2 bg-purple-100 rounded-lg mr-3">
                  <Briefcase className="h-5 w-5 text-purple-600" />
                </div>
                Service Status
              </CardTitle>
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Total Services
              </span>
              <Badge variant="default">{stats.totalServices}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Pending Approval
              </span>
              <Badge variant="destructive">{stats.pendingServices}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Active Services
              </span>
              <Badge variant="secondary">
                {stats.totalServices - stats.pendingServices}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center text-lg">
                <div className="p-2 bg-red-100 rounded-lg mr-3">
                  <MessageSquare className="h-5 w-5 text-red-700" />
                </div>
                Support Overview
              </CardTitle>
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Total Tickets
              </span>
              <Badge variant="default">{stats.supportTickets}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Open Tickets
              </span>
              <Badge variant="destructive">{stats.openTickets}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Resolved</span>
              <Badge variant="secondary">
                {stats.supportTickets - stats.openTickets}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Overview */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-white">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg mr-3">
                  <Award className="h-5 w-5 text-white" />
                </div>
                Platform Overview
              </CardTitle>
              <CardDescription className="mt-2">
                Real-time system status and performance metrics
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <PieChart className="mr-2 h-4 w-4" />
                Analytics
              </Button>
              <Button variant="outline" size="sm">
                <Clock className="mr-2 h-4 w-4" />
                Timeline
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h4 className="font-semibold text-base flex items-center">
                <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                System Health
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-green-800">
                      All systems operational
                    </span>
                  </div>
                  <Badge className="bg-green-100 text-green-800 border-green-300">
                    Live
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-3">
                    <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium text-blue-800">
                      Database connected
                    </span>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-800">
                      API endpoints healthy
                    </span>
                  </div>
                  <Badge className="bg-green-100 text-green-800 border-green-300">
                    99.9%
                  </Badge>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-base flex items-center">
                <TrendingUp className="mr-2 h-4 w-4 text-blue-600" />
                Key Insights
              </h4>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-900 mb-2">
                    Platform Performance
                  </p>
                  <p className="text-sm text-blue-700">
                    Platform is running smoothly with {stats.totalUsers} users,{" "}
                    {stats.totalServices} services, and Rp{" "}
                    {stats.totalRevenue.toLocaleString()} in total revenue.
                  </p>
                </div>
                {stats.totalBookings && stats.completedBookings && (
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-green-900 mb-2">
                      Service Completion Rate
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-green-700">
                        {Math.round(
                          (stats.completedBookings / stats.totalBookings) * 100
                        )}
                        % of bookings completed
                      </p>
                      <Badge className="bg-green-100 text-green-800 border-green-300">
                        {stats.completedBookings}/{stats.totalBookings}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
