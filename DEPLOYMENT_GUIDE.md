# Jasaku Deployment Guide

This guide will help you deploy your Jasaku application to a VPS with Docker, Nginx, and SSL certificates.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [VPS Setup](#vps-setup)
3. [Domain Configuration](#domain-configuration)
4. [Local Development](#local-development)
5. [Production Deployment](#production-deployment)
6. [SSL Setup](#ssl-setup)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### VPS Requirements
- **OS**: Ubuntu 20.04+ or similar Linux distribution
- **RAM**: Minimum 2GB (4GB recommended)
- **Storage**: Minimum 20GB SSD
- **CPU**: 1-2 cores minimum
- **Network**: Public IP address

### Domain Requirements
- A registered domain name
- DNS access to configure A/AAAA records
- Email address for Let's Encrypt certificates

### Local Requirements
- Git installed
- SSH access to your VPS
- Basic knowledge of Linux commands

## VPS Setup

### 1. Initial Server Setup

Connect to your VPS:
```bash
ssh root@your-vps-ip
```

Create a non-root user:
```bash
adduser jasaku
usermod -aG sudo jasaku
su - jasaku
```

### 2. Install Docker and Dependencies

Run the automated setup script:
```bash
make vps-setup
```

Or manually install:
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again
exit
ssh jasaku@your-vps-ip
```

### 3. Clone Your Repository

```bash
git clone https://github.com/yourusername/jasaku.git
cd jasaku
```

## Domain Configuration

### 1. Configure DNS Records

Point your domain to your VPS IP address:

**A Record**: `your-domain.com` → `your-vps-ip`
**CNAME**: `www.your-domain.com` → `your-domain.com`

### 2. Verify DNS Propagation

```bash
nslookup your-domain.com
dig your-domain.com
```

## Local Development

### Quick Start

```bash
# Setup development environment
make dev-setup

# Start development server
make dev

# View logs
make dev-logs

# Stop development
make dev-stop
```

### Development Commands

```bash
# Build development image
make docker:build:dev

# Run development container
make docker:run:dev

# Clean development environment
make dev-clean

# Database operations
make db-migrate
make db-seed
make db-backup
```

## Production Deployment

### 1. Interactive Production Setup

```bash
# Run interactive setup
make prod-setup
```

This will prompt you for:
- Domain name
- Email for Let's Encrypt
- Database password
- NextAuth secret

### 2. Automated VPS Deployment

```bash
# Run the VPS deployment script
./scripts/deploy-vps.sh
```

This script will:
- Install Docker and Docker Compose
- Create production environment file
- Update Nginx configuration
- Build and start all services
- Run database migrations
- Setup SSL certificates
- Configure automatic backups
- Setup log rotation

### 3. Manual Production Deployment

```bash
# Build production images
make prod-build

# Deploy to production
make prod-deploy

# Setup SSL certificate
make ssl-setup

# Check health
make prod-health
```

## SSL Setup

### Automatic SSL (Recommended)

The deployment script automatically sets up SSL certificates using Let's Encrypt.

### Manual SSL Setup

```bash
# Get SSL certificate
docker-compose -f docker-compose.prod.yml --env-file .env.prod exec nginx certbot certonly --webroot -w /var/www/certbot -d your-domain.com --email your-email@example.com --agree-tos --no-eff-email

# Reload Nginx
docker-compose -f docker-compose.prod.yml --env-file .env.prod restart nginx
```

### SSL Renewal

SSL certificates are automatically renewed via cron job. Manual renewal:

```bash
make ssl-renew
```

## Monitoring & Maintenance

### Health Checks

```bash
# Check application health
make health

# Check production health
make prod-health

# View container status
make status
```

### Logs

```bash
# View all logs
make logs

# View production logs
make prod-logs

# View specific service logs
docker-compose -f docker-compose.prod.yml --env-file .env.prod logs -f app
docker-compose -f docker-compose.prod.yml --env-file .env.prod logs -f nginx
docker-compose -f docker-compose.prod.yml --env-file .env.prod logs -f database
```

### Database Management

```bash
# Backup database
make db-backup

# Restore database
make db-restore

# Access database shell
make db-shell

# Run migrations
make db-migrate

# Seed database
make db-seed
```

### Updates

```bash
# Update production deployment
make prod-update

# Pull latest images
docker-compose -f docker-compose.prod.yml --env-file .env.prod pull

# Rebuild and restart
docker-compose -f docker-compose.prod.yml --env-file .env.prod build
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

### Cleanup

```bash
# Clean Docker resources
make clean

# Clean development environment
make dev-clean

# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune
```

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

```bash
# Check what's using the port
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443

# Kill the process
sudo kill -9 <PID>

# Or change ports in docker-compose.prod.yml
```

#### 2. SSL Certificate Issues

```bash
# Check certificate status
docker-compose -f docker-compose.prod.yml --env-file .env.prod exec nginx certbot certificates

# Force certificate renewal
docker-compose -f docker-compose.prod.yml --env-file .env.prod exec nginx certbot renew --force-renewal

# Check Nginx configuration
docker-compose -f docker-compose.prod.yml --env-file .env.prod exec nginx nginx -t
```

#### 3. Database Connection Issues

```bash
# Check database status
docker-compose -f docker-compose.prod.yml --env-file .env.prod ps database

# Check database logs
docker-compose -f docker-compose.prod.yml --env-file .env.prod logs database

# Test database connection
docker-compose -f docker-compose.prod.yml --env-file .env.prod exec database pg_isready -U postgres
```

#### 4. Application Not Starting

```bash
# Check application logs
docker-compose -f docker-compose.prod.yml --env-file .env.prod logs app

# Check application health
curl -f http://localhost:3000/api/health

# Restart application
docker-compose -f docker-compose.prod.yml --env-file .env.prod restart app
```

#### 5. Nginx Issues

```bash
# Check Nginx configuration
docker-compose -f docker-compose.prod.yml --env-file .env.prod exec nginx nginx -t

# Reload Nginx configuration
docker-compose -f docker-compose.prod.yml --env-file .env.prod exec nginx nginx -s reload

# Check Nginx logs
docker-compose -f docker-compose.prod.yml --env-file .env.prod logs nginx
```

### Performance Issues

#### 1. High Memory Usage

```bash
# Check memory usage
docker stats

# Limit container resources in docker-compose.prod.yml
services:
  app:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
```

#### 2. Slow Database Queries

```bash
# Check database performance
docker-compose -f docker-compose.prod.yml --env-file .env.prod exec database psql -U postgres jasaku -c "SELECT * FROM pg_stat_activity;"

# Optimize database
docker-compose -f docker-compose.prod.yml --env-file .env.prod exec database psql -U postgres jasaku -c "VACUUM ANALYZE;"
```

### Security Issues

#### 1. Firewall Configuration

```bash
# Install UFW
sudo apt install ufw

# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

#### 2. Regular Security Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker-compose -f docker-compose.prod.yml --env-file .env.prod pull

# Scan for vulnerabilities
docker scout cves jasaku-app
```

## Backup and Recovery

### Automated Backups

Backups are automatically created daily at 2 AM. Manual backup:

```bash
./scripts/backup.sh
```

### Recovery Process

```bash
# Stop services
docker-compose -f docker-compose.prod.yml --env-file .env.prod down

# Restore database
docker-compose -f docker-compose.prod.yml --env-file .env.prod exec -T database psql -U postgres jasaku < backups/your-backup-file.sql

# Start services
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

## Monitoring Setup

### Basic Monitoring

```bash
# Install monitoring tools
sudo apt install htop iotop nethogs

# Monitor system resources
htop

# Monitor network usage
nethogs

# Monitor disk I/O
sudo iotop
```

### Advanced Monitoring (Optional)

Consider setting up:
- Prometheus + Grafana for metrics
- ELK Stack for log aggregation
- Uptime monitoring (UptimeRobot, Pingdom)

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review application and container logs
3. Verify environment configuration
4. Check system resources and network connectivity

## Useful Commands Reference

```bash
# Development
make dev-setup          # Setup development environment
make dev                # Start development
make dev-logs           # View development logs
make dev-stop           # Stop development

# Production
make prod-setup         # Interactive production setup
make prod-deploy        # Deploy to production
make prod-logs          # View production logs
make prod-update        # Update production

# Database
make db-migrate         # Run migrations
make db-seed            # Seed database
make db-backup          # Backup database
make db-restore         # Restore database

# SSL
make ssl-setup          # Setup SSL certificate
make ssl-renew          # Renew SSL certificate

# Monitoring
make status             # Container status
make health             # Health check
make logs               # View logs

# Maintenance
make clean              # Clean Docker resources
make restart            # Restart services
```
