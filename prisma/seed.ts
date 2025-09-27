import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Hash password function
async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12)
}

async function main() {
  // Create demo users
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@jasaku.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@jasaku.com',
      role: 'ADMIN',
      status: 'ACTIVE',
      isVerified: true,
      password: await hashPassword('password'),
      phone: '+6281234567892',
    },
  })

  const providerUser = await prisma.user.upsert({
    where: { email: 'provider@jasaku.com' },
    update: {},
    create: {
      name: 'John Provider',
      email: 'provider@jasaku.com',
      role: 'PROVIDER',
      status: 'ACTIVE',
      isVerified: true,
      password: await hashPassword('password'),
      phone: '+6281234567890',
      location: 'Jakarta',
      businessName: 'CleanPro Services',
      businessType: 'Individual',
    },
  })

  const seekerUser = await prisma.user.upsert({
    where: { email: 'seeker@jasaku.com' },
    update: {},
    create: {
      name: 'Jane Seeker',
      email: 'seeker@jasaku.com',
      role: 'SEEKER',
      status: 'ACTIVE',
      password: await hashPassword('password'),
      phone: '+6281234567891',
      location: 'Bandung',
    },
  })

  // Create services
  const houseCleaningService = await prisma.service.upsert({
    where: { id: 'service-1' },
    update: {},
    create: {
      id: 'service-1',
      title: 'House Cleaning',
      description: 'Professional house cleaning service with eco-friendly products',
      categoryId: 'cat_cleaning',
      subcategory: 'Deep Cleaning',
      price: 150000,
      duration: 120,
      location: 'Jakarta',
      status: 'ACTIVE',
      providerId: providerUser.id,
    },
  })

  const webDevService = await prisma.service.upsert({
    where: { id: 'service-2' },
    update: {
      status: 'PENDING_APPROVAL'
    },
    create: {
      id: 'service-2',
      title: 'Web Development',
      description: 'Custom website development and maintenance',
      categoryId: 'cat_it',
      subcategory: 'Web Development',
      price: 500000,
      duration: 240,
      location: 'Bandung',
      status: 'PENDING_APPROVAL',
      providerId: providerUser.id,
    },
  })

  // Create a rejected service for testing
  const plumbingService = await prisma.service.upsert({
    where: { id: 'service-3' },
    update: {
      status: 'REJECTED'
    },
    create: {
      id: 'service-3',
      title: 'Plumbing Repair',
      description: 'Professional plumbing services',
      categoryId: 'cat_home',
      price: 200000,
      duration: 180,
      location: 'Surabaya',
      status: 'REJECTED',
      providerId: providerUser.id,
    },
  })

  // Create an unverified provider for testing verification
  const unverifiedProvider = await prisma.user.upsert({
    where: { email: 'unverified@jasaku.com' },
    update: {},
    create: {
      id: 'user-unverified',
      email: 'unverified@jasaku.com',
      name: 'Unverified Provider',
      role: 'PROVIDER',
      status: 'ACTIVE',
      isVerified: false, // Unverified provider
      password: await hashPassword('password'),
      phone: '+6281234567892',
      location: 'Bandung',
      businessName: 'Unverified Services',
    },
  })

  // Create a service from unverified provider
  const unverifiedService = await prisma.service.upsert({
    where: { id: 'service-4' },
    update: {
      status: 'PENDING_APPROVAL'
    },
    create: {
      id: 'service-4',
      title: 'Computer & Laptop Repair',
      description: 'Professional computer and laptop repair services',
      categoryId: 'cat_it',
      price: 300000,
      duration: 120,
      location: 'Bandung',
      status: 'PENDING_APPROVAL', // Set to pending approval for testing verification
      providerId: unverifiedProvider.id, // Unverified provider
    },
  })

  // Create bookings
  const booking1 = await prisma.booking.upsert({
    where: { id: 'booking-1' },
    update: {},
    create: {
      id: 'booking-1',
      status: 'CONFIRMED',
      scheduledAt: new Date('2024-01-20T10:00:00Z'),
      totalAmount: 150000,
      serviceId: 'service-1',
      customerId: seekerUser.id,
      providerId: providerUser.id,
      notes: 'Please clean the kitchen thoroughly',
    },
  })

  const booking2 = await prisma.booking.upsert({
    where: { id: 'booking-2' },
    update: {},
    create: {
      id: 'booking-2',
      status: 'PENDING',
      scheduledAt: new Date('2024-01-25T14:00:00Z'),
      totalAmount: 500000,
      serviceId: 'service-2',
      customerId: seekerUser.id,
      providerId: providerUser.id,
    },
  })

  // Create payments
  await prisma.payment.upsert({
    where: { id: 'payment-1' },
    update: {},
    create: {
      id: 'payment-1',
      amount: 150000,
      status: 'COMPLETED',
      paymentMethod: 'QRIS',
      transactionId: 'TXN-001',
      paidAt: new Date('2024-01-20T09:30:00Z'),
      bookingId: 'booking-1',
    },
  })

  await prisma.payment.upsert({
    where: { id: 'payment-2' },
    update: {},
    create: {
      id: 'payment-2',
      amount: 500000,
      status: 'PENDING',
      paymentMethod: 'Bank Transfer',
      bookingId: 'booking-2',
    },
  })

  // Create a review
  await prisma.review.upsert({
    where: { id: 'review-1' },
    update: {},
    create: {
      id: 'review-1',
      rating: 5,
      comment: 'Excellent service!',
      serviceId: 'service-1',
      reviewerId: seekerUser.id,
      bookingId: 'booking-1',
    },
  })

      // Add service to favorites
      await prisma.user.update({
        where: { id: seekerUser.id },
        data: {
          favoriteServices: {
            connect: { id: 'service-1' }
          }
        }
      })

      // Create some messages for testing the messaging system
      await prisma.message.upsert({
        where: { id: 'message-1' },
        update: {},
        create: {
          id: 'message-1',
          content: 'Hi, I have some questions about the house cleaning service.',
          senderId: seekerUser.id,
          receiverId: providerUser.id,
          bookingId: 'booking-1',
        }
      })

      await prisma.message.upsert({
        where: { id: 'message-2' },
        update: {},
        create: {
          id: 'message-2',
          content: 'Hello! I would be happy to help. What would you like to know?',
          senderId: providerUser.id,
          receiverId: seekerUser.id,
          bookingId: 'booking-1',
        }
      })

      await prisma.message.upsert({
        where: { id: 'message-3' },
        update: {},
        create: {
          id: 'message-3',
          content: 'What cleaning products do you use? I have allergies.',
          senderId: seekerUser.id,
          receiverId: providerUser.id,
          bookingId: 'booking-1',
        }
      })

      // Create additional users for more realistic data
      const provider2 = await prisma.user.upsert({
        where: { email: 'provider2@jasaku.com' },
        update: {},
        create: {
          name: 'Sarah Johnson',
          email: 'provider2@jasaku.com',
          role: 'PROVIDER',
          status: 'ACTIVE',
          isVerified: true,
          password: await hashPassword('password'),
          phone: '+6281234567893',
          location: 'Surabaya',
          businessName: 'Tech Solutions',
          businessType: 'Company',
        },
      })

      const seeker2 = await prisma.user.upsert({
        where: { email: 'seeker2@jasaku.com' },
        update: {},
        create: {
          name: 'Michael Brown',
          email: 'seeker2@jasaku.com',
          role: 'SEEKER',
          status: 'ACTIVE',
          password: await hashPassword('password'),
          phone: '+6281234567894',
          location: 'Medan',
        },
      })

      const seeker3 = await prisma.user.upsert({
        where: { email: 'seeker3@jasaku.com' },
        update: {},
        create: {
          name: 'Lisa Wilson',
          email: 'seeker3@jasaku.com',
          role: 'SEEKER',
          status: 'ACTIVE',
          password: await hashPassword('password'),
          phone: '+6281234567895',
          location: 'Yogyakarta',
        },
      })

      // Create more services
      const mobileAppService = await prisma.service.upsert({
        where: { id: 'service-5' },
        update: {},
        create: {
          id: 'service-5',
          title: 'Mobile App Development',
          description: 'iOS and Android app development services',
          categoryId: 'cat_it',
          subcategory: 'Mobile Development',
          price: 800000,
          duration: 480,
          location: 'Surabaya',
          status: 'ACTIVE',
          providerId: provider2.id,
        },
      })

      const graphicDesignService = await prisma.service.upsert({
        where: { id: 'service-6' },
        update: {},
        create: {
          id: 'service-6',
          title: 'Graphic Design',
          description: 'Logo design, branding, and marketing materials',
          categoryId: 'cat_other',
          subcategory: 'Graphic Design',
          price: 250000,
          duration: 180,
          location: 'Jakarta',
          status: 'ACTIVE',
          providerId: providerUser.id,
        },
      })

      const tutoringService = await prisma.service.upsert({
        where: { id: 'service-7' },
        update: {},
        create: {
          id: 'service-7',
          title: 'Math Tutoring',
          description: 'Private math tutoring for high school students',
          categoryId: 'cat_education',
          subcategory: 'Tutoring',
          price: 100000,
          duration: 60,
          location: 'Bandung',
          status: 'ACTIVE',
          providerId: provider2.id,
        },
      })

      // Create more bookings
      const booking3 = await prisma.booking.upsert({
        where: { id: 'booking-3' },
        update: {},
        create: {
          id: 'booking-3',
          status: 'COMPLETED',
          scheduledAt: new Date('2024-01-15T09:00:00Z'),
          totalAmount: 250000,
          serviceId: 'service-6',
          customerId: seeker2.id,
          providerId: providerUser.id,
          notes: 'Need logo for new restaurant',
        },
      })

      const booking4 = await prisma.booking.upsert({
        where: { id: 'booking-4' },
        update: {},
        create: {
          id: 'booking-4',
          status: 'IN_PROGRESS',
          scheduledAt: new Date('2024-01-30T15:00:00Z'),
          totalAmount: 800000,
          serviceId: 'service-5',
          customerId: seeker3.id,
          providerId: provider2.id,
          notes: 'E-commerce mobile app',
        },
      })

      const booking5 = await prisma.booking.upsert({
        where: { id: 'booking-5' },
        update: {},
        create: {
          id: 'booking-5',
          status: 'PENDING',
          scheduledAt: new Date('2024-02-05T10:00:00Z'),
          totalAmount: 100000,
          serviceId: 'service-7',
          customerId: seeker2.id,
          providerId: provider2.id,
        },
      })

      // Create more payments
      await prisma.payment.upsert({
        where: { id: 'payment-3' },
        update: {},
        create: {
          id: 'payment-3',
          amount: 250000,
          status: 'COMPLETED',
          paymentMethod: 'Credit Card',
          transactionId: 'TXN-003',
          paidAt: new Date('2024-01-15T08:30:00Z'),
          bookingId: 'booking-3',
        },
      })

      await prisma.payment.upsert({
        where: { id: 'payment-4' },
        update: {},
        create: {
          id: 'payment-4',
          amount: 800000,
          status: 'COMPLETED',
          paymentMethod: 'Bank Transfer',
          transactionId: 'TXN-004',
          paidAt: new Date('2024-01-30T14:30:00Z'),
          bookingId: 'booking-4',
        },
      })

      await prisma.payment.upsert({
        where: { id: 'payment-5' },
        update: {},
        create: {
          id: 'payment-5',
          amount: 100000,
          status: 'PENDING',
          paymentMethod: 'QRIS',
          bookingId: 'booking-5',
        },
      })

      // Create more reviews
      await prisma.review.upsert({
        where: { id: 'review-2' },
        update: {},
        create: {
          id: 'review-2',
          rating: 4,
          comment: 'Good service, delivered on time',
          serviceId: 'service-6',
          reviewerId: seeker2.id,
          bookingId: 'booking-3',
        },
      })

      await prisma.review.upsert({
        where: { id: 'review-3' },
        update: {},
        create: {
          id: 'review-3',
          rating: 5,
          comment: 'Amazing work! Highly recommended',
          serviceId: 'service-5',
          reviewerId: seeker3.id,
          bookingId: 'booking-4',
        },
      })

      // Create support tickets
      await prisma.supportTicket.upsert({
        where: { id: 'ticket-1' },
        update: {},
        create: {
          id: 'ticket-1',
          title: 'Payment Issue',
          description: 'I was charged twice for the same service. Please help resolve this issue.',
          category: 'PAYMENT',
          priority: 'HIGH',
          status: 'OPEN',
          userId: seekerUser.id,
        },
      })

      await prisma.supportTicket.upsert({
        where: { id: 'ticket-2' },
        update: {},
        create: {
          id: 'ticket-2',
          title: 'Service Not Available',
          description: 'The service I booked is not available in my area. Need assistance.',
          category: 'SERVICE',
          priority: 'MEDIUM',
          status: 'IN_PROGRESS',
          userId: seeker2.id,
          assignedTo: adminUser.id,
        },
      })

      await prisma.supportTicket.upsert({
        where: { id: 'ticket-3' },
        update: {},
        create: {
          id: 'ticket-3',
          title: 'Account Verification',
          description: 'My provider account verification is taking too long. When will it be processed?',
          category: 'ACCOUNT',
          priority: 'MEDIUM',
          status: 'RESOLVED',
          userId: unverifiedProvider.id,
          assignedTo: adminUser.id,
          resolvedAt: new Date('2024-01-18T10:00:00Z'),
        },
      })

      await prisma.supportTicket.upsert({
        where: { id: 'ticket-4' },
        update: {},
        create: {
          id: 'ticket-4',
          title: 'Technical Problem',
          description: 'Cannot upload service images. Getting error message.',
          category: 'TECHNICAL',
          priority: 'LOW',
          status: 'CLOSED',
          userId: providerUser.id,
          assignedTo: adminUser.id,
          resolvedAt: new Date('2024-01-20T15:30:00Z'),
        },
      })

      await prisma.supportTicket.upsert({
        where: { id: 'ticket-5' },
        update: {},
        create: {
          id: 'ticket-5',
          title: 'Refund Request',
          description: 'I need to cancel my booking and get a refund. The service was not as described.',
          category: 'PAYMENT',
          priority: 'URGENT',
          status: 'OPEN',
          userId: seeker3.id,
        },
      })

      // Create more messages
      await prisma.message.upsert({
        where: { id: 'message-4' },
        update: {},
        create: {
          id: 'message-4',
          content: 'I need some changes to the logo design',
          senderId: seeker2.id,
          receiverId: providerUser.id,
          bookingId: 'booking-3',
        }
      })

      await prisma.message.upsert({
        where: { id: 'message-5' },
        update: {},
        create: {
          id: 'message-5',
          content: 'Sure! What specific changes would you like?',
          senderId: providerUser.id,
          receiverId: seeker2.id,
          bookingId: 'booking-3',
        }
      })

      await prisma.message.upsert({
        where: { id: 'message-6' },
        update: {},
        create: {
          id: 'message-6',
          content: 'How is the mobile app development progressing?',
          senderId: seeker3.id,
          receiverId: provider2.id,
          bookingId: 'booking-4',
        }
      })

      await prisma.message.upsert({
        where: { id: 'message-7' },
        update: {},
        create: {
          id: 'message-7',
          content: 'We are on track! The UI design is almost complete.',
          senderId: provider2.id,
          receiverId: seeker3.id,
          bookingId: 'booking-4',
        }
      })

      // Add more services to favorites
      await prisma.user.update({
        where: { id: seeker2.id },
        data: {
          favoriteServices: {
            connect: [{ id: 'service-6' }, { id: 'service-1' }]
          }
        }
      })

      await prisma.user.update({
        where: { id: seeker3.id },
        data: {
          favoriteServices: {
            connect: { id: 'service-5' }
          }
        }
      })

      console.log('Database seeded successfully with comprehensive data!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })