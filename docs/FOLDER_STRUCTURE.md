# Folder Structure

This document outlines the organized folder structure of the Jasaku project.

## 📁 Root Directory Structure

```
jasaku/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── admin/             # Admin dashboard pages
│   ├── provider/          # Provider dashboard pages
│   ├── seeker/            # Seeker dashboard pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
│
├── components/            # React components
│   ├── admin/            # Admin-specific components
│   ├── auth/             # Authentication HOCs & components
│   ├── features/         # Feature-based components
│   ├── layout/           # Layout components
│   ├── provider/         # Provider-specific components
│   ├── providers/        # Context providers
│   ├── seeker/           # Seeker-specific components
│   ├── shared/           # Shared/common components
│   └── ui/               # UI primitives (shadcn/ui)
│
├── config/               # Server configuration
│   ├── nginx/           # Nginx configuration
│   └── pgadmin/         # pgAdmin configuration
│
├── docker/              # Docker-related files
│   ├── docker-compose.yml      # Production compose
│   ├── docker-compose.dev.yml  # Development compose
│   ├── docker-compose.prod.yml # Production with nginx
│   ├── Dockerfile             # Production Dockerfile
│   └── Dockerfile.dev         # Development Dockerfile
│
├── docs/                # Documentation
│   ├── AUTH_REFACTORING_GUIDE.md
│   ├── AUTH_REFACTORING_SUMMARY.md
│   ├── DATABASE_MIGRATION_SUMMARY.md
│   ├── DEMO_CREDENTIALS.md
│   ├── DEPLOYMENT_GUIDE.md
│   ├── DOCKER_SETUP.md
│   ├── FOLDER_STRUCTURE.md (this file)
│   ├── PGADMIN_SETUP.md
│   ├── PROJECT_STATUS.md
│   ├── jasaku-prd.md
│   ├── setup-guide.md
│   └── todo.md
│
├── hooks/               # Custom React hooks
│   ├── useApi.ts
│   └── useAuth.ts
│
├── lib/                 # Utility libraries
│   ├── auth/           # Authentication utilities
│   │   ├── index.ts
│   │   └── middleware.ts
│   ├── types/          # TypeScript types
│   │   └── index.ts
│   ├── auth.ts         # NextAuth configuration
│   ├── db.ts           # Database client
│   └── utils.ts        # Utility functions
│
├── nginx/              # Nginx configuration (production)
│   └── nginx-template.conf
│
├── pgadmin/            # pgAdmin configuration
│   └── servers.json
│
├── prisma/             # Prisma ORM
│   ├── migrations/    # Database migrations
│   ├── schema.prisma  # Database schema
│   └── seed.ts        # Database seeding
│
├── public/             # Public static files
│   ├── fonts/         # Font files
│   │   ├── GeistVF.woff
│   │   └── GeistMonoVF.woff
│   └── favicon.ico
│
├── scripts/            # Utility scripts
│   ├── deploy-vps.sh
│   ├── health-check.sh
│   ├── setup-windows.ps1
│   ├── Makefile
│   └── manual-complete-payments.js
│
├── types/              # TypeScript type definitions
│   └── next-auth.d.ts # NextAuth type augmentation
│
├── .env.example        # Environment variables template
├── .gitignore
├── components.json     # shadcn/ui configuration
├── next.config.mjs     # Next.js configuration
├── next-env.d.ts       # Next.js types
├── package.json        # Dependencies & scripts
├── package-lock.json
├── postcss.config.js   # PostCSS configuration
├── README.md           # Main documentation
├── tailwind.config.ts  # Tailwind CSS configuration
├── tsconfig.json       # TypeScript configuration
└── tsconfig.tsbuildinfo # TypeScript build cache
```

## 📂 Directory Descriptions

### `/app` - Next.js App Directory
Contains all pages, layouts, and API routes following Next.js 13+ app router conventions.

**Key subdirectories:**
- `api/` - Backend API endpoints
- `auth/` - Authentication pages (sign in, sign up, etc.)
- `admin/`, `provider/`, `seeker/` - Role-specific dashboard pages
- `layout.tsx` - Root layout with providers
- `globals.css` - Global CSS styles

### `/components` - React Components
Organized by feature and domain.

**Structure:**
- `admin/`, `provider/`, `seeker/` - Role-specific components
- `auth/` - Authentication HOCs and guards
- `features/` - Feature-based component organization
- `layout/` - App layout components (sidebar, navbar, etc.)
- `providers/` - React context providers
- `shared/` - Shared/reusable components
- `ui/` - UI primitives from shadcn/ui

### `/config` - Server Configuration
Server and infrastructure configuration files.

**Contains:**
- `nginx/` - Nginx reverse proxy configuration
- `pgadmin/` - Database management UI configuration

**Note:** Build tool configs (PostCSS, Tailwind, components.json) must remain in the project root as required by Next.js.

### `/docker` - Docker Configuration
All Docker-related files for containerization.

