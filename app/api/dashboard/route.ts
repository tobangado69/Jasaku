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

    if (!type) {
      return NextResponse.json({ error: "Dashboard type required" }, { status: 400 })
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
        dashboardData = await getAdminDashboard()
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
  const totalEarnings = services.reduce((sum, service) =>
    sum + service.bookings.reduce((bookingSum, booking) => bookingSum + booking.totalAmount, 0), 0
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

  const rawRecentBookings = await prisma.booking.findMany({
    where: { providerId: userId },
    take: 5,
    include: {
      service: {
        select: {
          title: true,
          category: { select: { name: true } }
        }
      },
      customer: { select: { name: true, profileImage: true } }
    },
    orderBy: { createdAt: "desc" }
  })

  const recentBookings = rawRecentBookings.map(b => ({
    ...b,
    service: { ...b.service, category: b.service.category?.name || "Other" }
  }))

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
  const rawSeekerBookings = await prisma.booking.findMany({
    where: { customerId: userId },
    take: 5,
    include: {
      service: {
        select: { title: true, category: { select: { name: true } }, images: true },
        include: { provider: { select: { name: true, profileImage: true } } }
      },
      payment: true
    },
    orderBy: { createdAt: "desc" }
  })

  const recentBookings = rawSeekerBookings.map(b => ({
    ...b,
    service: { ...b.service, category: b.service.category?.name || "Other" }
  }))

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

async function getAdminDashboard() {
  // Platform-wide stats
  const totalUsers = await prisma.user.count()
  const activeProviders = await prisma.user.count({
    where: { role: "PROVIDER", status: "ACTIVE" }
  })
  const activeSeekers = await prisma.user.count({
    where: { role: "SEEKER", status: "ACTIVE" }
  })

  // Get total services and pending services
  const totalServices = await prisma.service.count()
  const pendingServices = await prisma.service.count({
    where: { status: "PENDING_APPROVAL" }
  })

  const totalRevenue = await prisma.booking.aggregate({
    where: { status: "COMPLETED" },
    _sum: { totalAmount: true }
  })

  const monthlyRevenue = await prisma.booking.aggregate({
    where: {
      status: "COMPLETED",
      createdAt: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    },
    _sum: { totalAmount: true }
  })

  const totalBookings = await prisma.booking.count()
  const completedBookings = await prisma.booking.count({
    where: { status: "COMPLETED" }
  })

  const averageRating = await prisma.review.aggregate({
    _avg: { rating: true }
  })

  // Get support tickets stats
  const totalSupportTickets = await prisma.supportTicket.count()
  const openSupportTickets = await prisma.supportTicket.count({
    where: {
      OR: [
        { status: "OPEN" },
        { status: "IN_PROGRESS" }
      ]
    }
  })

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
      openTickets: openSupportTickets
    },
    recentUsers
  }
}
