import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") // "provider", "seeker", or "admin"
    const year = searchParams.get("year") || new Date().getFullYear().toString()
    const month = searchParams.get("month") || (new Date().getMonth() + 1).toString()
    const comparison = searchParams.get("comparison") || "previous"

    if (!type) {
      return NextResponse.json({ error: "Dashboard type required" }, { status: 400 })
    }

    // Validate month selection for admin dashboard
    if (type === "admin") {
      const validateMonthSelection = (year: number, month: number) => {
        const now = new Date()
        const currentYear = now.getFullYear()
        const currentMonth = now.getMonth() + 1
        
        // Reject future months
        if (year > currentYear || (year === currentYear && month > currentMonth)) {
          throw new Error("Cannot request data for future months")
        }
        
        // Limit historical data to 24 months
        const minYear = currentYear - 2
        if (year < minYear || (year === minYear && month < currentMonth)) {
          throw new Error("Historical data limited to last 24 months")
        }
        
        // Validate month range
        if (month < 1 || month > 12) {
          throw new Error("Invalid month value")
        }
      }

      try {
        validateMonthSelection(parseInt(year), parseInt(month))
      } catch (error) {
        return NextResponse.json({ 
          error: error instanceof Error ? error.message : "Invalid month selection" 
        }, { status: 400 })
      }
    }

    let dashboardData: any = {}

    switch (type) {
      case "provider":
        dashboardData = await getProviderDashboard((session.user as any)?.id || "")
        break
      case "seeker":
        dashboardData = await getSeekerDashboard((session.user as any)?.id || "")
        break
      case "admin":
        dashboardData = await getAdminDashboard(parseInt(year), parseInt(month), comparison)
        break
      default:
        return NextResponse.json({ error: "Invalid dashboard type" }, { status: 400 })
    }

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function getProviderDashboard(userId: string) {
  // Get provider's services
  const services = await prisma.service.findMany({
    where: { providerId: userId },
    include: {
      _count: { select: { bookings: true } },
      bookings: {
        where: { status: "COMPLETED" },
        select: { totalAmount: true }
      }
    }
  })

  // Calculate earnings
  const totalEarnings = services.reduce((sum: number, service: any) =>
    sum + service.bookings.reduce((bookingSum: number, booking: any) => bookingSum + booking.totalAmount, 0), 0
  )

  const monthlyEarnings = await prisma.booking.aggregate({
    where: {
      providerId: userId,
      status: "COMPLETED",
      createdAt: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    },
    _sum: { totalAmount: true }
  })

  // Get recent bookings
  const recentBookings = await prisma.booking.findMany({
    where: { providerId: userId },
    take: 5,
    include: {
      service: { select: { title: true, category: true } },
      customer: { select: { name: true, profileImage: true } }
    },
    orderBy: { createdAt: "desc" }
  })

  // Calculate stats
  const totalBookings = await prisma.booking.count({
    where: { providerId: userId }
  })

  const completedBookings = await prisma.booking.count({
    where: { providerId: userId, status: "COMPLETED" }
  })

  const averageRating = await prisma.review.aggregate({
    where: { service: { providerId: userId } },
    _avg: { rating: true }
  })

  return {
    stats: {
      totalEarnings,
      monthlyEarnings: monthlyEarnings._sum.totalAmount || 0,
      completedBookings,
      averageRating: averageRating._avg.rating || 0,
      totalBookings
    },
    recentBookings,
    services
  }
}

async function getSeekerDashboard(userId: string) {
  // Get recent bookings
  const recentBookings = await prisma.booking.findMany({
    where: { customerId: userId },
    take: 5,
    include: {
      service: {
        select: { 
          title: true, 
          category: true, 
          images: true,
          provider: { 
            select: { name: true, profileImage: true } 
          }
        }
      },
      payment: true
    },
    orderBy: { createdAt: "desc" }
  })

  // Calculate stats
  const totalBookings = await prisma.booking.count({
    where: { customerId: userId }
  })

  const completedBookings = await prisma.booking.count({
    where: { customerId: userId, status: "COMPLETED" }
  })

  const totalSpent = await prisma.booking.aggregate({
    where: { customerId: userId, status: "COMPLETED" },
    _sum: { totalAmount: true }
  })

  const favoriteProviders = await prisma.user.count({
    where: {
      services: {
        some: {
          favoritedBy: {
            some: { id: userId }
          }
        }
      }
    }
  })

  return {
    stats: {
      totalBookings,
      completedBookings,
      totalSpent: totalSpent._sum.totalAmount || 0,
      favoriteProviders
    },
    recentBookings,
    favoriteProviders: [] // Would need a favorites table
  }
}

