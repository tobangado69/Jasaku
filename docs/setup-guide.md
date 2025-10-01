# 🚀 Jasaku Setup Guide

## Quick Fix for Dashboard Error

The "Failed to fetch dashboard data" error occurs because the database isn't configured yet. Here's how to fix it:

### 1. Start the Development Server
```bash
npm run dev
```

### 2. Set Up Database (Choose One Option)

#### Option A: Use a Local PostgreSQL Database
1. Install PostgreSQL on your system
2. Create a database named `jasaku_db`
3. Create a `.env.local` file in your project root:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/jasaku_db?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-change-this"
```

4. Run database setup:
```bash
npm run db:push      # Push schema to database
npm run db:seed      # Add sample data
```

#### Option B: Use a Cloud Database (Recommended for Development)
Use services like:
- **Supabase** (Free PostgreSQL)
- **Neon** (Free PostgreSQL)
- **Railway** (PostgreSQL hosting)

1. Create a free account and database
2. Copy the connection string
3. Create `.env.local` with your database URL

### 3. Install Dependencies (if needed)
```bash
npm install
```

### 4. Configure Authentication (Optional)
For Google/Facebook login, add these to `.env.local`:
```env
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
FACEBOOK_CLIENT_ID="your-facebook-client-id"
FACEBOOK_CLIENT_SECRET="your-facebook-client-secret"
```

### 5. Configure Payments (Optional)
For payment processing, add Midtrans credentials:
```env
MIDTRANS_SERVER_KEY="your-midtrans-server-key"
MIDTRANS_CLIENT_KEY="your-midtrans-client-key"
```

## 🛠 Troubleshooting

### Database Connection Issues
- Check if PostgreSQL is running
- Verify DATABASE_URL format
- Ensure database exists and is accessible

### Authentication Issues
- NEXTAUTH_SECRET must be set
- Check OAuth provider configurations

### API Errors
- Make sure the development server is running (`npm run dev`)
- Check browser network tab for detailed error messages

## 🎯 Next Steps After Setup

1. **Database Setup Complete**: Dashboard will load real data
2. **Test All Features**: Try booking, payments, user management
3. **Configure Production**: Set up deployment environment
4. **Add Real Content**: Replace sample data with actual services

## 📞 Need Help?

If you encounter issues:
1. Check the browser console for detailed errors
2. Verify your `.env.local` configuration
3. Ensure all required services are running
4. Check the setup guide in README.md

---

**The application will work with mock data even without database setup, but real functionality requires proper configuration.**
