import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

const createServiceSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  categoryId: z.string().min(1),
  subcategory: z.string().optional(),
  price: z.number().min(0),
  duration: z.number().optional(),
  location: z.string().optional(),
  images: z.array(z.string()).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== "PROVIDER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const services = await prisma.service.findMany({
      where: {
        providerId: (session.user as any)?.id
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        _count: {
          select: {
            bookings: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    // Transform the data to match the expected interface
    const transformedServices = services.map(service => ({
      id: service.id,
      title: service.title,
      description: service.description,
      category: service.category.name,
      categoryId: service.category.id, // Include categoryId for editing
      subcategory: service.subcategory,
      price: service.price,
      duration: service.duration,
      status: service.status,
      images: service.images as string[] || [],
      location: service.location,
      _count: service._count,
      createdAt: service.createdAt.toISOString(),
      updatedAt: service.updatedAt.toISOString(),
    }))

    return NextResponse.json(transformedServices)
  } catch (error) {
    console.error("Error fetching provider services:", error)
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
        title: validatedData.title,
        description: validatedData.description,
        categoryId: validatedData.categoryId,
        subcategory: validatedData.subcategory,
        price: validatedData.price,
        duration: validatedData.duration,
        location: validatedData.location,
        images: validatedData.images || [],
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
        _count: {
          select: {
            bookings: true
          }
        }
      }
    })

    // Transform the data to match the expected interface
    const transformedService = {
      id: service.id,
      title: service.title,
      description: service.description,
      category: service.category.name,
      subcategory: service.subcategory,
      price: service.price,
      duration: service.duration,
      status: service.status,
      images: service.images as string[] || [],
      _count: service._count,
      createdAt: service.createdAt.toISOString(),
      updatedAt: service.updatedAt.toISOString(),
    }

    return NextResponse.json(transformedService, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error creating service:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
