import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  role: z.enum(["SEEKER", "PROVIDER", "ADMIN"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING_VERIFICATION"]).optional(),
  isVerified: z.boolean().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: userId } = await params
    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Prevent admin from unverifying themselves
    if ((session.user as any)?.id === userId && validatedData.isVerified === false) {
      return NextResponse.json({ error: "Cannot unverify your own account" }, { status: 400 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: validatedData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        isVerified: true,
        createdAt: true,
        profileImage: true,
        location: true,
        _count: {
          select: {
            services: true,
            reviews: true,
            bookingsAsCustomer: true,
            bookingsAsProvider: true,
          }
        }
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: userId } = await params

    // Prevent admin from deleting themselves
    if ((session.user as any)?.id === userId) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check for related data that would prevent deletion
    const [servicesCount, bookingsAsCustomerCount, bookingsAsProviderCount] = await Promise.all([
      prisma.service.count({ where: { providerId: userId } }),
      prisma.booking.count({ where: { customerId: userId } }),
      prisma.booking.count({ where: { providerId: userId } })
    ])

    const totalBookings = bookingsAsCustomerCount + bookingsAsProviderCount
    const hasActiveServices = servicesCount > 0
    const hasActiveBookings = totalBookings > 0

    if (hasActiveServices || hasActiveBookings) {
      return NextResponse.json({ 
        error: "Cannot delete user with active services or bookings. Please suspend the user instead.",
        details: {
          services: servicesCount,
          bookings: totalBookings,
          bookingsAsCustomer: bookingsAsCustomerCount,
          bookingsAsProvider: bookingsAsProviderCount,
        }
      }, { status: 400 })
    }

    // Delete user with cascading deletes (handled by Prisma schema)
    await prisma.user.delete({
      where: { id: userId }
    })

    return NextResponse.json({ 
      message: "User deleted successfully",
      deletedUser: {
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.role
      }
    })
  } catch (error) {
    console.error("Error deleting user:", error)
    
    // Handle specific Prisma errors
    if (error instanceof Error && error.message.includes('Foreign key constraint')) {
      return NextResponse.json({ 
        error: "Cannot delete user due to existing relationships. Please remove related data first." 
      }, { status: 400 })
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
