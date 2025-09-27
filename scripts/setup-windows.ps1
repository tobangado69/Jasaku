# Jasaku Windows Setup Script
# PowerShell script for Windows development setup

param(
    [Parameter(Mandatory=$false)]
    [string]$Environment = "dev"
)

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Show-Help {
    Write-ColorOutput "Jasaku - Docker Development & Production Setup" $Blue
    Write-ColorOutput "Available commands:" $Yellow
    Write-ColorOutput ""
    Write-ColorOutput "Development:" $Green
    Write-ColorOutput "  .\scripts\setup-windows.ps1 dev-setup    # Setup development environment" $White
    Write-ColorOutput "  .\scripts\setup-windows.ps1 dev          # Start development server" $White
    Write-ColorOutput "  .\scripts\setup-windows.ps1 dev-logs     # View development logs" $White
    Write-ColorOutput "  .\scripts\setup-windows.ps1 dev-stop     # Stop development server" $White
    Write-ColorOutput ""
    Write-ColorOutput "Production:" $Green
    Write-ColorOutput "  .\scripts\setup-windows.ps1 prod-setup   # Interactive production setup" $White
    Write-ColorOutput "  .\scripts\setup-windows.ps1 prod-deploy  # Deploy to production" $White
    Write-ColorOutput "  .\scripts\setup-windows.ps1 prod-logs    # View production logs" $White
    Write-ColorOutput "  .\scripts\setup-windows.ps1 prod-stop    # Stop production server" $White
    Write-ColorOutput ""
    Write-ColorOutput "Database:" $Green
    Write-ColorOutput "  .\scripts\setup-windows.ps1 db-migrate   # Run database migrations" $White
    Write-ColorOutput "  .\scripts\setup-windows.ps1 db-seed      # Seed database" $White
    Write-ColorOutput "  .\scripts\setup-windows.ps1 db-backup    # Backup database" $White
    Write-ColorOutput ""
    Write-ColorOutput "Utilities:" $Green
    Write-ColorOutput "  .\scripts\setup-windows.ps1 status       # Show container status" $White
    Write-ColorOutput "  .\scripts\setup-windows.ps1 logs         # View all logs" $White
    Write-ColorOutput "  .\scripts\setup-windows.ps1 clean        # Clean Docker resources" $White
    Write-ColorOutput "  .\scripts\setup-windows.ps1 health       # Check application health" $White
}

function Setup-DevEnvironment {
    Write-ColorOutput "Setting up development environment..." $Blue
    
    if (-not (Test-Path ".env")) {
        Write-ColorOutput "Creating .env file from template..." $Yellow
        Copy-Item "env.example" ".env"
        Write-ColorOutput "✓ .env file created. Please edit it with your settings." $Green
    } else {
        Write-ColorOutput "✓ .env file already exists." $Green
    }
    
    Write-ColorOutput "Building development images..." $Blue
    docker-compose -f docker-compose.dev.yml build
    
    Write-ColorOutput "✓ Development environment ready!" $Green
    Write-ColorOutput "Run '.\scripts\setup-windows.ps1 dev' to start development server" $Yellow
}

function Start-DevEnvironment {
    Write-ColorOutput "Starting development environment..." $Blue
    docker-compose -f docker-compose.dev.yml up -d
    Write-ColorOutput "✓ Development environment started!" $Green
    Write-ColorOutput "Application: http://localhost:3000" $Yellow
    Write-ColorOutput "Database: localhost:5432" $Yellow
    Write-ColorOutput "Run '.\scripts\setup-windows.ps1 dev-logs' to view logs" $Yellow
}

function Show-DevLogs {
    docker-compose -f docker-compose.dev.yml logs -f
}

function Stop-DevEnvironment {
    Write-ColorOutput "Stopping development environment..." $Blue
    docker-compose -f docker-compose.dev.yml down
    Write-ColorOutput "✓ Development environment stopped" $Green
}

