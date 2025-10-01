# pgAdmin Setup Guide

## ✅ pgAdmin Successfully Installed

pgAdmin has been added to your Jasaku development environment for easy PostgreSQL database management.

## Access Information

### **Web Interface**
- **URL**: http://localhost:5050
- **Email**: admin@jasaku.com
- **Password**: admin123

### **Pre-configured Database Connection**
The PostgreSQL database connection is automatically configured:
- **Host**: database (internal Docker network)
- **Port**: 5432
- **Database**: jasaku
- **Username**: postgres
- **Password**: postgres

## How to Use

### 1. **Access pgAdmin**
1. Open your web browser
2. Navigate to http://localhost:5050
3. Login with:
   - Email: `admin@jasaku.com`
   - Password: `admin123`

### 2. **Connect to Database**
1. In the left sidebar, expand "Servers"
2. Click on "Jasaku PostgreSQL" (pre-configured)
3. Enter password: `postgres` when prompted
4. You're now connected to your database!

### 3. **Explore Your Database**
- **Tables**: View all your application tables (Users, Services, Bookings, etc.)
- **Data**: Browse and edit data directly
- **Queries**: Run SQL queries with the built-in query tool
- **Schema**: View table structures and relationships

## Available Commands

### **Development Commands**
```bash
# Start development environment (includes pgAdmin)
make dev

# View pgAdmin access information
make pgadmin

# View pgAdmin logs
make pgadmin-logs

# Stop development environment
make dev-stop
```

### **Database Management**
```bash
# Access database shell directly
make db-shell

# Run database migrations
make db-migrate

# Seed database with sample data
make db-seed

# Backup database
make db-backup
```

## Features

### **Database Management**
- **Visual Query Builder**: Create queries without writing SQL
- **Data Editor**: Edit data directly in tables
- **Schema Browser**: Explore database structure
- **Query Tool**: Execute SQL queries with syntax highlighting
- **Import/Export**: Import and export data in various formats

### **Monitoring & Analysis**
- **Dashboard**: View database statistics and performance
- **Activity Monitor**: Monitor active connections and queries
- **Statistics**: View table and index statistics
- **Logs**: Access PostgreSQL logs

### **Development Tools**
- **SQL Editor**: Advanced SQL editor with autocomplete
- **ERD Tool**: Generate Entity Relationship Diagrams
- **Backup/Restore**: Create and restore database backups
- **User Management**: Manage database users and permissions

## Database Schema Overview

Your Jasaku database includes these main tables:

### **Core Tables**
- **Users**: User accounts with roles (SEEKER, PROVIDER, ADMIN)
- **Categories**: Service categories (including custom categories)
- **Services**: Service listings from providers
- **Bookings**: Service bookings and appointments
- **Reviews**: Customer reviews and ratings

### **Communication**
- **Messages**: Direct messaging between users
- **SupportTickets**: Customer support system

### **Financial**
- **Payments**: Payment transactions (Midtrans integration)
- **Favorites**: User favorite services

### **Authentication**
- **Accounts**: OAuth account connections
- **Sessions**: User session management

## Common Tasks

### **View All Users**
```sql
SELECT id, name, email, role, "createdAt" 
FROM "User" 
ORDER BY "createdAt" DESC;
```

### **View Services with Categories**
```sql
SELECT s.title, s.price, c.name as category, u.name as provider
FROM "Service" s
JOIN "Category" c ON s."categoryId" = c.id
JOIN "User" u ON s."providerId" = u.id
WHERE s.status = 'ACTIVE';
```

### **View Recent Bookings**
```sql
SELECT b.id, s.title, u.name as customer, b.status, b."scheduledAt"
FROM "Booking" b
JOIN "Service" s ON b."serviceId" = s.id
JOIN "User" u ON b."customerId" = u.id
ORDER BY b."createdAt" DESC
LIMIT 10;
```

### **Database Statistics**
```sql
-- Table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Troubleshooting

### **pgAdmin Not Loading**
```bash
# Check if pgAdmin container is running
docker-compose -f docker-compose.dev.yml ps pgadmin

# View pgAdmin logs
make pgadmin-logs

# Restart pgAdmin
docker-compose -f docker-compose.dev.yml restart pgadmin
```

### **Database Connection Issues**
```bash
# Check database status
docker-compose -f docker-compose.dev.yml ps database

# Test database connection
make db-shell

# View database logs
docker-compose -f docker-compose.dev.yml logs database
```

### **Reset pgAdmin Data**
```bash
# Stop services
make dev-stop

# Remove pgAdmin volume
docker volume rm jasaku_pgadmin_dev_data

# Restart services
make dev
```

## Security Notes

### **Development Environment**
- pgAdmin is only accessible locally (localhost:5050)
- Default credentials are for development only
- Database connection uses internal Docker network

### **Production Considerations**
- Change default pgAdmin credentials
- Use environment variables for sensitive data
- Consider removing pgAdmin from production
- Use proper SSL/TLS encryption

## Advanced Configuration

### **Custom Server Configuration**
Edit `pgadmin/servers.json` to add more database connections:

```json
{
  "Servers": {
    "1": {
      "Name": "Jasaku PostgreSQL",
      "Group": "Servers",
      "Host": "database",
      "Port": 5432,
      "MaintenanceDB": "jasaku",
      "Username": "postgres",
      "SSLMode": "prefer",
      "Comment": "Jasaku Development Database"
    },
    "2": {
      "Name": "Production Database",
      "Group": "Production",
      "Host": "prod-db.example.com",
      "Port": 5432,
      "MaintenanceDB": "jasaku_prod",
      "Username": "postgres",
      "SSLMode": "require",
      "Comment": "Production Database"
    }
  }
}
```

### **Environment Variables**
You can customize pgAdmin settings by modifying the environment variables in `docker-compose.dev.yml`:

```yaml
environment:
  - PGADMIN_DEFAULT_EMAIL=your-email@example.com
  - PGADMIN_DEFAULT_PASSWORD=your-secure-password
  - PGADMIN_CONFIG_SERVER_MODE=False
  - PGADMIN_CONFIG_MASTER_PASSWORD_REQUIRED=False
```

## Next Steps

1. **Explore the Interface**: Familiarize yourself with pgAdmin's features
2. **Run Sample Queries**: Try the SQL examples above
3. **Monitor Performance**: Use the dashboard to monitor database performance
4. **Create Backups**: Set up regular database backups
5. **Learn SQL**: Use the query tool to practice SQL queries

## Support

For issues or questions:
1. Check the troubleshooting section above
2. View pgAdmin logs: `make pgadmin-logs`
3. Check container status: `docker-compose -f docker-compose.dev.yml ps`
4. Restart services: `make dev-stop && make dev`

Happy database management! 🐘✨
