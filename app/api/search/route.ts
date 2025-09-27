import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { z } from "zod"

const searchSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  location: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  radius: z.number().optional().default(10), // km
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  rating: z.number().optional(),
  limit: z.number().optional().default(20),
  offset: z.number().optional().default(0),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""
    const category = searchParams.get("category") || undefined
    const location = searchParams.get("location") || undefined
    const latitude = searchParams.get("lat") ? parseFloat(searchParams.get("lat")!) : undefined
    const longitude = searchParams.get("lng") ? parseFloat(searchParams.get("lng")!) : undefined
    const radius = searchParams.get("radius") ? parseFloat(searchParams.get("radius")!) : 10
    const minPrice = searchParams.get("minPrice") ? parseInt(searchParams.get("minPrice")!) : undefined
    const maxPrice = searchParams.get("maxPrice") ? parseInt(searchParams.get("maxPrice")!) : undefined
    const rating = searchParams.get("rating") ? parseFloat(searchParams.get("rating")!) : undefined
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = parseInt(searchParams.get("offset") || "0")

    const where: any = {
      status: "ACTIVE"
    }

    // Text search in title and description
    if (query) {
      where.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { category: { name: { contains: query, mode: "insensitive" } } }
      ]
    }

    // Category filter
    if (category) {
      where.categoryId = category
    }

    // Location-based filtering (simplified)
    if (location) {
      where.location = {
        contains: location,
        mode: "insensitive"
      }
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {}
      if (minPrice !== undefined) where.price.gte = minPrice
      if (maxPrice !== undefined) where.price.lte = maxPrice
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
        // Prioritize verified providers and higher ratings
        { provider: { isVerified: "desc" } },
        { createdAt: "desc" }
      ]
    })

    // Calculate average rating and add search relevance
    const servicesWithMetadata = services.map(service => {
      const totalReviews = service.provider.reviews.length
      const averageRating = totalReviews > 0
        ? service.provider.reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
        : 0

      // Simple relevance score based on text match
      let relevance = 0
      if (query) {
        const searchTerm = query.toLowerCase()
        if (service.title.toLowerCase().includes(searchTerm)) relevance += 10
        if (service.description.toLowerCase().includes(searchTerm)) relevance += 5
        if (service.category?.name?.toLowerCase().includes(searchTerm)) relevance += 3
      }

      return {
        ...service,
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews,
        relevance
      }
    })

    // Sort by relevance if there's a search query
    if (query) {
      servicesWithMetadata.sort((a, b) => b.relevance - a.relevance)
    }

    return NextResponse.json({
      services: servicesWithMetadata,
      total: servicesWithMetadata.length,
      hasMore: servicesWithMetadata.length === limit
    })
  } catch (error) {
    console.error("Error searching services:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
