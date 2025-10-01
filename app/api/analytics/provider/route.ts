import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db";
import {
  calculatePercentageChange,
  determineTrend,
  forecastValues,
  calculateGrowthRate,
  groupByPeriod,
  calculateMedian,
  calculateRetentionRate,
} from "@/lib/analytics/calculations";
import type { ProviderAnalytics, TimeSeriesData } from "@/lib/analytics/types";

export async function GET(request: NextRequest) {
  const authResult = await requireRole(["PROVIDER"]);
  
  if (!authResult.success || !authResult.session) {
    return NextResponse.json(
      { error: authResult.error?.message || "Unauthorized" },
      { status: authResult.error?.status || 401 }
    );
  }

  const { user } = authResult.session;
  const { searchParams } = new URL(request.url);
  const timeRange = searchParams.get("timeRange") || "30d";

  try {
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case "7d":
        startDate.setDate(endDate.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(endDate.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(endDate.getDate() - 90);
        break;
      case "1y":
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      case "all":
        startDate.setFullYear(2020, 0, 1);
        break;
    }

    // Previous period for comparison
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));

    // Fetch current period data
    const [bookings, services, payments, reviews, customers] = await Promise.all([
      prisma.booking.findMany({
        where: {
          providerId: user.id,
          createdAt: { gte: startDate, lte: endDate },
        },
        include: {
          payment: true,
          customer: true,
          service: { include: { category: true } },
        },
      }),
      prisma.service.findMany({
        where: { providerId: user.id },
        include: {
          _count: { select: { bookings: true, reviews: true } },
          category: true,
          reviews: true,
        },
      }),
      prisma.payment.findMany({
        where: {
          booking: { providerId: user.id },
          status: "COMPLETED",
          createdAt: { gte: startDate, lte: endDate },
        },
        include: {
          booking: {
            include: {
              service: { include: { category: true } },
            },
          },
        },
      }),
      prisma.review.findMany({
        where: {
          service: { providerId: user.id },
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.user.findMany({
        where: {
          bookingsAsCustomer: {
            some: { providerId: user.id },
          },
        },
        select: {
          id: true,
          name: true,
          bookingsAsCustomer: {
            where: { providerId: user.id },
            include: { payment: true, review: true },
          },
        },
      }),
    ]);

    // Previous period data for comparison
    const [previousBookings, previousPayments] = await Promise.all([
      prisma.booking.findMany({
        where: {
          providerId: user.id,
          createdAt: { gte: previousStartDate, lt: startDate },
        },
      }),
      prisma.payment.findMany({
        where: {
          booking: { providerId: user.id },
          status: "COMPLETED",
          createdAt: { gte: previousStartDate, lt: startDate },
        },
      }),
    ]);

    // Calculate overview metrics
    const totalEarnings = payments.reduce((sum, p) => sum + p.amount, 0);
    const previousEarnings = previousPayments.reduce((sum, p) => sum + p.amount, 0);
    const earningsChange = calculatePercentageChange(totalEarnings, previousEarnings);

    const totalBookings = bookings.length;
    const previousBookingsCount = previousBookings.length;
    const bookingsChange = calculatePercentageChange(totalBookings, previousBookingsCount);

    const completedBookings = bookings.filter(b => b.status === "COMPLETED").length;
    const completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;

    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    // Calculate response time (mock - would need message timestamps)
    const avgResponseTime = 2.5; // hours

    // Revenue analytics with forecasting
    const dailyRevenue: TimeSeriesData[] = [];
    const revenueByDate = new Map<string, number>();

    payments.forEach(payment => {
      const date = payment.createdAt.toISOString().split('T')[0];
      revenueByDate.set(date, (revenueByDate.get(date) || 0) + payment.amount);
    });

    revenueByDate.forEach((value, date) => {
      dailyRevenue.push({
        date,
        timestamp: new Date(date).toISOString(),
        value,
      });
    });

    const forecast = forecastValues(dailyRevenue, 7);
    const revenueGrowth = calculateGrowthRate(dailyRevenue);
    const medianRevenue = calculateMedian(dailyRevenue.map(d => d.value));

    // Top performing services
    const servicePerformance = services.map(service => {
      const servicePayments = payments.filter(
        p => p.booking.service.id === service.id
      );
      const serviceRevenue = servicePayments.reduce((sum, p) => sum + p.amount, 0);
      const serviceBookings = bookings.filter(b => b.service.id === service.id);
      const serviceReviews = service.reviews;
      const avgRating = serviceReviews.length > 0
        ? serviceReviews.reduce((sum, r) => sum + r.rating, 0) / serviceReviews.length
        : 0;

      return {
        id: service.id,
        title: service.title,
        category: typeof service.category === 'object' ? service.category.name : service.category,
        bookings: serviceBookings.length,
        revenue: serviceRevenue,
        rating: avgRating,
        reviews: serviceReviews.length,
        conversionRate: 0, // Would need view data
        trend: determineTrend(serviceBookings.length > previousBookingsCount / services.length ? 10 : -10),
      };
    });

    const topServices = [...servicePerformance]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const bottomServices = [...servicePerformance]
      .sort((a, b) => a.revenue - b.revenue)
      .slice(0, 3);

    // Customer analytics
    const newCustomers = customers.filter(c => {
      const firstBooking = c.bookingsAsCustomer
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
      return firstBooking && firstBooking.createdAt >= startDate;
    }).length;

    const returningCustomers = customers.filter(c => {
      const bookingsInPeriod = c.bookingsAsCustomer.filter(
        b => b.createdAt >= startDate && b.createdAt <= endDate
      );
      return bookingsInPeriod.length > 1;
    }).length;

    const totalCustomerSpent = customers.reduce((sum, c) => {
      return sum + c.bookingsAsCustomer.reduce((cSum, b) => {
        return cSum + (b.payment?.amount || 0);
      }, 0);
    }, 0);

    const lifetimeValue = customers.length > 0 ? totalCustomerSpent / customers.length : 0;

    const topCustomers = customers
      .map(c => ({
        id: c.id,
        name: c.name || "Unknown",
        totalSpent: c.bookingsAsCustomer.reduce((sum, b) => sum + (b.payment?.amount || 0), 0),
        bookings: c.bookingsAsCustomer.length,
        avgRating: c.bookingsAsCustomer.filter(b => b.review).length > 0
          ? c.bookingsAsCustomer.reduce((sum, b) => sum + (b.review?.rating || 0), 0) /
            c.bookingsAsCustomer.filter(b => b.review).length
          : 0,
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    // Category performance
    const categoryStats = services.reduce((acc: any[], service) => {
      const categoryName = typeof service.category === 'object' ? service.category.name : service.category;
      const existing = acc.find(c => c.category === categoryName);
      const serviceRevenue = payments
        .filter(p => p.booking.service.id === service.id)
        .reduce((sum, p) => sum + p.amount, 0);

      if (existing) {
        existing.services++;
        existing.bookings += service._count.bookings;
        existing.revenue += serviceRevenue;
      } else {
        acc.push({
          category: categoryName,
          services: 1,
          bookings: service._count.bookings,
          revenue: serviceRevenue,
        });
      }
      return acc;
    }, []);

    // Booking patterns
    const bookingsByStatus = [
      { status: "PENDING", count: bookings.filter(b => b.status === "PENDING").length },
      { status: "CONFIRMED", count: bookings.filter(b => b.status === "CONFIRMED").length },
      { status: "IN_PROGRESS", count: bookings.filter(b => b.status === "IN_PROGRESS").length },
      { status: "COMPLETED", count: bookings.filter(b => b.status === "COMPLETED").length },
      { status: "CANCELLED", count: bookings.filter(b => b.status === "CANCELLED").length },
    ].map(item => ({
      ...item,
      percentage: totalBookings > 0 ? (item.count / totalBookings) * 100 : 0,
    }));

    // Generate insights
    const insights = [];

    if (earningsChange > 20) {
      insights.push({
        type: "success" as const,
        title: "Strong Revenue Growth",
        description: `Your earnings increased by ${earningsChange.toFixed(1)}% compared to the previous period.`,
        action: "Keep up the great work!",
      });
    } else if (earningsChange < -10) {
      insights.push({
        type: "warning" as const,
        title: "Revenue Decline",
        description: `Your earnings decreased by ${Math.abs(earningsChange).toFixed(1)}%. Consider promoting your top services.`,
        action: "Review pricing strategy",
      });
    }

    if (completionRate < 70) {
      insights.push({
        type: "warning" as const,
        title: "Low Completion Rate",
        description: `Only ${completionRate.toFixed(1)}% of bookings are being completed. Focus on improving service delivery.`,
        action: "Improve completion rate",
      });
    }

    if (averageRating < 4.0 && reviews.length > 5) {
      insights.push({
        type: "warning" as const,
        title: "Rating Below Target",
        description: `Your average rating is ${averageRating.toFixed(1)}. Focus on customer satisfaction.`,
        action: "Improve service quality",
      });
    }

    const analytics: ProviderAnalytics = {
      overview: {
        totalEarnings: {
          label: "Total Earnings",
          value: totalEarnings,
          change: totalEarnings - previousEarnings,
          changePercentage: earningsChange,
          trend: determineTrend(earningsChange),
        },
        totalBookings: {
          label: "Total Bookings",
          value: totalBookings,
          change: totalBookings - previousBookingsCount,
          changePercentage: bookingsChange,
          trend: determineTrend(bookingsChange),
        },
        activeServices: {
          label: "Active Services",
          value: services.filter(s => s.status === "ACTIVE").length,
        },
        averageRating: {
          label: "Average Rating",
          value: averageRating,
        },
        completionRate: {
          label: "Completion Rate",
          value: completionRate,
        },
        responseTime: {
          label: "Avg Response Time",
          value: avgResponseTime,
        },
      },
      revenue: {
        total: totalEarnings,
        average: totalBookings > 0 ? totalEarnings / totalBookings : 0,
        median: medianRevenue,
        trend: determineTrend(earningsChange),
        growth: revenueGrowth,
        forecast,
        byPeriod: dailyRevenue,
      },
      customers: {
        total: customers.length,
        new: newCustomers,
        returning: returningCustomers,
        retention: calculateRetentionRate(customers.length, returningCustomers),
        churnRate: 0, // Would need more historical data
        lifetimeValue,
        satisfaction: averageRating,
        topCustomers,
      },
      services: {
        top: topServices,
        bottom: bottomServices,
        categories: categoryStats,
      },
      bookings: {
        total: totalBookings,
        byStatus: bookingsByStatus,
        byPeriod: groupByPeriod(
          bookings.map(b => ({
            date: b.createdAt.toISOString().split('T')[0],
            timestamp: b.createdAt.toISOString(),
            value: 1,
          })),
          timeRange === "1y" ? "month" : "day"
        ),
        peakHours: [], // Would need hourly data
        peakDays: [], // Would need daily patterns
      },
      insights,
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Error fetching provider analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