async function getAdminDashboard(year: number, month: number, comparison: string) {
  // Calculate date ranges based on selected month/year first
  const currentMonthStart = new Date(year, month - 1, 1)
  const currentMonthEnd = new Date(year, month, 0, 23, 59, 59)
  
  let comparisonStart: Date, comparisonEnd: Date
  
  if (comparison === "previous") {
    // Previous month
    comparisonStart = new Date(year, month - 2, 1)
    comparisonEnd = new Date(year, month - 1, 0, 23, 59, 59)
  } else {
    // Same month last year
    comparisonStart = new Date(year - 1, month - 1, 1)
    comparisonEnd = new Date(year - 1, month, 0, 23, 59, 59)
  }

  // Platform-wide stats (total counts)
  const totalUsers = await prisma.user.count()
  const totalServices = await prisma.service.count()
  const totalBookings = await prisma.booking.count()
  const totalRevenue = await prisma.booking.aggregate({
    where: { status: "COMPLETED" },
    _sum: { totalAmount: true }
  })

  // Month-specific stats
  const activeProviders = await prisma.user.count({
    where: { 
      role: "PROVIDER", 
      status: "ACTIVE",
      createdAt: {
        lte: currentMonthEnd // Active providers as of the selected month
      }
    }
  })

  const activeSeekers = await prisma.user.count({
    where: { 
      role: "SEEKER", 
      status: "ACTIVE",
      createdAt: {
        lte: currentMonthEnd // Active seekers as of the selected month
      }
    }
  })

  const pendingServices = await prisma.service.count({
    where: { status: "PENDING_APPROVAL" }
  })

  // Current month revenue
  const monthlyRevenue = await prisma.booking.aggregate({
    where: {
      status: "COMPLETED",
      createdAt: {
        gte: currentMonthStart,
        lte: currentMonthEnd
      }
    },
    _sum: { totalAmount: true }
  })

  // Current month bookings
  const completedBookings = await prisma.booking.count({
    where: { 
      status: "COMPLETED",
      createdAt: {
        gte: currentMonthStart,
        lte: currentMonthEnd
      }
    }
  })

  // Average rating for the selected month
  const averageRating = await prisma.review.aggregate({
    where: {
      createdAt: {
        gte: currentMonthStart,
        lte: currentMonthEnd
      }
    },
    _avg: { rating: true }
  })

  // Support tickets for the selected month
  const totalSupportTickets = await prisma.supportTicket.count({
    where: {
      createdAt: {
        gte: currentMonthStart,
        lte: currentMonthEnd
      }
    }
  })

  const openSupportTickets = await prisma.supportTicket.count({
    where: {
      createdAt: {
        gte: currentMonthStart,
        lte: currentMonthEnd
      },
      OR: [
        { status: "OPEN" },
        { status: "IN_PROGRESS" }
      ]
    }
  })

  // Current month data
  const currentMonthUsers = await prisma.user.count({
    where: {
      createdAt: {
        gte: currentMonthStart,
        lte: currentMonthEnd
      }
    }
  })

  const currentMonthRevenue = await prisma.booking.aggregate({
    where: {
      status: "COMPLETED",
      createdAt: {
        gte: currentMonthStart,
        lte: currentMonthEnd
      }
    },
    _sum: { totalAmount: true }
  })

  const currentMonthBookings = await prisma.booking.count({
    where: {
      createdAt: {
        gte: currentMonthStart,
        lte: currentMonthEnd
      }
    }
  })

  const currentMonthServices = await prisma.service.count({
    where: {
      createdAt: {
        gte: currentMonthStart,
        lte: currentMonthEnd
      }
    }
  })

  // Comparison period data
  const previousMonthUsers = await prisma.user.count({
    where: {
      createdAt: {
        gte: comparisonStart,
        lte: comparisonEnd
      }
    }
  })

  const previousMonthRevenue = await prisma.booking.aggregate({
    where: {
      status: "COMPLETED",
      createdAt: {
        gte: comparisonStart,
        lte: comparisonEnd
      }
    },
    _sum: { totalAmount: true }
  })

  const previousMonthBookings = await prisma.booking.count({
    where: {
      createdAt: {
        gte: comparisonStart,
        lte: comparisonEnd
      }
    }
  })

  const previousMonthServices = await prisma.service.count({
    where: {
      createdAt: {
        gte: comparisonStart,
        lte: comparisonEnd,
      },
    },
  });

  // Comparison period data for previously static metrics
  const previousMonthActiveProviders = await prisma.user.count({
    where: { 
      role: "PROVIDER", 
      status: "ACTIVE",
      createdAt: {
        lte: comparisonEnd
      }
    }
  })

  const previousMonthSupportTickets = await prisma.supportTicket.count({
    where: {
      createdAt: {
        gte: comparisonStart,
        lte: comparisonEnd
      }
    }
  })

  const previousMonthCompletedBookings = await prisma.booking.count({
    where: { 
      status: "COMPLETED",
      createdAt: {
        gte: comparisonStart,
        lte: comparisonEnd
      }
    }
  })

  const previousMonthAverageRating = await prisma.review.aggregate({
    where: {
      createdAt: {
        gte: comparisonStart,
        lte: comparisonEnd
      }
    },
    _avg: { rating: true }
  })

  // Calculate completion rates for current and comparison periods
  const currentMonthTotalBookings = await prisma.booking.count({
    where: {
      createdAt: {
        gte: currentMonthStart,
        lte: currentMonthEnd
      }
    }
  })

  const previousMonthTotalBookings = await prisma.booking.count({
    where: {
      createdAt: {
        gte: comparisonStart,
        lte: comparisonEnd
      }
    }
  })

  const currentCompletionRate = currentMonthTotalBookings > 0 
    ? (completedBookings / currentMonthTotalBookings) * 100 
    : 0

  const previousCompletionRate = previousMonthTotalBookings > 0 
    ? (previousMonthCompletedBookings / previousMonthTotalBookings) * 100 
    : 0

  // Fetch historical data for charts (last 6 months from selected month)
  const sixMonthsAgo = new Date(year, month - 7, 1); // 6 months before selected month
  const chartEndDate = new Date(year, month, 0, 23, 59, 59); // End of selected month

  // Get all bookings in the last 6 months
  const revenueBookings = await prisma.booking.findMany({
    where: {
      status: "COMPLETED",
      createdAt: {
        gte: sixMonthsAgo,
        lte: chartEndDate,
      },
    },
    select: {
      createdAt: true,
      totalAmount: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // Get all users created in the last 6 months
  const newUsers = await prisma.user.findMany({
    where: {
      createdAt: {
        gte: sixMonthsAgo,
        lte: chartEndDate,
      },
    },
    select: {
      createdAt: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // Generate month labels for last 6 months
  const generateMonthLabels = () => {
    const labels = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(year, month - 1 - i, 1);
      labels.push({
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        label: date.toLocaleString("default", { month: "short" }),
        year: date.getFullYear(),
        month: date.getMonth() + 1,
      });
    }
    return labels;
  };

  const monthLabels = generateMonthLabels();

  // Format revenue chart data
  const revenueMap = new Map<string, number>();
  monthLabels.forEach(m => revenueMap.set(m.key, 0));

  revenueBookings.forEach((booking: { createdAt: Date; totalAmount: number }) => {
    const bookingDate = new Date(booking.createdAt);
    const key = `${bookingDate.getFullYear()}-${String(bookingDate.getMonth() + 1).padStart(2, '0')}`;
    if (revenueMap.has(key)) {
      revenueMap.set(key, (revenueMap.get(key) || 0) + booking.totalAmount);
    }
  });

  const revenueChart = monthLabels.map(m => ({
    month: m.label,
    revenue: revenueMap.get(m.key) || 0,
  }));

  // Format users chart data
  const usersMap = new Map<string, number>();
  monthLabels.forEach(m => usersMap.set(m.key, 0));

  newUsers.forEach((user: { createdAt: Date }) => {
    const userDate = new Date(user.createdAt);
    const key = `${userDate.getFullYear()}-${String(userDate.getMonth() + 1).padStart(2, '0')}`;
    if (usersMap.has(key)) {
      usersMap.set(key, (usersMap.get(key) || 0) + 1);
    }
  });

  const usersChart = monthLabels.map(m => ({
    month: m.label,
    users: usersMap.get(m.key) || 0,
  }));

  // Recent users
  const recentUsers = await prisma.user.findMany({
    take: 5,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true
    },
    orderBy: { createdAt: "desc" }
  })

  return {
    stats: {
      totalUsers,
      activeProviders,
      activeSeekers,
      totalServices,
      pendingServices,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      monthlyRevenue: monthlyRevenue._sum.totalAmount || 0,
      totalBookings,
      completedBookings,
      averageRating: averageRating._avg.rating || 0,
      supportTickets: totalSupportTickets,
      openTickets: openSupportTickets,
      previousMonthUsers,
      previousMonthRevenue: previousMonthRevenue._sum.totalAmount || 0,
      previousMonthBookings,
      previousMonthServices,
      currentMonthUsers,
      currentMonthRevenue: currentMonthRevenue._sum.totalAmount || 0,
      currentMonthBookings,
      currentMonthServices,
      // New month-specific comparison data
      previousMonthActiveProviders,
      previousMonthSupportTickets,
      previousMonthAverageRating: previousMonthAverageRating._avg.rating || 0,
      currentCompletionRate,
      previousCompletionRate
    },
    charts: {
      revenue: revenueChart,
      users: usersChart,
    },
    recentUsers
  }
}
