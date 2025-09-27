import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

const updateSupportTicketSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assignedTo: z.string().optional()
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

    const { id: ticketId } = await params
    const body = await request.json()
    const validatedData = updateSupportTicketSchema.parse(body)

    // Check if ticket exists
    const existingTicket = await prisma.supportTicket.findUnique({
      where: { id: ticketId }
    })

    if (!existingTicket) {
      return NextResponse.json({ error: "Support ticket not found" }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = { ...validatedData }

    // If status is being changed to RESOLVED or CLOSED, set resolvedAt
    if (validatedData.status === "RESOLVED" || validatedData.status === "CLOSED") {
      updateData.resolvedAt = new Date()
    } else if (validatedData.status === "OPEN" || validatedData.status === "IN_PROGRESS") {
      // If reopening or starting work, clear resolvedAt
      updateData.resolvedAt = null
    }

    // Update ticket
    const updatedTicket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        assignedToUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        messages: {
          select: {
            id: true,
            content: true,
            sender: {
              select: {
                name: true,
                role: true
              }
            },
            createdAt: true
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    })

    // Transform response to match frontend interface
    const transformedTicket = {
      id: updatedTicket.id,
      title: updatedTicket.title,
      description: updatedTicket.description,
      status: updatedTicket.status,
      priority: updatedTicket.priority,
      category: updatedTicket.category,
      user: updatedTicket.user,
      messages: updatedTicket.messages.map(message => ({
        id: message.id,
        content: message.content,
        sender: message.sender.name,
        timestamp: message.createdAt.toISOString(),
        isAdmin: message.sender.role === "ADMIN"
      })),
      createdAt: updatedTicket.createdAt.toISOString(),
      updatedAt: updatedTicket.updatedAt.toISOString(),
      resolvedAt: updatedTicket.resolvedAt?.toISOString()
    }

    return NextResponse.json(transformedTicket)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error updating support ticket:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
