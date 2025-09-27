# Jasaku - Service Marketplace Platform

A modern service marketplace platform connecting service providers with customers across Indonesia. Built with Next.js, TypeScript, and Prisma.

## 🚀 Features

### For Service Seekers
- **Service Discovery**: Browse and search for services by category, location, and price
- **Booking Management**: Easy booking system with real-time status updates
- **Secure Payments**: Multiple payment options including QRIS, GoPay, and bank transfer
- **Review System**: Rate and review completed services
- **Favorites**: Save preferred service providers

### For Service Providers
- **Service Management**: Create and manage service offerings
- **Booking Dashboard**: Manage incoming bookings and schedules
- **Earnings Tracking**: Monitor revenue and payment history
- **Profile Management**: Build professional profiles with portfolios

### For Administrators
- **User Management**: Comprehensive user verification and management
- **Platform Analytics**: Revenue tracking and performance metrics
- **Dispute Resolution**: Handle customer-provider disputes
- **Content Management**: Manage service categories and platform content

## 🛠 Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js with Google/Facebook OAuth
- **Payments**: Midtrans (Indonesian payment gateway)
- **File Storage**: AWS S3 (configurable)
- **Deployment**: Vercel (recommended)

## 🏗 Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │    │   API Routes    │    │   PostgreSQL    │
│                 │    │                 │    │                 │
│ - Dashboard     │◄──►│ - Auth          │◄──►│ - Users         │
│ - Service Pages │    │ - Services      │    │ - Services      │
│ - Booking Flow  │    │ - Bookings      │    │ - Bookings      │
│ - Search        │    │ - Payments      │    │ - Payments      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Midtrans account (for payments)
- Google/Facebook OAuth apps (optional)

## 🚀 Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd jasaku
npm install
```

### Demo Credentials

For testing purposes, you can use these demo accounts:

| Role | Email | Password | Access |
|------|-------|----------|--------|
| **Provider** | `provider@jasaku.com` | `password` | Service provider dashboard |
| **Seeker** | `seeker@jasaku.com` | `password` | Service seeker dashboard |
| **Admin** | `admin@jasaku.com` | `password` | Admin management panel |

> **Note**: These are demo credentials for development/testing only. In production, implement proper user registration and authentication.

### 3. Environment Setup

Copy `.env.example` to `.env.local` and configure:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/jasaku_db"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# OAuth (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Payments (Midtrans)
MIDTRANS_SERVER_KEY="your-midtrans-server-key"
MIDTRANS_CLIENT_KEY="your-midtrans-client-key"
```

### 4. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed with sample data
npm run db:seed
```

### 5. Development

```bash
# Start development server
npm run dev

# Open http://localhost:3000
```

### 6. Database Management

```bash
# Open Prisma Studio (database GUI)
npm run db:studio

# Create new migration
npm run db:migrate
```

## 📊 API Endpoints

### Authentication
- `GET/POST /api/auth/[...nextauth]` - NextAuth.js endpoints

### Users
- `GET /api/users` - List users
- `POST /api/users` - Create user

### Services
- `GET /api/services` - List services with filtering
- `POST /api/services` - Create service (providers only)

### Bookings
- `GET /api/bookings` - List user's bookings
- `POST /api/bookings` - Create booking (seekers only)

### Payments
- `GET /api/payments` - List payments
- `POST /api/payments` - Create payment
- `PUT /api/payments` - Webhook for payment updates

### Search
- `GET /api/search` - Search services with filters

### Dashboard
- `GET /api/dashboard?type=provider|seeker|admin` - Dashboard data

## 🎨 UI Components

Built with shadcn/ui components:
- Cards, Buttons, Badges
- Forms, Inputs, Selects
- Dialogs, Modals, Sheets
- Tables, Tabs, Accordions

## 🔐 Authentication Flow

1. **Registration**: Email + OAuth support
2. **Role Selection**: Provider/Seeker/Admin
3. **Verification**: Document upload for providers
4. **Session Management**: JWT tokens with NextAuth.js

## 💳 Payment Integration

### Supported Methods
- **QRIS** (Universal QR payments)
- **GoPay** (GoJek wallet)
- **Bank Transfer** (Virtual accounts)
- **Credit Cards** (Visa, Mastercard)

### Payment Flow
1. Service selection and booking
2. Payment method selection
3. Midtrans payment processing
4. Webhook status updates
5. Escrow release on completion

## 🗄 Database Schema

### Core Models
- **User**: Customers, providers, admins
- **Service**: Service offerings with pricing
- **Booking**: Service requests and confirmations
- **Payment**: Payment transactions and status
- **Review**: Service ratings and feedback
- **Message**: Communication between users

### Key Relationships
- Users ↔ Services (Provider creates services)
- Users ↔ Bookings (Customer/Provider booking relationship)
- Services ↔ Bookings (Service booking requests)
- Bookings ↔ Payments (Payment for booking)
- Services ↔ Reviews (Service feedback)

## 🚀 Deployment

### Vercel (Recommended)

1. Connect repository to Vercel
2. Set environment variables
3. Configure database connection
4. Deploy with `npm run build`

### Manual Deployment

1. Build application: `npm run build`
2. Start production server: `npm start`
3. Configure reverse proxy (nginx recommended)

## 📱 Mobile Responsiveness

- **Responsive Design**: Mobile-first approach
- **Touch-Friendly**: Optimized for mobile interactions
- **Progressive Enhancement**: Works on all devices

## 🔍 SEO & Performance

- **Server-Side Rendering**: Fast initial page loads
- **Image Optimization**: Next.js Image component
- **Code Splitting**: Automatic route-based splitting
- **Caching**: Database query optimization

## 🛡 Security Features

- **Input Validation**: Zod schema validation
- **SQL Injection Protection**: Prisma ORM
- **XSS Protection**: React's built-in protection
- **CSRF Protection**: NextAuth.js security
- **Rate Limiting**: API endpoint protection

## 📞 Support

For technical support or feature requests:
- Create an issue in the repository
- Contact the development team

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Built with ❤️ for Indonesia's service marketplace**