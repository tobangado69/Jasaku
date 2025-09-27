# Jasaku - Docker Development & Production Setup
# Makefile for easy project management

# Variables
PROJECT_NAME := jasaku
DOCKER_COMPOSE_DEV := docker-compose -f docker-compose.dev.yml
DOCKER_COMPOSE_PROD := docker-compose -f docker-compose.prod.yml
DOCKER_COMPOSE := docker-compose

# Colors for output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[1;33m
BLUE := \033[0;34m
NC := \033[0m # No Color

# Default target
.PHONY: help
help: ## Show this help message
	@echo "$(BLUE)Jasaku - Docker Development & Production Setup$(NC)"
	@echo "$(YELLOW)Available commands:$(NC)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Development Environment
.PHONY: dev-setup
dev-setup: ## Setup development environment
	@echo "$(BLUE)Setting up development environment...$(NC)"
	@if [ ! -f .env ]; then \
		echo "$(YELLOW)Creating .env file from template...$(NC)"; \
		cp env.example .env; \
		echo "$(GREEN)✓ .env file created. Please edit it with your settings.$(NC)"; \
	else \
		echo "$(GREEN)✓ .env file already exists.$(NC)"; \
	fi
	@echo "$(BLUE)Building development images...$(NC)"
	$(DOCKER_COMPOSE_DEV) build
	@echo "$(GREEN)✓ Development environment ready!$(NC)"
	@echo "$(YELLOW)Run 'make dev' to start development server$(NC)"

.PHONY: dev
dev: ## Start development environment
	@echo "$(BLUE)Starting development environment...$(NC)"
	$(DOCKER_COMPOSE_DEV) up -d
	@echo "$(GREEN)✓ Development environment started!$(NC)"
	@echo "$(YELLOW)Application: http://localhost:3000$(NC)"
	@echo "$(YELLOW)Database: localhost:5432$(NC)"
	@echo "$(YELLOW)Run 'make dev-logs' to view logs$(NC)"

.PHONY: dev-logs
dev-logs: ## View development logs
	$(DOCKER_COMPOSE_DEV) logs -f

.PHONY: dev-stop
dev-stop: ## Stop development environment
	@echo "$(BLUE)Stopping development environment...$(NC)"
	$(DOCKER_COMPOSE_DEV) down
	@echo "$(GREEN)✓ Development environment stopped$(NC)"

.PHONY: dev-clean
dev-clean: ## Clean development environment (remove volumes)
	@echo "$(BLUE)Cleaning development environment...$(NC)"
	$(DOCKER_COMPOSE_DEV) down -v --remove-orphans
	@echo "$(GREEN)✓ Development environment cleaned$(NC)"

# Production Environment
.PHONY: prod-setup
prod-setup: ## Interactive production setup
	@echo "$(BLUE)Setting up production environment...$(NC)"
	@echo "$(YELLOW)This will guide you through production configuration$(NC)"
	@echo ""
	@read -p "Enter your domain name (e.g., jasaku.com): " domain; \
	read -p "Enter your email for Let's Encrypt: " email; \
	read -p "Enter database password: " db_pass; \
	read -p "Enter NextAuth secret (generate with 'openssl rand -base64 32'): " nextauth_secret; \
	read -p "Enter NEXTAUTH_URL (https://$$domain): " nextauth_url; \
	echo "DOMAIN=$$domain" > .env.prod; \
	echo "EMAIL=$$email" >> .env.prod; \
	echo "DATABASE_URL=postgresql://postgres:$$db_pass@database:5432/jasaku" >> .env.prod; \
	echo "NEXTAUTH_URL=$$nextauth_url" >> .env.prod; \
	echo "NEXTAUTH_SECRET=$$nextauth_secret" >> .env.prod; \
	echo "NODE_ENV=production" >> .env.prod; \
	echo "$(GREEN)✓ Production environment configured$(NC)"; \
	echo "$(YELLOW)Configuration saved to .env.prod$(NC)"

.PHONY: prod-build
prod-build: ## Build production images
	@echo "$(BLUE)Building production images...$(NC)"
	$(DOCKER_COMPOSE_PROD) build
	@echo "$(GREEN)✓ Production images built$(NC)"

.PHONY: prod-deploy
prod-deploy: ## Deploy to production (interactive)
	@echo "$(BLUE)Deploying to production...$(NC)"
	@if [ ! -f .env.prod ]; then \
		echo "$(RED)Error: .env.prod not found. Run 'make prod-setup' first$(NC)"; \
		exit 1; \
	fi
	@echo "$(YELLOW)This will deploy your application to production$(NC)"
	@read -p "Are you sure? (y/N): " confirm; \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		echo "$(BLUE)Starting production deployment...$(NC)"; \
		$(DOCKER_COMPOSE_PROD) --env-file .env.prod up -d; \
		echo "$(GREEN)✓ Production deployment started$(NC)"; \
		echo "$(YELLOW)Run 'make prod-logs' to view logs$(NC)"; \
		echo "$(YELLOW)Run 'make ssl-setup' to setup SSL certificate$(NC)"; \
	else \
		echo "$(YELLOW)Deployment cancelled$(NC)"; \
	fi

.PHONY: prod-logs
prod-logs: ## View production logs
	$(DOCKER_COMPOSE_PROD) logs -f

.PHONY: prod-stop
prod-stop: ## Stop production environment
	@echo "$(BLUE)Stopping production environment...$(NC)"
	$(DOCKER_COMPOSE_PROD) down
	@echo "$(GREEN)✓ Production environment stopped$(NC)"

.PHONY: prod-update
prod-update: ## Update production deployment
	@echo "$(BLUE)Updating production deployment...$(NC)"
	$(DOCKER_COMPOSE_PROD) --env-file .env.prod pull
	$(DOCKER_COMPOSE_PROD) --env-file .env.prod build
	$(DOCKER_COMPOSE_PROD) --env-file .env.prod up -d
	@echo "$(GREEN)✓ Production deployment updated$(NC)"

# SSL & Domain Setup
.PHONY: ssl-setup
ssl-setup: ## Setup SSL certificate with Let's Encrypt
	@echo "$(BLUE)Setting up SSL certificate...$(NC)"
	@if [ ! -f .env.prod ]; then \
		echo "$(RED)Error: .env.prod not found. Run 'make prod-setup' first$(NC)"; \
		exit 1; \
	fi
	@source .env.prod; \
	echo "$(YELLOW)Setting up SSL for domain: $$DOMAIN$(NC)"; \
	$(DOCKER_COMPOSE_PROD) --env-file .env.prod exec nginx certbot certonly --webroot -w /var/www/certbot -d $$DOMAIN --email $$EMAIL --agree-tos --no-eff-email; \
	echo "$(GREEN)✓ SSL certificate setup complete$(NC)"; \
	echo "$(YELLOW)Run 'make prod-restart' to apply SSL configuration$(NC)"

.PHONY: ssl-renew
ssl-renew: ## Renew SSL certificate
	@echo "$(BLUE)Renewing SSL certificate...$(NC)"
	$(DOCKER_COMPOSE_PROD) exec nginx certbot renew
	$(DOCKER_COMPOSE_PROD) exec nginx nginx -s reload
	@echo "$(GREEN)✓ SSL certificate renewed$(NC)"

# Database Management
.PHONY: db-migrate
db-migrate: ## Run database migrations
	@echo "$(BLUE)Running database migrations...$(NC)"
	$(DOCKER_COMPOSE) exec app npx prisma migrate deploy
	@echo "$(GREEN)✓ Database migrations completed$(NC)"

.PHONY: db-seed
db-seed: ## Seed database with initial data
	@echo "$(BLUE)Seeding database...$(NC)"
	$(DOCKER_COMPOSE) exec app npx prisma db seed
	@echo "$(GREEN)✓ Database seeded$(NC)"

.PHONY: db-backup
db-backup: ## Backup database
	@echo "$(BLUE)Creating database backup...$(NC)"
	@mkdir -p backups
	@$(DOCKER_COMPOSE) exec database pg_dump -U postgres jasaku > backups/jasaku_backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)✓ Database backup created in backups/ directory$(NC)"

.PHONY: db-restore
db-restore: ## Restore database from backup
	@echo "$(BLUE)Available backups:$(NC)"
	@ls -la backups/*.sql 2>/dev/null || echo "$(YELLOW)No backups found$(NC)"
	@read -p "Enter backup filename: " backup_file; \
	if [ -f "backups/$$backup_file" ]; then \
		echo "$(BLUE)Restoring database from $$backup_file...$(NC)"; \
		$(DOCKER_COMPOSE) exec -T database psql -U postgres jasaku < "backups/$$backup_file"; \
		echo "$(GREEN)✓ Database restored$(NC)"; \
	else \
		echo "$(RED)Backup file not found$(NC)"; \
	fi

# Monitoring & Maintenance
.PHONY: status
status: ## Show container status
	@echo "$(BLUE)Container Status:$(NC)"
	$(DOCKER_COMPOSE) ps

.PHONY: logs
logs: ## View all logs
	$(DOCKER_COMPOSE) logs -f

.PHONY: shell
shell: ## Open shell in app container
	$(DOCKER_COMPOSE) exec app bash

.PHONY: db-shell
db-shell: ## Open database shell
	$(DOCKER_COMPOSE) exec database psql -U postgres jasaku

.PHONY: pgadmin
pgadmin: ## Open pgAdmin web interface
	@echo "$(BLUE)pgAdmin is available at: http://localhost:5050$(NC)"
	@echo "$(YELLOW)Email: admin@jasaku.com$(NC)"
	@echo "$(YELLOW)Password: admin123$(NC)"
	@echo "$(YELLOW)Database connection is pre-configured$(NC)"

.PHONY: pgadmin-logs
pgadmin-logs: ## View pgAdmin logs
	$(DOCKER_COMPOSE_DEV) logs -f pgadmin

.PHONY: clean
clean: ## Clean up Docker resources
	@echo "$(BLUE)Cleaning up Docker resources...$(NC)"
	$(DOCKER_COMPOSE) down --remove-orphans
	docker system prune -f
	@echo "$(GREEN)✓ Docker resources cleaned$(NC)"

.PHONY: restart
restart: ## Restart all services
	@echo "$(BLUE)Restarting all services...$(NC)"
	$(DOCKER_COMPOSE) restart
	@echo "$(GREEN)✓ All services restarted$(NC)"

.PHONY: prod-restart
prod-restart: ## Restart production services
	@echo "$(BLUE)Restarting production services...$(NC)"
	$(DOCKER_COMPOSE_PROD) --env-file .env.prod restart
	@echo "$(GREEN)✓ Production services restarted$(NC)"

# Utility Commands
.PHONY: install-deps
install-deps: ## Install project dependencies
	@echo "$(BLUE)Installing dependencies...$(NC)"
	npm install
	@echo "$(GREEN)✓ Dependencies installed$(NC)"

.PHONY: build
build: ## Build the application
	@echo "$(BLUE)Building application...$(NC)"
	npm run build
	@echo "$(GREEN)✓ Application built$(NC)"

.PHONY: test
test: ## Run tests
	@echo "$(BLUE)Running tests...$(NC)"
	npm test
	@echo "$(GREEN)✓ Tests completed$(NC)"

.PHONY: lint
lint: ## Run linter
	@echo "$(BLUE)Running linter...$(NC)"
	npm run lint
	@echo "$(GREEN)✓ Linting completed$(NC)"

# VPS Deployment Commands
.PHONY: vps-setup
vps-setup: ## Setup VPS for deployment
	@echo "$(BLUE)Setting up VPS for deployment...$(NC)"
	@echo "$(YELLOW)This script will help you setup your VPS$(NC)"
	@echo "$(YELLOW)Make sure you're running this on your VPS server$(NC)"
	@read -p "Continue? (y/N): " confirm; \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		echo "$(BLUE)Installing Docker and Docker Compose...$(NC)"; \
		curl -fsSL https://get.docker.com -o get-docker.sh; \
		sudo sh get-docker.sh; \
		sudo usermod -aG docker $$USER; \
		sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$$(uname -s)-$$(uname -m)" -o /usr/local/bin/docker-compose; \
		sudo chmod +x /usr/local/bin/docker-compose; \
		echo "$(GREEN)✓ Docker and Docker Compose installed$(NC)"; \
		echo "$(YELLOW)Please logout and login again to use Docker without sudo$(NC)"; \
	else \
		echo "$(YELLOW)VPS setup cancelled$(NC)"; \
	fi

.PHONY: deploy-vps
deploy-vps: ## Deploy to VPS (run this on VPS)
	@echo "$(BLUE)Deploying to VPS...$(NC)"
	@echo "$(YELLOW)Make sure you're running this on your VPS$(NC)"
	@if [ ! -f .env.prod ]; then \
		echo "$(RED)Error: .env.prod not found. Run 'make prod-setup' first$(NC)"; \
		exit 1; \
	fi
	@echo "$(BLUE)Pulling latest images...$(NC)"
	$(DOCKER_COMPOSE_PROD) --env-file .env.prod pull
	@echo "$(BLUE)Starting services...$(NC)"
	$(DOCKER_COMPOSE_PROD) --env-file .env.prod up -d
	@echo "$(GREEN)✓ Deployment completed$(NC)"
	@echo "$(YELLOW)Run 'make ssl-setup' to setup SSL certificate$(NC)"

# Health Checks
.PHONY: health
health: ## Check application health
	@echo "$(BLUE)Checking application health...$(NC)"
	@curl -f http://localhost:3000/api/health && echo "$(GREEN)✓ Application is healthy$(NC)" || echo "$(RED)✗ Application is unhealthy$(NC)"

.PHONY: prod-health
prod-health: ## Check production health
	@echo "$(BLUE)Checking production health...$(NC)"
	@source .env.prod; \
	curl -f https://$$DOMAIN/api/health && echo "$(GREEN)✓ Production application is healthy$(NC)" || echo "$(RED)✗ Production application is unhealthy$(NC)"
