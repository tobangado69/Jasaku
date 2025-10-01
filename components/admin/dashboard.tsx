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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
} from "recharts";
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
  Info,
  ChevronDown,
  Calendar as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ChartData {
  month: string;
  [key: string]: any;
}

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
  previousMonthUsers?: number;
  previousMonthRevenue?: number;
  previousMonthBookings?: number;
  previousMonthServices?: number;
  currentMonthUsers?: number;
  currentMonthRevenue?: number;
  currentMonthBookings?: number;
  currentMonthServices?: number;
  // New month-specific comparison fields
  previousMonthActiveProviders?: number;
  previousMonthSupportTickets?: number;
  previousMonthAverageRating?: number;
  currentCompletionRate?: number;
  previousCompletionRate?: number;
}

interface MatrixData {
  label: string;
  value: string | number;
  change?: number;
  trend?: "up" | "down" | "neutral";
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  description?: string;
  previousValue?: number;
  currentValue?: number;
  changeType?: "percentage" | "absolute" | "ratio";
}

interface KpiDataItem {
  label: string;
  value: string | number;
  change: {
    change: number;
    trend: "up" | "down" | "neutral";
  };
  icon: React.ElementType;
  color: string;
  description: string;
  changeType?: "percentage" | "absolute" | "ratio";
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [charts, setCharts] = useState<{
    revenue: ChartData[];
    users: ChartData[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);

  // Month restriction utilities
  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
  };