function Setup-ProdEnvironment {
    Write-ColorOutput "Setting up production environment..." $Blue
    Write-ColorOutput "This will guide you through production configuration" $Yellow
    
    $domain = Read-Host "Enter your domain name (e.g., jasaku.com)"
    $email = Read-Host "Enter your email for Let's Encrypt"
    $dbPassword = Read-Host "Enter database password"
    $nextauthSecret = Read-Host "Enter NextAuth secret (generate with 'openssl rand -base64 32')"
    $nextauthUrl = Read-Host "Enter NEXTAUTH_URL (https://$($domain))"
    
    $envContent = @"
DOMAIN=$($domain)
EMAIL=$($email)
DATABASE_URL=postgresql://postgres:$($dbPassword)@database:5432/jasaku
NEXTAUTH_URL=$($nextauthUrl)
NEXTAUTH_SECRET=$($nextauthSecret)
NODE_ENV=production
"@
    
    $envContent | Out-File -FilePath ".env.prod" -Encoding UTF8
    
    Write-ColorOutput "✓ Production environment configured" $Green
    Write-ColorOutput "Configuration saved to .env.prod" $Yellow
}

function Deploy-ProdEnvironment {
    Write-ColorOutput "Deploying to production..." $Blue
    
    if (-not (Test-Path ".env.prod")) {
        Write-ColorOutput "Error: .env.prod not found. Run '.\scripts\setup-windows.ps1 prod-setup' first" $Red
        exit 1
    }
    
    Write-ColorOutput "This will deploy your application to production" $Yellow
    $confirm = Read-Host "Are you sure? (y/N)"
    
    if ($confirm -eq "y" -or $confirm -eq "Y") {
        Write-ColorOutput "Starting production deployment..." $Blue
        docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
        Write-ColorOutput "✓ Production deployment started" $Green
        Write-ColorOutput "Run '.\scripts\setup-windows.ps1 prod-logs' to view logs" $Yellow
    } else {
        Write-ColorOutput "Deployment cancelled" $Yellow
    }
}

function Show-ProdLogs {
    docker-compose -f docker-compose.prod.yml logs -f
}

function Stop-ProdEnvironment {
    Write-ColorOutput "Stopping production environment..." $Blue
    docker-compose -f docker-compose.prod.yml down
    Write-ColorOutput "✓ Production environment stopped" $Green
}

function Invoke-DatabaseMigration {
    Write-ColorOutput "Running database migrations..." $Blue
    docker-compose exec app npx prisma migrate deploy
    Write-ColorOutput "✓ Database migrations completed" $Green
}

function Invoke-DatabaseSeed {
    Write-ColorOutput "Seeding database..." $Blue
    docker-compose exec app npx prisma db seed
    Write-ColorOutput "✓ Database seeded" $Green
}

function Backup-Database {
    Write-ColorOutput "Creating database backup..." $Blue
    if (-not (Test-Path "backups")) {
        New-Item -ItemType Directory -Path "backups"
    }
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    docker-compose exec database pg_dump -U postgres jasaku > "backups\jasaku_backup_$timestamp.sql"
    Write-ColorOutput "✓ Database backup created in backups/ directory" $Green
}

function Show-ContainerStatus {
    Write-ColorOutput "Container Status:" $Blue
    docker-compose ps
}

function Show-Logs {
    docker-compose logs -f
}

function Clean-DockerResources {
    Write-ColorOutput "Cleaning up Docker resources..." $Blue
    docker-compose down --remove-orphans
    docker system prune -f
    Write-ColorOutput "✓ Docker resources cleaned" $Green
}

function Test-ApplicationHealth {
    Write-ColorOutput "Checking application health..." $Blue
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-ColorOutput "✓ Application is healthy" $Green
        } else {
            Write-ColorOutput "✗ Application is unhealthy" $Red
        }
    } catch {
        Write-ColorOutput "✗ Application is unhealthy" $Red
    }
}

# Main script logic
switch ($Environment) {
    "help" { Show-Help }
    "dev-setup" { Setup-DevEnvironment }
    "dev" { Start-DevEnvironment }
    "dev-logs" { Show-DevLogs }
    "dev-stop" { Stop-DevEnvironment }
    "prod-setup" { Setup-ProdEnvironment }
    "prod-deploy" { Deploy-ProdEnvironment }
    "prod-logs" { Show-ProdLogs }
    "prod-stop" { Stop-ProdEnvironment }
    "db-migrate" { Invoke-DatabaseMigration }
    "db-seed" { Invoke-DatabaseSeed }
    "db-backup" { Backup-Database }
    "status" { Show-ContainerStatus }
    "logs" { Show-Logs }
    "clean" { Clean-DockerResources }
    "health" { Test-ApplicationHealth }
    default { Show-Help }
}
