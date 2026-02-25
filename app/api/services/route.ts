import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

const createServiceSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(10),
  categoryId: z.string().min(1),
  subcategory: z.string().optional(),
  price: z.number().positive(),
  duration: z.number().positive().optional(),
  location: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  images: z.array(z.string()).optional(),
})

const updateServiceSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(10).optional(),
  categoryId: z.string().min(1).optional(),
  subcategory: z.string().optional(),
  price: z.number().positive().optional(),
  duration: z.number().positive().optional(),
  location: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  images: z.array(z.string()).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "PAUSED", "PENDING_APPROVAL", "REJECTED"]).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const location = searchParams.get("location")
    const providerId = searchParams.get("providerId")
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = parseInt(searchParams.get("offset") || "0")

    const where: any = {}

    // Only filter by ACTIVE status for public API calls (non-admin users)
    // Admin users can see all services
    const userRole = (session?.user as any)?.role
    if (userRole !== "ADMIN") {
      where.status = "ACTIVE"
    }

    if (category) where.categoryId = category
    if (providerId) where.providerId = providerId

    // Location-based filtering (simplified)
    if (location) {
      // This would be more sophisticated with proper geolocation
      where.location = {
        contains: location,
        mode: "insensitive"
      }
    }

    const services = await prisma.service.findMany({
      where,
      take: limit,
      skip: offset,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        provider: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
            location: true,
            isVerified: true,
            _count: {
              select: {
                reviews: true
              }
            },
            reviews: {
              select: {
                rating: true
              }
            }
          }
        },
        _count: {
          select: {
            bookings: true,
            favoritedBy: true
          }
        }
      },
      orderBy: [
        { createdAt: "desc" }
      ]
    })

    const servicesWithRating = services.map(service => {
      const totalReviews = service.provider.reviews.length
      const averageRating = totalReviews > 0
        ? service.provider.reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
        : 0

      return {
        ...service,
        category: service.category?.name || "Other",
        categoryId: service.category?.id,
        provider: {
          ...service.provider,
          rating: Math.round(averageRating * 10) / 10,
        },
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews
      }
    })

    return NextResponse.json(servicesWithRating)
  } catch (error) {
    console.error("Error fetching services:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== "PROVIDER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createServiceSchema.parse(body)

    // Verify that the category exists
    const category = await prisma.category.findUnique({
      where: { id: validatedData.categoryId }
    })

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 400 })
    }

    // Allow providers to use custom categories even if inactive
    // Custom categories are created with isActive: false and need admin approval
    if (!category.isActive) {
      console.log(`Provider using inactive custom category: ${category.name}`)
      // We'll allow this for custom categories created by providers
    }

    const service = await prisma.service.create({
      data: {
        ...validatedData,
        providerId: (session.user as any)?.id,
        status: "PENDING_APPROVAL"
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        provider: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
            location: true,
            isVerified: true
          }
        }
      }
    })

    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error creating service:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { pathname } = new URL(request.url)
    const serviceId = pathname.split('/').pop()

    if (!serviceId) {
      return NextResponse.json({ error: "Service ID required" }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = updateServiceSchema.parse(body)

    // Check if user is authorized to update this service
    const service = await prisma.service.findUnique({
      where: { id: serviceId }
    })

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 })
    }

    // Check if user is the provider or admin
    const userRole = (session.user as any)?.role
    const isProvider = service.providerId === (session.user as any)?.id
    const isAdmin = userRole === "ADMIN"

    if (!isProvider && !isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const updatedService = await prisma.service.update({
      where: { id: serviceId },
      data: validatedData,
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
            location: true,
            isVerified: true
          }
        },
        _count: {
          select: {
            bookings: true,
            favoritedBy: true
          }
        }
      }
    })

    return NextResponse.json(updatedService)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error updating service:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { pathname } = new URL(request.url)
    const serviceId = pathname.split('/').pop()

    if (!serviceId) {
      return NextResponse.json({ error: "Service ID required" }, { status: 400 })
    }

    // Check if user is authorized to delete this service
    const service = await prisma.service.findUnique({
      where: { id: serviceId }
    })

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 })
    }

    // Check if user is the provider or admin
    const userRole = (session.user as any)?.role
    const isProvider = service.providerId === (session.user as any)?.id
    const isAdmin = userRole === "ADMIN"

    if (!isProvider && !isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await prisma.service.delete({
      where: { id: serviceId }
    })

    return NextResponse.json({ message: "Service deleted successfully" })
  } catch (error) {
    console.error("Error deleting service:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
