import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

/**
 * Seed script to add October 2025 data
 * This adds realistic data for the current month to populate analytics
 */

async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12)
}

async function main() {
  console.log('🌱 Adding October 2025 data...')

  // Get existing users
  const provider = await prisma.user.findUnique({ where: { email: 'provider@jasaku.com' } })
  const seeker = await prisma.user.findUnique({ where: { email: 'seeker@jasaku.com' } })
  const admin = await prisma.user.findUnique({ where: { email: 'admin@jasaku.com' } })

  if (!provider || !seeker) {
    console.error('❌ Demo users not found! Run main seed first: npm run db:seed')
    return
  }

  // Get existing services
  const services = await prisma.service.findMany({
    where: { providerId: provider.id },
    take: 3,
  })

  if (services.length === 0) {
    console.error('❌ No services found! Run main seed first: npm run db:seed')
    return
  }

  // Create October 2025 users (5 new users distributed across the month)
  const octoberUsers = []
  for (let i = 1; i <= 5; i++) {
    const dayOfMonth = Math.floor((i / 5) * 30) + 1 // Distribute across month
    const user = await prisma.user.upsert({
      where: { email: `october-user-${i}@example.com` },
      update: {},
      create: {
        name: `October User ${i}`,
        email: `october-user-${i}@example.com`,
        role: i % 2 === 0 ? 'PROVIDER' : 'SEEKER',
        status: 'ACTIVE',
        password: await hashPassword('password'),
        phone: `+628123456${7900 + i}`,
        location: ['Jakarta', 'Bandung', 'Surabaya', 'Medan'][i % 4],
        createdAt: new Date(2025, 9, dayOfMonth, 10, 0, 0), // October = month 9 (0-indexed)
      },
    })
    octoberUsers.push(user)
    console.log(`  ✓ Created user: ${user.name} on Oct ${dayOfMonth}, 2025`)
  }

  // Create October 2025 bookings (10 bookings distributed across the month)
  const octoberBookings = []
  for (let i = 1; i <= 10; i++) {
    const dayOfMonth = Math.floor((i / 10) * 30) + 1
    const service = services[i % services.length]
    const status = i <= 6 ? 'COMPLETED' : i <= 8 ? 'CONFIRMED' : 'PENDING'
    
    const booking = await prisma.booking.create({
      data: {
        status,
        scheduledAt: new Date(2025, 9, dayOfMonth, 14, 0, 0),
        totalAmount: service.price,
        serviceId: service.id,
        customerId: seeker.id,
        providerId: provider.id,
        notes: `October booking #${i}`,
        createdAt: new Date(2025, 9, dayOfMonth - 1, 10, 0, 0),
        updatedAt: new Date(2025, 9, dayOfMonth - 1, 10, 0, 0),
      },
    })
    octoberBookings.push(booking)
    console.log(`  ✓ Created booking: ${booking.id} on Oct ${dayOfMonth}, 2025 - ${status}`)

    // Create payments for completed bookings
    if (status === 'COMPLETED') {
      await prisma.payment.create({
        data: {
          amount: booking.totalAmount,
          status: 'COMPLETED',
          paymentMethod: ['QRIS', 'GoPay', 'Bank Transfer'][i % 3],
          transactionId: `OCT-TXN-${i}`,
          bookingId: booking.id,
          paidAt: new Date(2025, 9, dayOfMonth, 13, 30, 0),
          createdAt: new Date(2025, 9, dayOfMonth - 1, 10, 0, 0),
        },
      })
      console.log(`    ✓ Payment completed: OCT-TXN-${i}`)
    }
  }

  // Create October 2025 reviews (for completed bookings)
  let reviewCount = 0
  for (let i = 0; i < octoberBookings.length; i++) {
    if (octoberBookings[i].status === 'COMPLETED' && i % 2 === 0) {
      const dayOfMonth = Math.floor((i / 10) * 30) + 2
      await prisma.review.create({
        data: {
          rating: 4 + Math.floor(Math.random() * 2), // 4 or 5 stars
          comment: `Great service in October! Booking #${i + 1}`,
          serviceId: octoberBookings[i].serviceId,
          reviewerId: seeker.id,
          bookingId: octoberBookings[i].id,
          createdAt: new Date(2025, 9, dayOfMonth, 16, 0, 0),
        },
      })
      reviewCount++
      console.log(`  ✓ Created review for booking ${i + 1}`)
    }
  }

  // Create October 2025 support tickets (2 tickets)
  for (let i = 1; i <= 2; i++) {
    const dayOfMonth = i * 10
    await prisma.supportTicket.create({
      data: {
        subject: `October Support Issue #${i}`,
        description: `Support ticket created in October 2025`,
        status: i === 1 ? 'OPEN' : 'IN_PROGRESS',
        priority: 'MEDIUM',
        userId: seeker.id,
        assignedToId: admin?.id,
        createdAt: new Date(2025, 9, dayOfMonth, 9, 0, 0),
        updatedAt: new Date(2025, 9, dayOfMonth, 9, 0, 0),
      },
    })
    console.log(`  ✓ Created support ticket on Oct ${dayOfMonth}, 2025`)
  }

  // Summary
  console.log('\n✅ October 2025 data seeded successfully!')
  console.log(`\n📊 Summary:`)
  console.log(`  • New users: 5`)
  console.log(`  • New bookings: 10 (6 completed, 2 confirmed, 2 pending)`)
  console.log(`  • Payments: 6 completed`)
  console.log(`  • Reviews: ${reviewCount}`)
  console.log(`  • Support tickets: 2`)
  console.log(`\n🎯 Analytics should now show October 2025 data!`)
  console.log(`   Visit: http://localhost:3001/admin to see updated metrics\n`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding October data:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

