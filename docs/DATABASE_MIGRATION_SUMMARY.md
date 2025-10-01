# Database Migration: SQLite to PostgreSQL

## ✅ Migration Completed Successfully

Your Jasaku application has been successfully migrated from SQLite to PostgreSQL.

## Changes Made

### 1. **Docker Configuration**
- Updated `Dockerfile` to use Node.js 20 (required for better-sqlite3 compatibility)
- Updated `Dockerfile.dev` to use Node.js 20
- Removed obsolete `version` field from docker-compose files

### 2. **Database Configuration**
- Updated `prisma/schema.prisma`:
  ```prisma
  datasource db {
    provider = "postgresql"  // Changed from "sqlite"
    url      = env("DATABASE_URL")
  }
  ```

### 3. **Environment Variables**
- Updated `.env` file:
  ```env
  DATABASE_URL="postgresql://postgres:postgres@localhost:5432/jasaku"
  ```
- Created backup: `.env.backup`

### 4. **Database Migration**
- Removed old SQLite migrations: `prisma/migrations/`
- Created new PostgreSQL migration: `20250927125653_init_postgresql`
- Applied migration successfully
- Seeded database with initial data

### 5. **Next.js Configuration**
- Fixed `next.config.mjs`:
  ```javascript
  serverExternalPackages: ["@prisma/client"]  // Updated from experimental
  ```

## Current Status

### ✅ **Working Components:**
- PostgreSQL database running on port 5432
- Next.js application running on port 3000
- Health check endpoint: `http://localhost:3000/api/health`
- Database connection verified
- All migrations applied
- Database seeded with initial data

### **Application URLs:**
- **Main Application**: http://localhost:3000
- **Health Check**: http://localhost:3000/api/health
- **Database**: localhost:5432

## Docker Commands

### Development
```bash
# Start development environment
make dev

# View logs
make dev-logs

# Stop development
make dev-stop

# Clean environment
make dev-clean
```

### Database Operations
```bash
# Run migrations
make db-migrate

# Seed database
make db-seed

# Backup database
make db-backup

# Access database shell
make db-shell
```

### Health & Monitoring
```bash
# Check application health
make health

# View container status
make status

# View logs
make logs
```

## Database Schema

The PostgreSQL database now contains all your application tables:
- Users (with roles: SEEKER, PROVIDER, ADMIN)
- Categories (with custom category support)
- Services (with provider relationships)
- Bookings (with status tracking)
- Reviews (with rating system)
- Messages (for communication)
- Support Tickets (for customer support)
- Payments (with Midtrans integration)
- Favorites (user favorite services)

## Production Deployment

For production deployment, use the existing Docker setup:

```bash
# Production setup
make prod-setup

# Deploy to production
make prod-deploy

# VPS deployment
./scripts/deploy-vps.sh
```

## Backup & Recovery

### Backup Database
```bash
# Manual backup
make db-backup

# Or using Docker directly
docker-compose -f docker-compose.dev.yml exec database pg_dump -U postgres jasaku > backup.sql
```

### Restore Database
```bash
# Restore from backup
make db-restore

# Or using Docker directly
docker-compose -f docker-compose.dev.yml exec -T database psql -U postgres jasaku < backup.sql
```

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   ```bash
   # Check database status
   docker-compose -f docker-compose.dev.yml ps database
   
   # Check database logs
   docker-compose -f docker-compose.dev.yml logs database
   ```

2. **Application Issues**
   ```bash
   # Check application logs
   docker-compose -f docker-compose.dev.yml logs app
   
   # Restart application
   docker-compose -f docker-compose.dev.yml restart app
   ```

3. **Migration Issues**
   ```bash
   # Reset database
   docker-compose -f docker-compose.dev.yml down -v
   docker-compose -f docker-compose.dev.yml up -d
   make db-migrate
   make db-seed
   ```

## Next Steps

1. **Test all functionality** in the development environment
2. **Update any hardcoded SQLite references** in your code
3. **Test production deployment** when ready
4. **Set up monitoring** for the PostgreSQL database
5. **Configure automated backups** for production

## Files Modified

- `Dockerfile` - Updated to Node.js 20
- `Dockerfile.dev` - Updated to Node.js 20
- `prisma/schema.prisma` - Changed provider to PostgreSQL
- `.env` - Updated database URL
- `next.config.mjs` - Fixed configuration
- `docker-compose.dev.yml` - Removed version field
- `docker-compose.prod.yml` - Removed version field
- `docker-compose.yml` - Removed version field

## Files Created

- `prisma/migrations/20250927125653_init_postgresql/` - PostgreSQL migration
- `.env.backup` - Backup of original environment
- `DATABASE_MIGRATION_SUMMARY.md` - This summary

## Migration Complete! 🎉

Your application is now running on PostgreSQL with all the benefits of a robust, scalable database system.
