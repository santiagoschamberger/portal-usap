# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Project Setup
```bash
# Install all dependencies (root, frontend, backend)
npm run install:all

# Development servers
npm run dev                 # Start both frontend and backend concurrently
npm run dev:frontend        # Start Next.js frontend only (port 3000)
npm run dev:backend         # Start Express backend only (port 5000)

# Production builds
npm run build               # Build both applications
npm run build:frontend      # Build Next.js frontend
npm run build:backend       # Build TypeScript backend

# Code quality
npm run lint                # Lint both applications
npm run lint:frontend       # Next.js ESLint
npm run lint:backend        # Backend ESLint with TypeScript rules
```

### Individual Project Commands
```bash
# Frontend (Next.js)
cd frontend && npm run dev      # Development with Turbopack
cd frontend && npm run build    # Production build
cd frontend && npm run lint     # ESLint

# Backend (Express + TypeScript)
cd backend && npm run dev       # Development with nodemon
cd backend && npm run build     # TypeScript compilation
cd backend && npm run start     # Run compiled JavaScript
cd backend && npm run lint      # ESLint for TypeScript
cd backend && npm run lint:fix  # Auto-fix ESLint issues
```

## Architecture Overview

This is a partner portal system with Zoho CRM integration, structured as a monorepo with separate frontend and backend applications.

### Project Structure
- `frontend/` - Next.js 14+ application with TypeScript and Tailwind CSS
- `backend/` - Express.js API server with TypeScript
- `memory-bank/` - Project documentation and context files
- `supabase/` - Database migrations and schema

### Key Technologies
- **Frontend**: Next.js 14+, React 19, TypeScript, Tailwind CSS, Zustand, Socket.IO client
- **Backend**: Express.js, TypeScript, Supabase PostgreSQL, Socket.IO, JWT auth
- **Integration**: Zoho CRM SDK, SendGrid for emails
- **Database**: Supabase PostgreSQL with Row Level Security

### Environment Configuration
Both frontend and backend require environment variables:
- Backend: `.env` file with database, JWT, Zoho CRM, and SendGrid config
- Frontend: `.env.local` file with API URLs and Supabase public keys

### Database Schema
Uses Supabase PostgreSQL with these core tables:
- `partners` - Partner companies synced with Zoho CRM
- `users` - Portal users linked to partners (admin/sub roles)
- `leads` - Lead information with dual ID tracking (portal + Zoho)
- `lead_status_history` - Audit trail for status changes

### Real-time Features
Uses Socket.IO for real-time communication between frontend and backend for live lead status updates and notifications.

### Authentication
JWT-based authentication with refresh tokens, integrated with Supabase Row Level Security for data isolation by partner.

### Integration Patterns
- Webhook endpoints for Zoho CRM status updates at `/webhooks/zoho/*`
- Background job processing for CRM synchronization
- Retry logic and error handling for external API calls

## Development Workflow

1. Use `npm run dev` to start both servers concurrently
2. Frontend runs on `http://localhost:3000`
3. Backend API runs on `http://localhost:5001`
4. Database operations use Supabase client with type-safe queries
5. Authentication uses Supabase Auth (not custom JWT)
6. Always run linting before committing changes
7. Test Zoho CRM integration with sandbox environment first

## Environment Variables Required

### Backend (.env)
```bash
# Supabase
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key

# Zoho CRM Integration
ZOHO_CLIENT_ID=your_zoho_client_id
ZOHO_CLIENT_SECRET=your_zoho_client_secret
ZOHO_REFRESH_TOKEN=your_zoho_refresh_token

# Application
NODE_ENV=development
PORT=5001
FRONTEND_URL=http://localhost:3000
```

## API Endpoints

### Authentication (Supabase Auth)
- Frontend handles auth with Supabase client
- Backend validates tokens via middleware

### Leads Management
- `GET /api/leads` - Get partner's leads
- `POST /api/leads` - Create new lead (syncs to Zoho)
- `GET /api/leads/:id` - Get specific lead details
- `PATCH /api/leads/:id/status` - Update lead status

### Webhooks (Zoho CRM Integration)
- `POST /api/webhooks/zoho/partner` - Partner approval webhook
- `POST /api/webhooks/zoho/lead-status` - Lead status update webhook
- `POST /api/webhooks/zoho/contact` - Contact creation webhook

### Health Check
- `GET /health` - Server, database, and Zoho CRM status

## Key Files to Understand

- `backend/src/index.ts` - Express server setup and middleware
- `backend/src/config/database.ts` - Supabase client configuration
- `backend/src/services/zohoService.ts` - Zoho CRM integration service  
- `backend/src/middleware/auth.ts` - Supabase Auth middleware
- `backend/src/routes/leads.ts` - Lead management endpoints
- `backend/src/routes/webhooks.ts` - Zoho CRM webhook handlers
- `frontend/src/app/layout.tsx` - Next.js app layout and providers
- `memory-bank/techContext.md` - Detailed technical specifications
- `memory-bank/productContext.md` - Business requirements and goals
- `zoho-integration-guide.md` - Complete Zoho CRM integration guide

## Current Status

✅ **Task 1**: Project Infrastructure Setup - COMPLETED  
✅ **Task 2**: Database Schema Implementation - COMPLETED  
✅ **Task 3**: Backend Integration with Supabase Auth + Zoho CRM - COMPLETED

**Ready for Task 4**: Frontend implementation with authentication and lead management