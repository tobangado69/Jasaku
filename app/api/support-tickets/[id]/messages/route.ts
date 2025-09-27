import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

const createMessageSchema = z.object({
  content: z.string().min(1, "Message content is required"),
  receiverId: z.string().optional(), // For direct messages to specific participants
  isPublic: z.boolean().default(true) // Whether the message is visible to all participants
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: ticketId } = await params
    const body = await request.json()
    const validatedData = createMessageSchema.parse(body)

    // Check if ticket exists
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: { user: true }
    })

    if (!ticket) {
      return NextResponse.json({ error: "Support ticket not found" }, { status: 404 })
    }

    // Check if user has access to this ticket (admin or ticket owner)
    const isAdmin = (session.user as any)?.role === "ADMIN"
    const isTicketOwner = ticket.userId === (session.user as any)?.id

    if (!isAdmin && !isTicketOwner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        content: validatedData.content,
        supportTicketId: ticketId,
        senderId: (session.user as any)?.id,
        receiverId: validatedData.receiverId || ticket.userId // Send to specified receiver or ticket owner
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            profileImage: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            profileImage: true
          }
        }
      }
    })

    // Update ticket's updatedAt timestamp
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() }
    })

    // Transform response to match frontend interface
    const transformedMessage = {
      id: message.id,
      content: message.content,
      sender: {
        id: message.sender.id,
        name: message.sender.name,
        role: message.sender.role,
        profileImage: message.sender.profileImage
      },
      receiver: message.receiver ? {
        id: message.receiver.id,
        name: message.receiver.name,
        role: message.receiver.role,
        profileImage: message.receiver.profileImage
      } : null,
      timestamp: message.createdAt.toISOString(),
      isAdmin: message.sender.role === "ADMIN",
      isDirectMessage: message.receiver !== null
    }

    return NextResponse.json({
      message: "Message added successfully",
      data: transformedMessage
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error creating support message:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
