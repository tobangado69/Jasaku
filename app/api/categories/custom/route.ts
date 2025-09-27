import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

const createCustomCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(50, "Category name must be less than 50 characters"),
  description: z.string().optional(),
})

// Allow providers to create custom categories (requires approval)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== "PROVIDER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createCustomCategorySchema.parse(body)

    // Check if category already exists (case-insensitive for SQLite)
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: {
          equals: validatedData.name
        }
      }
    })

    if (existingCategory) {
      return NextResponse.json({ 
        error: "Category already exists",
        existingCategory: {
          id: existingCategory.id,
          name: existingCategory.name
        }
      }, { status: 400 })
    }

    // Create custom category (will be inactive until admin approval)
    const category = await prisma.category.create({
      data: {
        name: validatedData.name,
        description: validatedData.description || `Custom category created by provider: ${(session.user as any)?.name}`,
        isActive: false // Custom categories need admin approval
      },
      include: {
        _count: {
          select: {
            services: true
          }
        }
      }
    })

    return NextResponse.json({
      category,
      message: "Custom category created successfully. It will be reviewed and activated by an administrator.",
      requiresApproval: true
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error creating custom category:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