  const getMaxSelectableMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
  };

  const getMinSelectableMonth = () => {
    const now = new Date();
    const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), 1);
    return `${twoYearsAgo.getFullYear()}-${String(
      twoYearsAgo.getMonth() + 1
    ).padStart(2, "0")}`;
  };

  // Filter states
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return getCurrentMonth();
  });
  const [comparisonPeriod, setComparisonPeriod] = useState<
    "previous" | "same_last_year"
  >("previous");
  const [monthError, setMonthError] = useState<string | null>(null);

  // Month selection handler with validation
  const handleMonthChange = (newMonth: string) => {
    setMonthError(null);

    const maxMonth = getMaxSelectableMonth();
    const minMonth = getMinSelectableMonth();

    if (newMonth > maxMonth) {
      setMonthError(
        "Cannot select future months. Analytics data is only available for current and past months."
      );
      setSelectedMonth(maxMonth);
      return;
    }

    if (newMonth < minMonth) {
      setMonthError("Historical data is limited to the last 24 months.");
      setSelectedMonth(minMonth);
      return;
    }

    setSelectedMonth(newMonth);
  };

  // Navigation helpers
  const goToPreviousMonth = () => {
    const current = new Date(selectedMonth + "-01");
    const previous = new Date(current.getFullYear(), current.getMonth() - 1, 1);
    const previousMonthStr = `${previous.getFullYear()}-${String(
      previous.getMonth() + 1
    ).padStart(2, "0")}`;
    handleMonthChange(previousMonthStr);
  };

  const goToNextMonth = () => {
    const current = new Date(selectedMonth + "-01");
    const next = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    const nextMonthStr = `${next.getFullYear()}-${String(
      next.getMonth() + 1
    ).padStart(2, "0")}`;
    handleMonthChange(nextMonthStr);
  };

  const goToCurrentMonth = () => {
    handleMonthChange(getCurrentMonth());
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setError(null);
        const [year, month] = selectedMonth.split("-");
        const response = await fetch(
          `/api/dashboard?type=admin&year=${year}&month=${month}&comparison=${comparisonPeriod}`,
          {
            credentials: "include",
          }
        );

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
            previousMonthUsers: data.stats.previousMonthUsers,
            previousMonthRevenue: data.stats.previousMonthRevenue,
            previousMonthBookings: data.stats.previousMonthBookings,
            previousMonthServices: data.stats.previousMonthServices,
            currentMonthUsers: data.stats.currentMonthUsers,
            currentMonthRevenue: data.stats.currentMonthRevenue,
            currentMonthBookings: data.stats.currentMonthBookings,
            currentMonthServices: data.stats.currentMonthServices,
            // New month-specific comparison fields
            previousMonthActiveProviders:
              data.stats.previousMonthActiveProviders,
            previousMonthSupportTickets: data.stats.previousMonthSupportTickets,
            previousMonthAverageRating: data.stats.previousMonthAverageRating,
            currentCompletionRate: data.stats.currentCompletionRate,
            previousCompletionRate: data.stats.previousCompletionRate,
          });
          setCharts(data.charts);
          setLastUpdated(new Date());
        } else {
          const errorData = await response.json().catch(() => ({}));

          // Handle month selection errors specifically
          if (response.status === 400 && errorData.error) {
            setMonthError(errorData.error);
            // Reset to current month if invalid month was selected
            setSelectedMonth(getCurrentMonth());
          } else {
            setError(errorData.error || "Failed to fetch dashboard stats");
          }
        }
      } catch (error) {
        setError("Network error: Unable to fetch dashboard stats");
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Auto-refresh every 15 seconds
    const interval = setInterval(() => {
      setIsAutoRefreshing(true);
      fetchStats().finally(() => setIsAutoRefreshing(false));
    }, 15000);

    return () => clearInterval(interval);
  }, [selectedMonth, comparisonPeriod]);

  const refreshData = async () => {
    setRefreshing(true);
    try {
      const [year, month] = selectedMonth.split("-");
      const response = await fetch(
        `/api/dashboard?type=admin&year=${year}&month=${month}&comparison=${comparisonPeriod}`,
        {
          credentials: "include",
        }
      );
      if (response.ok) {
        const data = await response.json();
        console.log("Dashboard data refreshed:", data);
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
          previousMonthUsers: data.stats.previousMonthUsers,
          previousMonthRevenue: data.stats.previousMonthRevenue,
          previousMonthBookings: data.stats.previousMonthBookings,
          previousMonthServices: data.stats.previousMonthServices,
          currentMonthUsers: data.stats.currentMonthUsers,
          currentMonthRevenue: data.stats.currentMonthRevenue,
          currentMonthBookings: data.stats.currentMonthBookings,
          currentMonthServices: data.stats.currentMonthServices,
          // New month-specific comparison fields
          previousMonthActiveProviders: data.stats.previousMonthActiveProviders,
          previousMonthSupportTickets: data.stats.previousMonthSupportTickets,
          previousMonthAverageRating: data.stats.previousMonthAverageRating,
          currentCompletionRate: data.stats.currentCompletionRate,
          previousCompletionRate: data.stats.previousCompletionRate,
        });
        setCharts(data.charts);
        setLastUpdated(new Date());
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Refresh API error:", errorData);
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Helper function to calculate month-over-month percentage
  const calculateMoMChange = (
    current: number,
    previous: number
  ): { change: number; trend: "up" | "down" | "neutral" } => {
    if (previous === 0) {
      return {
        change: current > 0 ? 100 : 0,
        trend: current > 0 ? "up" : "neutral",
      };
    }
    const percentage = Math.round(((current - previous) / previous) * 100);
    return {
      change: Math.abs(percentage),
      trend: percentage > 0 ? "up" : percentage < 0 ? "down" : "neutral",
    };
  };

  // Helper function to format change display
  const formatChangeDisplay = (
    change: number,
    trend: "up" | "down" | "neutral",
    type: "percentage" | "absolute" | "ratio" = "percentage"
  ): string => {
    const sign = trend === "up" ? "+" : trend === "down" ? "-" : "";
    if (type === "percentage") {
      return `${sign}${change}%`;
    } else if (type === "absolute") {
      return `${sign}${change.toLocaleString()}`;
    } else {
      return `${change.toFixed(1)}x`;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 w-full px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 w-full">
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
      <div className="space-y-6 w-full px-4 sm:px-6 lg:px-8">
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
      <div className="space-y-6 w-full">
        <p className="text-center text-muted-foreground">
          Failed to load dashboard data.
        </p>
      </div>
    );
  }

  const completionRate =
    stats.totalBookings && stats.totalBookings > 0
      ? Math.round((stats.completedBookings! / stats.totalBookings!) * 100)
      : 0;

  const kpiData: KpiDataItem[] = [
    {
      label: "New Users This Month",
      value: (stats.currentMonthUsers || 0).toLocaleString(),
      change: calculateMoMChange(
        stats.currentMonthUsers || 0,
        stats.previousMonthUsers || 0
      ),
      icon: Users,
      color: "text-blue-600",
      description: "Month-over-month user growth",
    },
    {
      label: "Active Providers",
      value: (stats.activeProviders || 0).toLocaleString(),
      change: calculateMoMChange(
        stats.activeProviders || 0,
        stats.previousMonthActiveProviders || 0
      ),
      icon: Briefcase,
      color: "text-green-600",
      description: "Currently active service providers",
    },
    {
      label: "New Services This Month",
      value: (stats.currentMonthServices || 0).toLocaleString(),
      change: calculateMoMChange(
        stats.currentMonthServices || 0,
        stats.previousMonthServices || 0
      ),
      icon: Zap,
      color: "text-purple-600",
      description: "Month-over-month service growth",
    },
    {
      label: "Monthly Revenue",
      value: `Rp ${(stats.currentMonthRevenue || 0).toLocaleString()}`,
      change: calculateMoMChange(
        stats.currentMonthRevenue || 0,
        stats.previousMonthRevenue || 0
      ),
      icon: DollarSign,
      color: "text-emerald-600",
      description: "From completed bookings this month",
    },
    {
      label: "New Bookings This Month",
      value: (stats.currentMonthBookings || 0).toLocaleString(),
      change: calculateMoMChange(
        stats.currentMonthBookings || 0,
        stats.previousMonthBookings || 0
      ),
      icon: Calendar,
      color: "text-orange-600",
      description: "Month-over-month booking growth",
    },
    {
      label: "Support Tickets",
      value: (stats.supportTickets || 0).toLocaleString(),
      change: calculateMoMChange(
        stats.supportTickets || 0,
        stats.previousMonthSupportTickets || 0
      ),
      icon: MessageSquare,
      color: "text-red-600",
      description: "Support tickets this month",
    },
    {
      label: "Completion Rate",
      value: `${Math.round(stats.currentCompletionRate || 0)}%`,
      change: calculateMoMChange(
        stats.currentCompletionRate || 0,
        stats.previousCompletionRate || 0
      ),
      icon: TrendingUpIcon,
      color: "text-indigo-600",
      description: "Booking completion rate this month",
    },
    {
      label: "Avg Rating",
      value: (stats.averageRating || 0).toFixed(1),
      change: calculateMoMChange(
        stats.averageRating || 0,
        stats.previousMonthAverageRating || 0
      ),
      icon: Award,
      color: "text-yellow-600",
      description: "Average service rating this month",
      changeType: "absolute",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Month Navigation */}
          <div className="flex flex-col items-center">
            {/* Current Month Badge - Always reserves space to prevent layout shift */}
            <div className="h-6 mb-2 -ml-8">
              <Badge
                variant="secondary"
                className={`text-xs transition-opacity duration-200 ${
                  selectedMonth === getCurrentMonth()
                    ? "opacity-100"
                    : "opacity-0"
                }`}
              >
                Current Month
              </Badge>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousMonth}
                disabled={selectedMonth <= getMinSelectableMonth()}
                className="h-8 w-8 p-0"
                title="Previous Month"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => handleMonthChange(e.target.value)}
                      min={getMinSelectableMonth()}
                      max={getMaxSelectableMonth()}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary h-8"
                      title="Select a month to view analytics data"
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Analytics data available for current and past months only
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button
                variant="outline"
                size="sm"
                onClick={goToNextMonth}
                disabled={selectedMonth >= getMaxSelectableMonth()}
                className="h-8 w-8 p-0"
                title="Next Month"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={goToCurrentMonth}
                className="text-xs px-2 h-8"
                title="Go to current month"
              >
                This Month
              </Button>
            </div>
          </div>

          {/* Spacer to align with navigation controls */}
          <div className="h-6"></div>

          {/* Month Info */}
          <div className="flex items-center gap-2 h-8">
            <Info className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Viewing:{" "}
              {new Date(selectedMonth + "-01").toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>

          {/* Month Error Message */}
          {monthError && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{monthError}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <Select
            value={comparisonPeriod}
            onValueChange={(value: "previous" | "same_last_year") =>
              setComparisonPeriod(value)
            }
          >
            <SelectTrigger className="w-48 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="previous">vs Previous Month</SelectItem>
              <SelectItem value="same_last_year">
                vs Same Month Last Year
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={refreshData}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="h-8"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button variant="default" size="sm" className="h-8">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((item, index) => (
          <Card key={index} className="flex flex-col">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                  {item.label}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 ml-1.5 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{item.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </div>
              <div
                className={cn(
                  "flex items-center justify-center h-8 w-8 rounded-full",
                  item.color.replace("text-", "bg-").replace("-600", "-100")
                )}
              >
                <item.icon className={cn("h-4 w-4", item.color)} />
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-end">
              <div className="text-3xl font-bold">{item.value}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                {item.change.trend !== "neutral" && (
                  <>
                    {item.change.trend === "up" ? (
                      <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-700 mr-1" />
                    )}
                    <span
                      className={
                        item.change.trend === "up"
                          ? "text-green-600"
                          : "text-red-700"
                      }
                    >
                      {formatChangeDisplay(
                        item.change.change,
                        item.change.trend,
                        item.changeType
                      )}
                    </span>
                    <span className="ml-1">
                      {item.changeType === "absolute"
                        ? "current"
                        : "vs last month"}
                    </span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
            <CardDescription>
              Revenue from completed bookings over the last 6 months.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={charts?.revenue || []}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" />
                <YAxis />
                <RechartsTooltip />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>New Users</CardTitle>
            <CardDescription>
              New user sign-ups over the last 6 months.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={charts?.users || []}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="users" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
