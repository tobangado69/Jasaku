import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: serviceId } = await params
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

    // Validate category exists if categoryId is being updated
    if (validatedData.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: validatedData.categoryId }
      })

      if (!category) {
        return NextResponse.json({ error: "Category not found" }, { status: 400 })
      }

      // Allow providers to use their own custom categories even if inactive
      // Custom categories are created with isActive: false and need admin approval
      if (!category.isActive && userRole !== "ADMIN") {
        // Check if this is a custom category created by the current provider
        // For now, we'll allow all inactive categories for providers (custom categories)
        // In a more sophisticated system, you might want to track who created the category
        console.log(`Provider using inactive custom category: ${category.name}`)
      }
    }

    const updatedService = await prisma.service.update({
      where: { id: serviceId },
      data: validatedData,
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
            email: true,
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: serviceId } = await params

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
