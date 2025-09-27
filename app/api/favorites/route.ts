import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== "SEEKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's favorite providers through their favorite services
    const favoriteServices = await prisma.service.findMany({
      where: {
        favoritedBy: {
          some: {
            id: (session.user as any)?.id
          }
        }
      },
      include: {
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
                reviews: true,
                services: true
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
      }
    })

    // Group services by provider to get unique providers
    const providerMap = new Map()
    
    favoriteServices.forEach(service => {
      const providerId = service.provider.id
      if (!providerMap.has(providerId)) {
        providerMap.set(providerId, {
          id: service.provider.id,
          name: service.provider.name,
          email: service.provider.email,
          profileImage: service.provider.profileImage,
          location: service.provider.location,
          isVerified: service.provider.isVerified,
          totalServices: service.provider._count.services,
          totalReviews: service.provider._count.reviews,
          averageRating: service.provider.reviews.length > 0 
            ? service.provider.reviews.reduce((sum, review) => sum + review.rating, 0) / service.provider.reviews.length
            : 0,
          favoriteServices: []
        })
      }
      
      providerMap.get(providerId).favoriteServices.push({
        id: service.id,
        title: service.title,
        price: service.price,
        bookings: service._count.bookings
      })
    })

    const favoriteProviders = Array.from(providerMap.values())

    return NextResponse.json(favoriteProviders)
  } catch (error) {
    console.error("Error fetching favorites:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== "SEEKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const providerId = searchParams.get("providerId")

    if (!providerId) {
      return NextResponse.json({ error: "Provider ID is required" }, { status: 400 })
    }

    // Remove all services from this provider from user's favorites
    const servicesToUpdate = await prisma.service.findMany({
      where: {
        providerId: providerId,
        favoritedBy: {
          some: {
            id: (session.user as any)?.id
          }
        }
      }
    })

    // Update each service to remove the user from favorites
    for (const service of servicesToUpdate) {
      await prisma.service.update({
        where: { id: service.id },
        data: {
          favoritedBy: {
            disconnect: {
              id: (session.user as any)?.id
            }
          }
        }
      })
    }

    return NextResponse.json({ message: "Provider removed from favorites" })
  } catch (error) {
    console.error("Error removing favorite:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
