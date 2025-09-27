import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

const createMessageSchema = z.object({
  content: z.string().min(1),
  receiverId: z.string(),
  bookingId: z.string(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get("bookingId")
    const userId = (session.user as any)?.id

    if (bookingId) {
      // Get messages for a specific booking
      const messages = await prisma.message.findMany({
        where: {
          bookingId,
          OR: [
            { senderId: userId },
            { receiverId: userId }
          ]
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              profileImage: true,
              role: true,
            }
          },
          receiver: {
            select: {
              id: true,
              name: true,
              profileImage: true,
              role: true,
            }
          }
        },
        orderBy: {
          createdAt: "asc"
        }
      })

      return NextResponse.json(messages)
    }

    // Get all conversations (unique bookings with messages)
    const conversations = await prisma.booking.findMany({
      where: {
        OR: [
          { customerId: userId },
          { providerId: userId }
        ],
        messages: {
          some: {}
        }
      },
      include: {
        service: {
          select: {
            id: true,
            title: true,
          }
        },
        customer: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          }
        },
        provider: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          }
        },
        messages: {
          orderBy: {
            createdAt: "desc"
          },
          take: 1,
          include: {
            sender: {
              select: {
                name: true,
                role: true,
              }
            }
          }
        },
        _count: {
          select: {
            messages: true
          }
        }
      }
    })

    // Transform to conversation format
    const transformedConversations = conversations.map(booking => {
      const otherUser = booking.customerId === userId ? booking.provider : booking.customer
      const lastMessage = booking.messages[0]
      
      return {
        id: booking.id,
        customer: otherUser,
        service: booking.service,
        lastMessage: lastMessage ? {
          content: lastMessage.content,
          timestamp: lastMessage.createdAt.toISOString(),
          isFromProvider: lastMessage.sender.role === "PROVIDER"
        } : null,
        unreadCount: booking._count.messages,
        status: booking.status
      }
    })

    return NextResponse.json(transformedConversations)
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createMessageSchema.parse(body)
    const senderId = (session.user as any)?.id

    // Verify user has access to this booking
    const booking = await prisma.booking.findUnique({
      where: { id: validatedData.bookingId },
      select: {
        customerId: true,
        providerId: true,
      }
    })

    if (!booking || (booking.customerId !== senderId && booking.providerId !== senderId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        content: validatedData.content,
        senderId,
        receiverId: validatedData.receiverId,
        bookingId: validatedData.bookingId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            profileImage: true,
            role: true,
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            profileImage: true,
            role: true,
          }
        }
      }
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error creating message:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
