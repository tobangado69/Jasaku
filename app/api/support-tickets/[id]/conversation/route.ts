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

const addParticipantSchema = z.object({
  participantId: z.string().min(1, "Participant ID is required"),
  role: z.enum(["PROVIDER", "SEEKER", "ADMIN"]).optional()
})

// Get conversation details with all participants
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: ticketId } = await params

    // Get ticket with all related information
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            profileImage: true
          }
        },
        assignedToUser: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true
          }
        },
        messages: {
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
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    })

    if (!ticket) {
      return NextResponse.json({ error: "Support ticket not found" }, { status: 404 })
    }

    // Try to find related booking if this is a booking-related issue
    let relatedBooking = null
    if (ticket.category === "SERVICE" || ticket.category === "PAYMENT") {
      // Look for bookings related to this user
      const bookings = await prisma.booking.findMany({
        where: {
          OR: [
            { customerId: ticket.userId },
            { providerId: ticket.userId }
          ],
          status: {
            in: ["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED"]
          }
        },
        include: {
          service: {
            include: {
              provider: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                  profileImage: true
                }
              }
            }
          },
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              profileImage: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 1 // Get the most recent booking
      })

      if (bookings.length > 0) {
        relatedBooking = bookings[0]
      }
    }

    // Identify all conversation participants
    const participants = new Map()
    
    // Add ticket creator
    participants.set(ticket.user.id, {
      id: ticket.user.id,
      name: ticket.user.name,
      email: ticket.user.email,
      role: ticket.user.role,
      profileImage: ticket.user.profileImage,
      isTicketCreator: true
    })

    // Add assigned admin if any
    if (ticket.assignedToUser) {
      participants.set(ticket.assignedToUser.id, {
        id: ticket.assignedToUser.id,
        name: ticket.assignedToUser.name,
        email: ticket.assignedToUser.email,
        role: "ADMIN",
        profileImage: ticket.assignedToUser.profileImage,
        isAssignedAdmin: true
      })
    }

    // Add related booking participants if available
    if (relatedBooking) {
      participants.set(relatedBooking.customer.id, {
        id: relatedBooking.customer.id,
        name: relatedBooking.customer.name,
        email: relatedBooking.customer.email,
        role: relatedBooking.customer.role,
        profileImage: relatedBooking.customer.profileImage,
        isBookingParticipant: true
      })

      participants.set(relatedBooking.service.provider.id, {
        id: relatedBooking.service.provider.id,
        name: relatedBooking.service.provider.name,
        email: relatedBooking.service.provider.email,
        role: relatedBooking.service.provider.role,
        profileImage: relatedBooking.service.provider.profileImage,
        isBookingParticipant: true
      })
    }

    // Add message senders/receivers
    ticket.messages.forEach(message => {
      if (message.sender && !participants.has(message.sender.id)) {
        participants.set(message.sender.id, {
          id: message.sender.id,
          name: message.sender.name,
          email: message.sender.email,
          role: message.sender.role,
          profileImage: message.sender.profileImage,
          isMessageParticipant: true
        })
      }
      if (message.receiver && !participants.has(message.receiver.id)) {
        participants.set(message.receiver.id, {
          id: message.receiver.id,
          name: message.receiver.name,
          email: message.receiver.email,
          role: message.receiver.role,
          profileImage: message.receiver.profileImage,
          isMessageParticipant: true
        })
      }
    })

    // Transform messages for frontend
    const transformedMessages = ticket.messages.map(message => ({
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
    }))

    return NextResponse.json({
      ticket: {
        id: ticket.id,
        title: ticket.title,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category,
        createdAt: ticket.createdAt.toISOString(),
        updatedAt: ticket.updatedAt.toISOString(),
        resolvedAt: ticket.resolvedAt?.toISOString()
      },
      participants: Array.from(participants.values()),
      messages: transformedMessages,
      relatedBooking: relatedBooking ? {
        id: relatedBooking.id,
        service: {
          title: relatedBooking.service.title,
          provider: relatedBooking.service.provider
        },
        customer: relatedBooking.customer,
        status: relatedBooking.status
      } : null
    })

  } catch (error) {
    console.error("Error fetching conversation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Add a participant to the conversation
export async function POST(
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
    const validatedData = addParticipantSchema.parse(body)

    // Check if ticket exists
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId }
    })

    if (!ticket) {
      return NextResponse.json({ error: "Support ticket not found" }, { status: 404 })
    }

    // Check if participant exists
    const participant = await prisma.user.findUnique({
      where: { id: validatedData.participantId }
    })

    if (!participant) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 })
    }

    // Create a system message to notify about new participant
    await prisma.message.create({
      data: {
        content: `${participant.name} has been added to this conversation`,
        senderId: (session.user as any)?.id,
        receiverId: validatedData.participantId,
        supportTicketId: ticketId
      }
    })

    // Update ticket's updatedAt timestamp
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() }
    })

    return NextResponse.json({
      message: "Participant added successfully",
      participant: {
        id: participant.id,
        name: participant.name,
        email: participant.email,
        role: participant.role,
        profileImage: participant.profileImage
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error adding participant:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
