import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db";
import {
  calculatePercentageChange,
  determineTrend,
  calculateGrowthRate,
  groupByPeriod,
  calculateMedian,
} from "@/lib/analytics/calculations";
import type { SeekerAnalytics, TimeSeriesData } from "@/lib/analytics/types";

export async function GET(request: NextRequest) {
  const authResult = await requireRole(["SEEKER"]);
  
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
    const periodLength = endDate.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - periodLength);
    const previousEndDate = new Date(startDate);

    // Fetch current period data
    const [bookings, payments, favorites, reviews] = await Promise.all([
      prisma.booking.findMany({
        where: {
          customerId: user.id,
          createdAt: { gte: startDate, lte: endDate },
        },
        include: {
          service: {
            include: {
              category: true,
              provider: {
                select: {
                  id: true,
                  name: true,
                  profileImage: true,
                  isVerified: true,
                },
              },
            },
          },
          payment: true,
          review: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.payment.findMany({
        where: {
          booking: { customerId: user.id },
          status: "COMPLETED",
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.service.findMany({
        where: {
          favoritedBy: {
            some: { id: user.id },
          },
        },
        include: {
          category: true,
          provider: {
            select: {
              id: true,
              name: true,
              isVerified: true,
            },
          },
        },
      }),
      prisma.review.findMany({
        where: {
          reviewerId: user.id,
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
    ]);

    // Previous period data for comparison
    const [previousBookings, previousPayments] = await Promise.all([
      prisma.booking.findMany({
        where: {
          customerId: user.id,
          createdAt: { gte: previousStartDate, lt: previousEndDate },
        },
      }),
      prisma.payment.findMany({
        where: {
          booking: { customerId: user.id },
          status: "COMPLETED",
          createdAt: { gte: previousStartDate, lt: previousEndDate },
        },
      }),
    ]);

    // Calculate overview metrics
    const totalBookings = bookings.length;
    const previousBookingsCount = previousBookings.length;
    const bookingsChange = calculatePercentageChange(totalBookings, previousBookingsCount);

    const totalSpent = payments.reduce((sum: number, p: any) => sum + p.amount, 0);
    const previousSpent = previousPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
    const spentChange = calculatePercentageChange(totalSpent, previousSpent);

    const completedBookings = bookings.filter((b: any) => b.status === "COMPLETED").length;
    const cancelledBookings = bookings.filter((b: any) => b.status === "CANCELLED").length;

    const averageRating = reviews.length > 0
      ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
      : 0;

    // Spending analytics
    const averageBookingCost = totalBookings > 0 ? totalSpent / totalBookings : 0;
    const medianSpending = calculateMedian(payments.map((p: any) => p.amount));

    // Generate spending by period
    const spendingByDate = new Map<string, number>();
    payments.forEach((payment: any) => {
      const date = payment.createdAt.toISOString().split('T')[0];
      spendingByDate.set(date, (spendingByDate.get(date) || 0) + payment.amount);
    });

    const spendingByPeriod: TimeSeriesData[] = Array.from(spendingByDate.entries())
      .map(([date, value]) => ({
        date,
        timestamp: new Date(date).toISOString(),
        value,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Spending by category
    const spendingByCategory = new Map<string, { amount: number; bookings: number }>();
    
    bookings.forEach((booking: any) => {
      if (booking.payment?.status === "COMPLETED") {
        const categoryName = typeof booking.service.category === 'object' 
          ? booking.service.category.name 
          : booking.service.category;
        
        const current = spendingByCategory.get(categoryName) || { amount: 0, bookings: 0 };
        spendingByCategory.set(categoryName, {
          amount: current.amount + booking.payment.amount,
          bookings: current.bookings + 1,
        });
      }
    });

    const categorySpending = Array.from(spendingByCategory.entries())
      .map(([category, data]) => ({
        category,
        amount: data.amount,
        bookings: data.bookings,
        percentage: totalSpent > 0 ? (data.amount / totalSpent) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // Booking status distribution
    const bookingsByStatus = [
      { status: "PENDING", count: bookings.filter((b: any) => b.status === "PENDING").length },
      { status: "CONFIRMED", count: bookings.filter((b: any) => b.status === "CONFIRMED").length },
      { status: "IN_PROGRESS", count: bookings.filter((b: any) => b.status === "IN_PROGRESS").length },
      { status: "COMPLETED", count: completedBookings },
      { status: "CANCELLED", count: cancelledBookings },
    ];

    // Bookings by period
    const bookingsByPeriod = groupByPeriod(
      bookings.map((b: any) => ({
        date: b.createdAt.toISOString().split('T')[0],
        timestamp: b.createdAt.toISOString(),
        value: 1,
      })),
      timeRange === "1y" ? "month" : "day"
    );

    // Top providers
    const providerStats = new Map<string, {
      id: string;
      name: string;
      bookings: number;
      spent: number;
      ratings: number[];
    }>();

    bookings.forEach((booking: any) => {
      const providerId = booking.service.provider.id;
      const providerName = booking.service.provider.name || "Unknown";
      const current = providerStats.get(providerId) || {
        id: providerId,
        name: providerName,
        bookings: 0,
        spent: 0,
        ratings: [] as number[],
      };

      current.bookings++;
      if (booking.payment?.status === "COMPLETED") {
        current.spent += booking.payment.amount;
      }
      if (booking.review) {
        current.ratings.push(booking.review.rating);
      }

      providerStats.set(providerId, current);
    });

    const topProviders = Array.from(providerStats.values())
      .map(provider => ({
        id: provider.id,
        name: provider.name,
        bookings: provider.bookings,
        spent: provider.spent,
        rating: provider.ratings.length > 0
          ? provider.ratings.reduce((sum, r) => sum + r, 0) / provider.ratings.length
          : 0,
      }))
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 10);

    // Calculate savings (mock - would need discount/coupon data)
    const totalSaved = 0; // Would calculate from discounts
    const discountsUsed = 0; // Would count discount codes used
    const loyaltyPoints = Math.floor(totalSpent / 10000); // 1 point per 10,000 IDR

    // Generate insights
    const insights = [];

    // Spending insights
    if (spentChange > 20) {
      insights.push({
        type: "info" as const,
        title: "Increased Spending",
        description: `Your spending increased by ${spentChange.toFixed(1)}% this period. Consider setting a budget to track expenses.`,
      });
    } else if (spentChange < -20) {
      insights.push({
        type: "tip" as const,
        title: "Lower Spending",
        description: `You've spent ${Math.abs(spentChange).toFixed(1)}% less this period. Great job managing your budget!`,
      });
    }

    // Category insights
    if (categorySpending.length > 0) {
      const topCategory = categorySpending[0];
      insights.push({
        type: "info" as const,
        title: "Top Category",
        description: `Most of your spending (${topCategory.percentage.toFixed(1)}%) is on ${topCategory.category} services.`,
      });
    }

    // Booking completion insights
    const completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;
    if (completionRate > 90 && totalBookings >= 5) {
      insights.push({
        type: "tip" as const,
        title: "Excellent Booking Rate",
        description: `You've completed ${completionRate.toFixed(0)}% of your bookings. You're a reliable customer!`,
      });
    }

    // Provider loyalty insights
    if (topProviders.length > 0 && topProviders[0].bookings >= 3) {
      insights.push({
        type: "recommendation" as const,
        title: "Favorite Provider",
        description: `You've booked ${topProviders[0].bookings} times with ${topProviders[0].name}. Consider asking about loyalty discounts!`,
      });
    }

    // Savings opportunity
    if (loyaltyPoints >= 10) {
      insights.push({
        type: "tip" as const,
        title: "Loyalty Rewards",
        description: `You have ${loyaltyPoints} loyalty points! Check if you can redeem them for discounts.`,
      });
    }

    // Rating insights
    if (reviews.length > 0 && averageRating >= 4.5) {
      insights.push({
        type: "tip" as const,
        title: "Great Feedback Provider",
        description: `Your average rating is ${averageRating.toFixed(1)}. Your reviews help other users make informed decisions!`,
      });
    } else if (totalBookings - reviews.length >= 3) {
      insights.push({
        type: "recommendation" as const,
        title: "Leave More Reviews",
        description: `You have ${totalBookings - reviews.length} bookings without reviews. Help others by sharing your experience!`,
      });
    }

    // Budget recommendation
    if (totalBookings >= 5) {
      const avgMonthlySpend = totalSpent / (timeRange === "1y" ? 12 : timeRange === "90d" ? 3 : 1);
      insights.push({
        type: "info" as const,
        title: "Monthly Average",
        description: `Your average monthly spending is Rp ${avgMonthlySpend.toFixed(0)}. Set a budget to track your expenses better.`,
      });
    }

    const analytics: SeekerAnalytics = {
      overview: {
        totalBookings: {
          label: "Total Bookings",
          value: totalBookings,
          change: totalBookings - previousBookingsCount,
          changePercentage: bookingsChange,
          trend: determineTrend(bookingsChange),
        },
        totalSpent: {
          label: "Total Spent",
          value: totalSpent,
          change: totalSpent - previousSpent,
          changePercentage: spentChange,
          trend: determineTrend(spentChange),
        },
        favoriteServices: {
          label: "Favorite Services",
          value: favorites.length,
        },
        averageRating: {
          label: "Your Average Rating",
          value: averageRating,
        },
      },
      spending: {
        total: totalSpent,
        average: averageBookingCost,
        byPeriod: spendingByPeriod,
        byCategory: categorySpending,
      },
      bookings: {
        total: totalBookings,
        completed: completedBookings,
        cancelled: cancelledBookings,
        byStatus: bookingsByStatus,
        byPeriod: bookingsByPeriod,
        topProviders,
      },
      savings: {
        totalSaved,
        discountsUsed,
        loyaltyPoints,
      },
      insights,
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Error fetching seeker analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

