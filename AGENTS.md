# AGENTS.md

## Cursor Cloud specific instructions

### Project Overview
Jasaku is a Next.js 15 full-stack service marketplace platform (single app, not a monorepo). See `README.md` for full feature list and API endpoints. See `DEMO_CREDENTIALS.md` for test accounts.

### Running the Application
- **Dev server**: `npm run dev` (port 3000)
- **Lint**: `npm run lint` (uses ESLint v8 with `eslint-config-next@15.5.4`)
- **Build**: `npm run build` — note: the production build currently fails due to pre-existing `@typescript-eslint/no-explicit-any` lint errors throughout the codebase. TypeScript compilation itself succeeds.

### Database
- Uses **SQLite** (not PostgreSQL as README claims) via Prisma with `better-sqlite3` adapter
- DB file: `prisma/dev.db`
- Prisma reads env vars from `.env` (not `.env.local`), so both files must exist with `DATABASE_URL`
- After fresh setup, categories must be inserted before seeding (see migration `20250927114025_add_categories` for the INSERT statements). `prisma db push` does not run migrations, so the category seed data is not automatically applied.
- Seed: `npm run db:seed` (uses `tsx prisma/seed.ts`)

### Environment Variables
Required in both `.env` and `.env.local`:
```
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dev-secret-key-for-local-development-only"
```

### Dev Dependencies Note
- `eslint` (v8) and `eslint-config-next@15.5.4` are required devDependencies for `npm run lint`
- No test framework is configured in this project

### Known Gotchas
- The `category` field in Prisma is a relation (Category model), not a string. API routes must transform `category` objects to `category.name` strings before sending to frontend components, or the React UI will crash with "Objects are not valid as a React child".
- The Seeker dashboard at `components/seeker/dashboard.tsx` fetches data from `/api/dashboard?type=seeker`. It was previously hardcoded — if stats seem wrong, check the API route.
- Registration is at `/auth/register` with API at `/api/auth/register` (public, no auth required).
