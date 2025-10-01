/**
 * Analytics Calculation Utilities
 * Advanced analytics calculations including forecasting, trends, and insights
 */

import { TrendDirection, TimeSeriesData, ForecastData, ComparisonData } from "./types";

/**
 * Calculate percentage change between two values
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Determine trend direction based on change
 */
export function determineTrend(change: number, threshold: number = 0.05): TrendDirection {
  const absChange = Math.abs(change);
  if (absChange < threshold) return "stable";
  return change > 0 ? "up" : "down";
}

/**
 * Calculate moving average for smoothing time series data
 */
export function calculateMovingAverage(data: number[], window: number = 7): number[] {
  const result: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - window + 1);
    const subset = data.slice(start, i + 1);
    const average = subset.reduce((sum, val) => sum + val, 0) / subset.length;
    result.push(average);
  }
  
  return result;
}

/**
 * Simple linear regression for trend forecasting
 */
export function simpleLinearRegression(data: TimeSeriesData[]): {
  slope: number;
  intercept: number;
  rSquared: number;
} {
  const n = data.length;
  if (n < 2) {
    return { slope: 0, intercept: 0, rSquared: 0 };
  }

  const xValues = data.map((_, i) => i);
  const yValues = data.map(d => d.value);

  const sumX = xValues.reduce((sum, x) => sum + x, 0);
  const sumY = yValues.reduce((sum, y) => sum + y, 0);
  const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
  const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);
  const sumYY = yValues.reduce((sum, y) => sum + y * y, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R-squared
  const yMean = sumY / n;
  const ssTotal = yValues.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
  const ssResidual = yValues.reduce((sum, y, i) => {
    const predicted = slope * xValues[i] + intercept;
    return sum + Math.pow(y - predicted, 2);
  }, 0);
  const rSquared = 1 - (ssResidual / ssTotal);

  return { slope, intercept, rSquared };
}

/**
 * Forecast future values using linear regression
 */
export function forecastValues(
  historicalData: TimeSeriesData[],
  periods: number = 7,
  confidenceLevel: number = 0.95
): ForecastData[] {
  const { slope, intercept, rSquared } = simpleLinearRegression(historicalData);
  
  const n = historicalData.length;
  const yValues = historicalData.map(d => d.value);
  const yMean = yValues.reduce((sum, y) => sum + y, 0) / n;
  
  // Calculate standard error
  const residuals = historicalData.map((d, i) => {
    const predicted = slope * i + intercept;
    return d.value - predicted;
  });
  const standardError = Math.sqrt(
    residuals.reduce((sum, r) => sum + r * r, 0) / (n - 2)
  );

  // Z-score for 95% confidence interval
  const zScore = 1.96;
  
  const forecasts: ForecastData[] = [];
  const lastDate = new Date(historicalData[historicalData.length - 1].date);

  for (let i = 1; i <= periods; i++) {
    const futureDate = new Date(lastDate);
    futureDate.setDate(futureDate.getDate() + i);
    
    const predicted = slope * (n + i - 1) + intercept;
    const marginOfError = zScore * standardError * Math.sqrt(1 + 1/n);

    forecasts.push({
      date: futureDate.toISOString().split('T')[0],
      predicted: Math.max(0, Math.round(predicted)),
      confidence: {
        lower: Math.max(0, Math.round(predicted - marginOfError)),
        upper: Math.round(predicted + marginOfError),
      },
    });
  }

  return forecasts;
}

/**
 * Calculate growth rate between periods
 */
export function calculateGrowthRate(data: TimeSeriesData[]): number {
  if (data.length < 2) return 0;
  
  const first = data[0].value;
  const last = data[data.length - 1].value;
  
  if (first === 0) return last > 0 ? 100 : 0;
  return ((last - first) / first) * 100;
}

/**
 * Calculate compound annual growth rate (CAGR)
 */
export function calculateCAGR(
  initialValue: number,
  finalValue: number,
  years: number
): number {
  if (initialValue === 0 || years === 0) return 0;
  return (Math.pow(finalValue / initialValue, 1 / years) - 1) * 100;
}

/**
 * Group time series data by period
 */
export function groupByPeriod(
  data: TimeSeriesData[],
  period: "day" | "week" | "month" | "year"
): TimeSeriesData[] {
  const grouped = new Map<string, number>();

  data.forEach(item => {
    const date = new Date(item.date);
    let key: string;

    switch (period) {
      case "day":
        key = date.toISOString().split('T')[0];
        break;
      case "week":
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      case "month":
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      case "year":
        key = date.getFullYear().toString();
        break;
    }

    grouped.set(key, (grouped.get(key) || 0) + item.value);
  });

  return Array.from(grouped.entries())
    .map(([date, value]) => ({
      date,
      timestamp: new Date(date).toISOString(),
      value,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Calculate comparison data between current and previous period
 */
export function calculateComparison(
  current: number,
  previous: number
): ComparisonData {
  const change = current - previous;
  const changePercentage = calculatePercentageChange(current, previous);
  const trend = determineTrend(changePercentage);

  return {
    current,
    previous,
    change,
    changePercentage,
    trend,
  };
}

/**
 * Detect anomalies in time series data using z-score
 */
export function detectAnomalies(
  data: TimeSeriesData[],
  threshold: number = 2.5
): { date: string; value: number; zScore: number }[] {
  if (data.length < 3) return [];

  const values = data.map(d => d.value);
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const stdDev = Math.sqrt(
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  );

  const anomalies: { date: string; value: number; zScore: number }[] = [];

  data.forEach(item => {
    const zScore = Math.abs((item.value - mean) / stdDev);
    if (zScore > threshold) {
      anomalies.push({
        date: item.date,
        value: item.value,
        zScore,
      });
    }
  });

  return anomalies;
}

/**
 * Calculate median value
 */
export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Calculate percentile
 */
export function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

/**
 * Calculate retention rate
 */
export function calculateRetentionRate(
  initialUsers: number,
  returningUsers: number
): number {
  if (initialUsers === 0) return 0;
  return (returningUsers / initialUsers) * 100;
}

/**
 * Calculate churn rate
 */
export function calculateChurnRate(
  initialUsers: number,
  churnedUsers: number
): number {
  if (initialUsers === 0) return 0;
  return (churnedUsers / initialUsers) * 100;
}

/**
 * Calculate customer lifetime value
 */
export function calculateLTV(
  averageOrderValue: number,
  purchaseFrequency: number,
  customerLifespan: number
): number {
  return averageOrderValue * purchaseFrequency * customerLifespan;
}

/**
 * Calculate conversion rate
 */
export function calculateConversionRate(
  conversions: number,
  totalVisitors: number
): number {
  if (totalVisitors === 0) return 0;
  return (conversions / totalVisitors) * 100;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: string = "IDR"): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format large numbers with abbreviations
 */
export function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
}

