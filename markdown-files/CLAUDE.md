# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run check` - Run TypeScript/Svelte checks
- `npm run check:watch` - Run checks in watch mode

### Testing
- `npm run test` - Run all Playwright tests
- `npm run test:ui` - Run tests with UI
- `npm run test:headed` - Run tests in headed mode
- `npm run test:debug` - Debug tests (Chromium, headed, 60s timeout)
- `npm run test:auth` - Run authentication tests only
- `npm run test:dashboard` - Run dashboard tests only
- `npm run test:e2e` - Run end-to-end tests only
- `npm run test:real-auth` - Run real authentication tests
- `npm run test:quick` - Run quick subset of tests
- `npm run test:report` - Show test report
- `npm run test:codegen` - Generate test code

### Database & Scripts
- `npm run setup:postgres` - Set up PostgreSQL database
- `npm run backup:db` - Backup database
- `./docker-dev-supabase.sh start` - Start Supabase development stack
- `./docker-dev.sh shell` - Open shell in development container

## Architecture

This is a SvelteKit-based SaaS application with dual database support:

### Core Stack
- **Frontend**: SvelteKit with TypeScript, Tailwind CSS
- **Databases**: Supabase (primary) + PostgreSQL fallback
- **Authentication**: Supabase Auth with custom session management
- **Testing**: Playwright for E2E testing
- **Monitoring**: Grafana + Prometheus stack

### Database Architecture
The application supports two database configurations:
1. **Supabase** (primary): Hosted PostgreSQL with built-in auth
2. **Local PostgreSQL**: Custom auth implementation using `postgres` npm package

Key database files:
- `src/lib/supabaseClient.ts` - Supabase client and auth utilities
- `src/lib/server/database.ts` - PostgreSQL connection and query helpers
- `init-db.sql` - Database schema initialization
- `sql-files/` - Database setup and migration scripts

### Project Structure
- `src/routes/api/auth/` - Authentication API endpoints (login, logout, register)
- `src/lib/components/` - Reusable Svelte components
- `src/lib/server/` - Server-side utilities (database, auth)
- `tests/` - Playwright test suites organized by feature
- `markdown-files/` - Documentation and setup guides
- `docker-compose*.yml` - Multi-environment Docker configurations

### Development Environment
The project uses Docker for development with multiple configurations:
- `docker-compose-supabase.yml` - Supabase-focused development
- `docker-compose-postgres.yml` - Local PostgreSQL development
- `docker-compose.yml` - Full monitoring stack with Grafana/Prometheus

### Environment Configuration
- `env.template` - Template for environment variables
- `env.postgres` - PostgreSQL-specific environment
- Multiple `.env` configurations for different deployment targets

### Authentication Flow
1. Supabase handles OAuth, magic links, and email/password auth
2. Custom session management for local PostgreSQL setup
3. Row Level Security (RLS) policies for data access
4. User profiles with extensible metadata support

### Testing Strategy
Tests are organized by feature area:
- `tests/auth/` - Authentication flow tests
- `tests/dashboard/` - Dashboard functionality
- `tests/e2e/` - End-to-end user journeys
- Test utilities in `tests/utils/` for auth helpers and configuration

### Monitoring & Observability
- Grafana dashboards for SaaS metrics (user analytics, performance)
- Prometheus metrics collection
- Custom business metrics tracking
- Error monitoring and performance tracking

## Important Notes

- Always check which database configuration is active before making changes
- Use `npm run check` before committing to catch TypeScript errors
- Authentication tests require either Supabase or PostgreSQL to be running
- Docker development environment provides full monitoring stack
- Environment variables must be configured for both database options