**Files:**
- `Dockerfile` - Production Docker image
- `Dockerfile.dev` - Development Docker image
- `docker-compose.yml` - Standard compose setup
- `docker-compose.dev.yml` - Development with pgAdmin
- `docker-compose.prod.yml` - Production with Nginx & SSL

### `/docs` - Documentation
Comprehensive project documentation.

**Topics covered:**
- Setup guides
- Deployment instructions
- API documentation
- Database migration guides
- Authentication system docs
- Development best practices

### `/hooks` - Custom React Hooks
Reusable React hooks for common functionality.

**Current hooks:**
- `useAuth.ts` - Authentication & authorization
- `useApi.ts` - API call utilities

### `/lib` - Utility Libraries
Core utility functions and configurations.

**Modules:**
- `auth/` - Authentication middleware and utilities
- `types/` - Shared TypeScript types
- `db.ts` - Prisma database client
- `utils.ts` - Common utility functions

### `/prisma` - Database Layer
Prisma ORM configuration and migrations.

**Contents:**
- `schema.prisma` - Database schema definition
- `migrations/` - Database migration files
- `seed.ts` - Database seeding script

### `/public` - Static Assets
Public files served directly by Next.js.

**Assets:**
- `fonts/` - Web fonts
- `favicon.ico` - Site favicon
- Images, icons (as needed)

### `/scripts` - Automation Scripts
Utility scripts for development and deployment.

**Scripts:**
- `deploy-vps.sh` - VPS deployment script
- `health-check.sh` - Application health check
- `setup-windows.ps1` - Windows setup script
- `Makefile` - Make commands for common tasks
- `manual-complete-payments.js` - Payment utility

### `/types` - TypeScript Definitions
Global TypeScript type definitions.

**Files:**
- `next-auth.d.ts` - NextAuth type augmentation

## 🔄 Recent Reorganization

The project was recently reorganized to improve structure and maintainability:

### Moved to `/docs`:
- ✅ All markdown documentation files
- ✅ Setup and deployment guides
- ✅ Project status and todo lists

### Moved to `/docker`:
- ✅ All Dockerfile variants
- ✅ All docker-compose configurations

### Moved to `/public`:
- ✅ Font files (`fonts/`)
- ✅ Favicon and static assets

### Moved to `/config`:
- ✅ Build tool configurations
- ✅ Component library configs

### Moved to `/scripts`:
- ✅ Deployment scripts
- ✅ Utility scripts
- ✅ Makefile

### Moved to `/app`:
- ✅ `globals.css` (Next.js convention)

## 🎯 Naming Conventions

### Files
- **Components**: PascalCase (`UserCard.tsx`, `DashboardLayout.tsx`)
- **Utilities**: camelCase (`useAuth.ts`, `formatDate.ts`)
- **Types**: PascalCase (`types/next-auth.d.ts`)
- **Config**: kebab-case (`docker-compose.yml`, `tailwind.config.ts`)

### Directories
- **Feature-based**: lowercase (`admin/`, `provider/`, `seeker/`)
- **Component types**: lowercase (`ui/`, `layout/`, `features/`)
- **Technical**: lowercase (`api/`, `lib/`, `hooks/`)

## 📝 Import Paths

The project uses TypeScript path aliases for clean imports:

```typescript
// ✅ Use path aliases
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { requireAuth } from "@/lib/auth/middleware"

// ❌ Avoid relative imports
import { Button } from "../../../components/ui/button"
```

**Configured in `tsconfig.json`:**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

## 🚀 Quick Navigation

### Adding New Features
1. **Component**: Add to `/components/features/[feature-name]/`
2. **API Route**: Add to `/app/api/[endpoint]/route.ts`
3. **Page**: Add to `/app/[route]/page.tsx`
4. **Hook**: Add to `/hooks/use[HookName].ts`
5. **Utility**: Add to `/lib/[utility].ts`

### Finding Files
- **UI Components**: `/components/ui/`
- **Auth Logic**: `/lib/auth/`
- **Database Schema**: `/prisma/schema.prisma`
- **API Routes**: `/app/api/`
- **Type Definitions**: `/types/` and `/lib/types/`
- **Documentation**: `/docs/`

## 🔍 Best Practices

1. **Colocation**: Keep related files close together
2. **Feature Folders**: Group by feature in `/components/features/`
3. **Shared Components**: Use `/components/shared/` for reusable pieces
4. **Type Safety**: Define types in `/lib/types/` or colocate with features
5. **Documentation**: Update `/docs/` when adding major features
6. **Clean Imports**: Always use path aliases (`@/`)

## 📊 File Count Summary

- **Total Components**: ~50+ React components
- **API Routes**: ~30+ endpoints
- **Documentation Files**: 10+ docs
- **Configuration Files**: 8+ configs
- **Docker Files**: 5 Docker-related files
- **Utility Scripts**: 5+ automation scripts

---

**Last Updated**: After folder reorganization (Current date)
**Maintained By**: Development Team

