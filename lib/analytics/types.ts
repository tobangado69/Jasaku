/**
 * Analytics Type Definitions
 * Comprehensive types for analytics across the platform
 */

// Time range options
export type TimeRange = "7d" | "30d" | "90d" | "1y" | "all";

// Trend directions
export type TrendDirection = "up" | "down" | "stable";

// Export formats
export type ExportFormat = "csv" | "pdf" | "json";

/**
 * Base Analytics Metric
 */
export interface Metric {
  label: string;
  value: number;
  change?: number;
  changePercentage?: number;
  trend?: TrendDirection;
  comparisonPeriod?: string;
}

/**
 * Time Series Data Point
 */
export interface TimeSeriesData {
  timestamp: string;
  date: string;
  value: number;
  label?: string;
}

/**
 * Revenue Analytics
 */
export interface RevenueAnalytics {
  total: number;
  average: number;
  median: number;
  trend: TrendDirection;
  growth: number;
  forecast: TimeSeriesData[];
  byPeriod: TimeSeriesData[];
  byCategory?: {
    category: string;
    amount: number;
    percentage: number;
    trend: TrendDirection;
  }[];
}

/**
 * Customer Analytics
 */
export interface CustomerAnalytics {
  total: number;
  new: number;
  returning: number;
  retention: number;
  churnRate: number;
  lifetimeValue: number;
  satisfaction: number;
  topCustomers: {
    id: string;
    name: string;
    totalSpent: number;
    bookings: number;
    avgRating: number;
  }[];
}

/**
 * Service Performance
 */
export interface ServicePerformance {
  id: string;
  title: string;
  category: string;
  bookings: number;
  revenue: number;
  rating: number;
  reviews: number;
  conversionRate: number;
  views?: number;
  trend: TrendDirection;
}

/**
 * Provider Analytics
 */
export interface ProviderAnalytics {
  overview: {
    totalEarnings: Metric;
    totalBookings: Metric;
    activeServices: Metric;
    averageRating: Metric;
    completionRate: Metric;
    responseTime: Metric;
  };
  revenue: RevenueAnalytics;
  customers: CustomerAnalytics;
  services: {
    top: ServicePerformance[];
    bottom: ServicePerformance[];
    categories: {
      category: string;
      services: number;
      bookings: number;
      revenue: number;
    }[];
  };
  bookings: {
    total: number;
    byStatus: {
      status: string;
      count: number;
      percentage: number;
    }[];
    byPeriod: TimeSeriesData[];
    peakHours: {
      hour: number;
      count: number;
    }[];
    peakDays: {
      day: string;
      count: number;
    }[];
  };
  insights: {
    type: "success" | "warning" | "info";
    title: string;
    description: string;
    action?: string;
  }[];
}

/**
 * Admin Platform Analytics
 */
export interface AdminAnalytics {
  overview: {
    totalUsers: Metric;
    totalProviders: Metric;
    totalSeekers: Metric;
    totalServices: Metric;
    totalBookings: Metric;
    totalRevenue: Metric;
    platformFee: Metric;
    activeUsers: Metric;
  };
  users: {
    growth: TimeSeriesData[];
    byRole: {
      role: string;
      count: number;
      percentage: number;
      growth: number;
    }[];
    retention: {
      period: string;
      rate: number;
    }[];
    churn: {
      period: string;
      rate: number;
    }[];
  };
  revenue: RevenueAnalytics & {
    platformFee: number;
    providerEarnings: number;
    byPaymentMethod: {
      method: string;
      amount: number;
      transactions: number;
    }[];
  };
  services: {
    total: number;
    active: number;
    pending: number;
    byCategory: {
      category: string;
      count: number;
      revenue: number;
      avgPrice: number;
    }[];
    topPerforming: ServicePerformance[];
  };
  bookings: {
    total: number;
    completed: number;
    cancelled: number;
    completionRate: number;
    byPeriod: TimeSeriesData[];
    byCategory: {
      category: string;
      count: number;
      revenue: number;
    }[];
  };
  geography: {
    city: string;
    users: number;
    bookings: number;
    revenue: number;
  }[];
  insights: {
    type: "success" | "warning" | "danger" | "info";
    title: string;
    description: string;
    metric?: number;
    action?: string;
  }[];
}

/**
 * Seeker Analytics
 */
export interface SeekerAnalytics {
  overview: {
    totalBookings: Metric;
    totalSpent: Metric;
    favoriteServices: Metric;
    averageRating: Metric;
  };
  spending: {
    total: number;
    average: number;
    byPeriod: TimeSeriesData[];
    byCategory: {
      category: string;
      amount: number;
      bookings: number;
      percentage: number;
    }[];
  };
  bookings: {
    total: number;
    completed: number;
    cancelled: number;
    byStatus: {
      status: string;
      count: number;
    }[];
    byPeriod: TimeSeriesData[];
    topProviders: {
      id: string;
      name: string;
      bookings: number;
      spent: number;
      rating: number;
    }[];
  };
  savings: {
    totalSaved: number;
    discountsUsed: number;
    loyaltyPoints: number;
  };
  insights: {
    type: "info" | "tip" | "recommendation";
    title: string;
    description: string;
  }[];
}

/**
 * Chart Data Types
 */
export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    fill?: boolean;
  }[];
}

/**
 * Comparison Data
 */
export interface ComparisonData {
  current: number;
  previous: number;
  change: number;
  changePercentage: number;
  trend: TrendDirection;
}

/**
 * Forecast Data
 */
export interface ForecastData {
  date: string;
  predicted: number;
  confidence: {
    lower: number;
    upper: number;
  };
}

/**
 * Analytics Filter Options
 */
export interface AnalyticsFilters {
  timeRange: TimeRange;
  startDate?: string;
  endDate?: string;
  category?: string;
  status?: string;
  comparison?: "previous" | "same_last_year" | "none";
}

/**
 * Analytics Export Options
 */
export interface ExportOptions {
  format: ExportFormat;
  sections: string[];
  dateRange: {
    start: string;
    end: string;
  };
  includeCharts?: boolean;
}

