# Docker Setup Guide for Jasaku

This guide will help you containerize and deploy your Jasaku Next.js application using Docker.

## Prerequisites

- Docker installed on your system
- Docker Compose (usually comes with Docker Desktop)
- Basic knowledge of Docker concepts

## Files Overview

- `Dockerfile` - Production-ready container configuration
- `Dockerfile.dev` - Development container configuration
- `docker-compose.yml` - Multi-container setup with PostgreSQL
- `.dockerignore` - Files to exclude from Docker build
- `env.example` - Environment variables template

## Quick Start

### 1. Environment Setup

Copy the environment template:
```bash
cp env.example .env
```

Edit `.env` and configure your environment variables:
```env
DATABASE_URL="postgresql://postgres:postgres@database:5432/jasaku"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

### 2. Development with Docker Compose

Start the development environment:
```bash
npm run docker:compose:dev
```

This will start:
- PostgreSQL database on port 5432
- Next.js development server on port 3001

### 3. Production with Docker Compose

Build and start the production environment:
```bash
npm run docker:compose:build
npm run docker:compose:up
```

This will start:
- PostgreSQL database
- Next.js production server on port 3000

## Available Commands

### Docker Commands
```bash
# Build production image
npm run docker:build

# Build development image
npm run docker:build:dev

# Run production container
npm run docker:run

# Run development container
npm run docker:run:dev
```

### Docker Compose Commands
```bash
# Start all services in background
npm run docker:compose:up

# Stop all services
npm run docker:compose:down

# Build all images
npm run docker:compose:build

# View logs
npm run docker:compose:logs

# Development mode
npm run docker:compose:dev
```

## Database Setup

### Initial Setup
After starting the containers, run database migrations:
```bash
# Connect to the app container
docker exec -it jasaku-app bash

# Run migrations
npx prisma migrate deploy

# Seed the database
npx prisma db seed
```

### Access Database
```bash
# Using psql
docker exec -it jasaku-postgres psql -U postgres -d jasaku

# Using Prisma Studio
docker exec -it jasaku-app npx prisma studio
```

## Production Deployment

### 1. Environment Variables
Ensure all production environment variables are set:
```env
NODE_ENV=production
DATABASE_URL="postgresql://postgres:postgres@database:5432/jasaku"
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="your-secure-secret"
```

### 2. Build and Deploy
```bash
# Build production image
docker build -t jasaku-app .

# Run with environment file
docker run -d \
  --name jasaku-app \
  --env-file .env \
  -p 3000:3000 \
  jasaku-app
```

### 3. Using Docker Compose (Recommended)
```bash
# Production deployment
docker-compose up -d
```

## Monitoring and Logs

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f database
```

### Container Status
```bash
# List running containers
docker ps

# Container resource usage
docker stats
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Change ports in docker-compose.yml
   ports:
     - "3001:3000"  # Use port 3001 instead
   ```

2. **Database Connection Issues**
   ```bash
   # Check database is running
   docker-compose ps database
   
   # Check database logs
   docker-compose logs database
   ```

3. **Build Failures**
   ```bash
   # Clean build cache
   docker system prune -a
   
   # Rebuild without cache
   docker-compose build --no-cache
   ```

4. **Permission Issues**
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   ```

### Database Issues

1. **Reset Database**
   ```bash
   # Stop containers
   docker-compose down
   
   # Remove database volume
   docker volume rm jasaku_postgres_data
   
   # Start fresh
   docker-compose up -d
   ```

2. **Backup Database**
   ```bash
   # Create backup
   docker exec jasaku-postgres pg_dump -U postgres jasaku > backup.sql
   
   # Restore backup
   docker exec -i jasaku-postgres psql -U postgres jasaku < backup.sql
   ```

## Security Considerations

1. **Environment Variables**
   - Never commit `.env` files to version control
   - Use strong secrets for production
   - Rotate secrets regularly

2. **Database Security**
   - Use strong passwords
   - Limit database access
   - Enable SSL in production

3. **Container Security**
   - Keep base images updated
   - Use non-root users (already configured)
   - Scan images for vulnerabilities

## Performance Optimization

1. **Multi-stage Build**
   - Already implemented in Dockerfile
   - Reduces final image size

2. **Layer Caching**
   - Dependencies installed before code copy
   - Optimizes rebuild times

3. **Resource Limits**
   ```yaml
   # Add to docker-compose.yml
   services:
     app:
       deploy:
         resources:
           limits:
             memory: 512M
             cpus: '0.5'
   ```

## Next Steps

1. Set up CI/CD pipeline
2. Configure monitoring and logging
3. Implement health checks
4. Set up automated backups
5. Configure SSL/TLS certificates

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review Docker and Next.js documentation
3. Check application logs
4. Verify environment configuration
