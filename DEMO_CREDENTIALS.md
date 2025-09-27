# Jasaku Demo Credentials

## Demo User Accounts

The following demo user accounts are available for testing the Jasaku service marketplace:

### Admin User
- **Email:** `admin@jasaku.com`
- **Password:** `password`
- **Role:** Admin
- **Access:** All admin features including user management, service approval, payment monitoring, and platform analytics

### Provider User  
- **Email:** `provider@jasaku.com`
- **Password:** `password`
- **Role:** Provider
- **Access:** Provider dashboard, manage services, view bookings and earnings, customer messaging, and analytics

### Seeker User
- **Email:** `seeker@jasaku.com`
- **Password:** `password`
- **Role:** Seeker  
- **Access:** Search and book services, manage bookings, favorites, and customer features

## Sample Data

The database is pre-seeded with:

### Services
- **House Cleaning** - Active service by verified provider
- **Web Development** - Pending approval service (for testing admin verification)
- **Plumbing Repair** - Rejected service (for testing admin workflow)
- **Computer & Laptop Repair** - Pending approval service by unverified provider

### Bookings
- Confirmed house cleaning booking
- Pending web development booking

### Payments
- Completed payment for house cleaning
- Pending payment for web development

### Reviews
- 5-star review for house cleaning service

## Features to Test

### Admin Dashboard (`/admin`)
1. **User Management**: View, edit, verify, suspend users
2. **Service Management**: Verify/approve pending services, manage all services
3. **Payment Monitoring**: View all transactions, process refunds
4. **Platform Analytics**: View comprehensive platform metrics
5. **Support Management**: Handle customer support tickets

### Provider Dashboard (`/provider`)
1. **Service Management**: Create, edit, delete services
2. **Booking Management**: Accept/decline bookings, mark as complete
3. **Earnings Tracking**: View payment history and earnings
4. **Customer Messaging**: Communicate with customers
5. **Performance Analytics**: View booking and earnings analytics

### Seeker Dashboard (`/seeker`)
1. **Service Discovery**: Search and filter services
2. **Booking Management**: Book services, view booking history
3. **Favorites**: Save preferred providers and services

## Data Persistence

All changes made through the interface are now persisted to the SQLite database and will remain after page refresh. This includes:

- User verification status changes
- Service approval/rejection status
- Booking status updates
- New service creation
- User profile updates

## Authentication

The system now uses database authentication instead of hardcoded credentials. Users are authenticated against the SQLite database with the credentials listed above.

## Development Notes

- Database: SQLite (`prisma/dev.db`)
- ORM: Prisma
- Authentication: NextAuth.js with credentials provider
- Frontend: Next.js 15 with React components
- Styling: Tailwind CSS with Shadcn/ui components

## API Endpoints

All CRUD operations are available through RESTful API endpoints:

- `/api/users` - User management
- `/api/services` - Service management
- `/api/bookings` - Booking management
- `/api/payments` - Payment processing
- `/api/dashboard` - Dashboard data
- `/api/search` - Service search
- `/api/messages` - Messaging system

Each endpoint supports appropriate HTTP methods (GET, POST, PATCH, DELETE) with proper authentication and authorization checks.

## 📋 **Service Verification Testing**

### **How to Test Service Approval**
1. **Login as admin** (`admin@jasaku.com` / `password`)
2. **Navigate to Service Management** (`/admin/services`)
3. **Find services with "PENDING_APPROVAL" status**:
   - Web Development (by verified provider)
   - Computer & Laptop Repair (by unverified provider)
4. **Click "Approve" button** → service status changes to "ACTIVE"
5. **Click "Reject" button** → service status changes to "REJECTED"
6. **Refresh the page** → service status remains as set
7. **Changes persist in database** → no data loss on refresh

### **Approval Process**
- Services in "PENDING_APPROVAL" show "Approve" and "Reject" buttons
- Clicking "Approve" calls `/api/services/[id]` PATCH endpoint
- Updates service status from "PENDING_APPROVAL" to "ACTIVE"
- Clicking "Reject" updates status to "REJECTED"
- Refetches data to sync UI with database
- Shows success message to admin
