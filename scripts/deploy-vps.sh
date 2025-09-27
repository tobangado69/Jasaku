#!/bin/bash

# Jasaku VPS Deployment Script
# This script helps deploy your application to a VPS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="jasaku"
DOMAIN=""
EMAIL=""
DB_PASSWORD=""
NEXTAUTH_SECRET=""

echo -e "${BLUE}Jasaku VPS Deployment Script${NC}"
echo -e "${YELLOW}This script will help you deploy your application to a VPS${NC}"
echo ""

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo -e "${RED}This script should not be run as root${NC}"
   exit 1
fi

# Function to generate random password
generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-25
}

# Function to generate NextAuth secret
generate_nextauth_secret() {
    openssl rand -base64 32
}

# Collect configuration
echo -e "${BLUE}Please provide the following information:${NC}"
read -p "Enter your domain name (e.g., jasaku.com): " DOMAIN
read -p "Enter your email for Let's Encrypt: " EMAIL
read -p "Enter database password (or press Enter to generate): " DB_PASSWORD

# Generate password if not provided
if [ -z "$DB_PASSWORD" ]; then
    DB_PASSWORD=$(generate_password)
    echo -e "${GREEN}Generated database password: $DB_PASSWORD${NC}"
fi

# Generate NextAuth secret
NEXTAUTH_SECRET=$(generate_nextauth_secret)
echo -e "${GREEN}Generated NextAuth secret${NC}"

# Create production environment file
echo -e "${BLUE}Creating production environment file...${NC}"
cat > .env.prod << EOF
DOMAIN=$DOMAIN
EMAIL=$EMAIL
DATABASE_PASSWORD=$DB_PASSWORD
DATABASE_URL=postgresql://postgres:$DB_PASSWORD@database:5432/jasaku
NEXTAUTH_URL=https://$DOMAIN
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
NODE_ENV=production
EOF

echo -e "${GREEN}✓ Production environment file created${NC}"

# Update Nginx configuration with domain
echo -e "${BLUE}Updating Nginx configuration...${NC}"
cp nginx/nginx-template.conf nginx/nginx.conf
sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" nginx/nginx.conf
echo -e "${GREEN}✓ Nginx configuration updated${NC}"

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo -e "${BLUE}Installing Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    echo -e "${GREEN}✓ Docker installed${NC}"
    echo -e "${YELLOW}Please logout and login again to use Docker without sudo${NC}"
fi

# Install Docker Compose if not present
if ! command -v docker-compose &> /dev/null; then
    echo -e "${BLUE}Installing Docker Compose...${NC}"
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✓ Docker Compose installed${NC}"
fi

# Create necessary directories
echo -e "${BLUE}Creating necessary directories...${NC}"
mkdir -p backups
mkdir -p logs
echo -e "${GREEN}✓ Directories created${NC}"

# Pull and build images
echo -e "${BLUE}Pulling and building images...${NC}"
docker-compose -f docker-compose.prod.yml --env-file .env.prod pull
docker-compose -f docker-compose.prod.yml --env-file .env.prod build
echo -e "${GREEN}✓ Images pulled and built${NC}"

# Start services
echo -e "${BLUE}Starting services...${NC}"
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
echo -e "${GREEN}✓ Services started${NC}"

# Wait for services to be ready
echo -e "${BLUE}Waiting for services to be ready...${NC}"
sleep 30

# Run database migrations
echo -e "${BLUE}Running database migrations...${NC}"
docker-compose -f docker-compose.prod.yml --env-file .env.prod exec app npx prisma migrate deploy
echo -e "${GREEN}✓ Database migrations completed${NC}"

# Seed database
echo -e "${BLUE}Seeding database...${NC}"
docker-compose -f docker-compose.prod.yml --env-file .env.prod exec app npx prisma db seed
echo -e "${GREEN}✓ Database seeded${NC}"

# Setup SSL certificate
echo -e "${BLUE}Setting up SSL certificate...${NC}"
docker-compose -f docker-compose.prod.yml --env-file .env.prod exec nginx certbot certonly --webroot -w /var/www/certbot -d $DOMAIN --email $EMAIL --agree-tos --no-eff-email --force-renewal
echo -e "${GREEN}✓ SSL certificate obtained${NC}"

# Reload Nginx with SSL configuration
echo -e "${BLUE}Reloading Nginx with SSL configuration...${NC}"
docker-compose -f docker-compose.prod.yml --env-file .env.prod restart nginx
echo -e "${GREEN}✓ Nginx reloaded${NC}"

# Setup automatic SSL renewal
echo -e "${BLUE}Setting up automatic SSL renewal...${NC}"
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/local/bin/docker-compose -f $(pwd)/docker-compose.prod.yml --env-file $(pwd)/.env.prod exec nginx certbot renew --quiet && /usr/local/bin/docker-compose -f $(pwd)/docker-compose.prod.yml restart nginx") | crontab -
echo -e "${GREEN}✓ Automatic SSL renewal configured${NC}"

# Setup log rotation
echo -e "${BLUE}Setting up log rotation...${NC}"
sudo tee /etc/logrotate.d/jasaku << EOF
$(pwd)/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        docker-compose -f $(pwd)/docker-compose.prod.yml --env-file $(pwd)/.env.prod restart nginx
    endscript
}
EOF
echo -e "${GREEN}✓ Log rotation configured${NC}"

# Setup backup script
echo -e "${BLUE}Setting up backup script...${NC}"
cat > scripts/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="$(pwd)/backups"
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose -f docker-compose.prod.yml exec -T database pg_dump -U postgres jasaku > "$BACKUP_DIR/jasaku_backup_$DATE.sql"
find "$BACKUP_DIR" -name "*.sql" -mtime +7 -delete
EOF

chmod +x scripts/backup.sh

# Setup automatic backups
(crontab -l 2>/dev/null; echo "0 2 * * * $(pwd)/scripts/backup.sh") | crontab -
echo -e "${GREEN}✓ Automatic backups configured${NC}"

# Final status check
echo -e "${BLUE}Performing final status check...${NC}"
sleep 10

if curl -f https://$DOMAIN/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Application is running successfully!${NC}"
    echo -e "${YELLOW}Your application is available at: https://$DOMAIN${NC}"
else
    echo -e "${RED}✗ Application health check failed${NC}"
    echo -e "${YELLOW}Please check the logs: make prod-logs${NC}"
fi

echo ""
echo -e "${GREEN}Deployment completed!${NC}"
echo ""
echo -e "${BLUE}Useful commands:${NC}"
echo -e "  ${YELLOW}View logs:${NC} docker-compose -f docker-compose.prod.yml --env-file .env.prod logs -f"
echo -e "  ${YELLOW}Restart services:${NC} docker-compose -f docker-compose.prod.yml --env-file .env.prod restart"
echo -e "  ${YELLOW}Update application:${NC} docker-compose -f docker-compose.prod.yml --env-file .env.prod pull && docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d"
echo -e "  ${YELLOW}Backup database:${NC} ./scripts/backup.sh"
echo ""
echo -e "${BLUE}Important files:${NC}"
echo -e "  ${YELLOW}Environment:${NC} .env.prod"
echo -e "  ${YELLOW}Backups:${NC} backups/"
echo -e "  ${YELLOW}Logs:${NC} logs/"
echo ""
echo -e "${YELLOW}Remember to keep your .env.prod file secure and backup your database regularly!${NC}"
