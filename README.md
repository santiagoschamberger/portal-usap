# USA Payments Partner Portal 🚀

A comprehensive partner management portal with Zoho CRM integration, enabling partners to submit referrals and track lead status in real-time.

## 📊 Project Status

**Current Phase**: Production-Ready Testing ✅
- ✅ Database schema complete (Supabase)
- ✅ Backend API with Zoho CRM integration
- ✅ Frontend with authentication & dashboard
- ✅ Bi-directional webhook sync (Zoho ↔ Portal)
- ✅ Deployed to Railway (backend) and Vercel (frontend)

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Zustand
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: Supabase PostgreSQL with Row Level Security
- **CRM Integration**: Zoho CRM v8 NodeJS SDK
- **Authentication**: JWT with Supabase Auth
- **Real-Time**: Socket.IO (ready for implementation)
- **Deployment**: Railway (backend), Vercel (frontend)

### System Design
```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  Zoho CRM   │◄───────►│  Backend API │◄───────►│   Frontend  │
│  (Vendors,  │ Webhooks│  (Express +  │   JWT   │  (Next.js)  │
│   Leads)    │    &    │   Socket.IO) │         │             │
└─────────────┘   API   └──────────────┘         └─────────────┘
                              │
                              ▼
                        ┌──────────────┐
                        │   Supabase   │
                        │  PostgreSQL  │
                        │   + Auth     │
                        └──────────────┘
```

## 📁 Project Structure

```
usapayments-portal-2.0/
├── frontend/              # Next.js 15 application
│   ├── src/
│   │   ├── app/          # App router pages
│   │   ├── components/   # Reusable UI components
│   │   ├── lib/          # Utilities and stores
│   │   └── services/     # API service layer
│   └── package.json
│
├── backend/               # Express.js API server
│   ├── src/
│   │   ├── routes/       # API endpoints
│   │   ├── services/     # Business logic
│   │   ├── middleware/   # Auth & error handling
│   │   └── config/       # Configuration
│   ├── database/         # Schema & migrations
│   └── package.json
│
├── docs/                  # Documentation
│   ├── setup/            # Setup & integration guides
│   ├── deployment/       # Deployment instructions
│   ├── testing/          # Testing documentation
│   └── archive/          # Historical notes
│
└── memory-bank/          # AI agent memory
    ├── projectbrief.md   # Project vision
    ├── productContext.md # Business context
    ├── activeContext.md  # Current work
    ├── systemPatterns.md # Architecture patterns
    └── techContext.md    # Technical details
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Zoho CRM account
- Railway account (backend deployment)
- Vercel account (frontend deployment)

### Local Development Setup

1. **Clone repository:**
   ```bash
   git clone <repository-url>
   cd usapayments-portal-2.0
   ```

2. **Install dependencies:**
   ```bash
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Configure environment variables:**
   
   **Backend** (`backend/.env`):
   ```env
   # Server
   NODE_ENV=development
   PORT=5001
   FRONTEND_URL=http://localhost:3000
   
   # Database (Supabase)
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   DATABASE_URL=your_postgres_connection_string
   
   # JWT
   JWT_SECRET=your_jwt_secret_min_32_chars
   JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars
   
   # Zoho CRM
   ZOHO_CLIENT_ID=your_zoho_client_id
   ZOHO_CLIENT_SECRET=your_zoho_client_secret
   ZOHO_REFRESH_TOKEN=your_zoho_refresh_token
   ZOHO_ENVIRONMENT=production
   ```

   # PayArc
   PAYARC_API_URL=your_payarc_api_url
   PAYARC_API_TOKEN=your_payarc_api_token
   
   **Frontend** (`frontend/.env.local`):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5001
   NEXT_PUBLIC_SOCKET_URL=http://localhost:5001
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start development servers:**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev
   # Runs on http://localhost:5001
   
   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   # Runs on http://localhost:3000
   ```

5. **Verify setup:**
   ```bash
   # Check backend health
   curl http://localhost:5001/health
   
   # Should return:
   # {
   #   "status": "OK",
   #   "services": {
   #     "database": "connected",
   #     "zoho_crm": "connected"
   #   }
   # }
   ```

## 🔑 Key Features

### For Partners
- ✅ Automatic account provisioning when approved in Zoho CRM
- ✅ Submit referrals through intuitive web form
- ✅ Track lead status in real-time dashboard
- ✅ View lead history and conversion metrics
- 🚧 Create and manage sub-accounts (structure ready)
- 🚧 Email notifications on status changes

### For Administrators
- ✅ Partner activity monitoring
- ✅ Lead pipeline visibility
- ✅ Automated data sync with Zoho CRM
- ✅ Comprehensive activity logging
- 🚧 Admin dashboard (structure ready)

### Technical Features
- ✅ **Bi-directional Sync**: Portal ↔ Zoho CRM
- ✅ **Security**: Row Level Security (RLS), JWT auth, role-based access
- ✅ **Webhooks**: Real-time partner & lead status updates
- ✅ **Audit Trail**: Complete activity and status change history
- ✅ **Performance**: Indexed queries, optimized database structure

## 📚 Documentation

### Setup & Configuration
- [Complete Setup Guide](./docs/setup/COMPLETE_SETUP_GUIDE.md) - Comprehensive setup instructions
- [Quick Start](./docs/setup/QUICK_START.md) - Get running fast
- [Zoho Integration Setup](./docs/setup/ZOHO_INTEGRATION_SETUP.md) - Configure Zoho webhooks
- [Zoho Integration Guide](./docs/setup/zoho-integration-guide.md) - Detailed integration docs

### Deployment
- [Deployment Guide](./docs/deployment/DEPLOYMENT_GUIDE.md) - General deployment instructions
- [Railway Backend Setup](./docs/deployment/RAILWAY_BACKEND_DEPLOY.md) - Deploy backend to Railway
- [Vercel Frontend Setup](./docs/deployment/VERCEL_DEPLOYMENT.md) - Deploy frontend to Vercel

### Testing
- [Testing Zoho Sync](./docs/testing/TESTING_ZOHO_SYNC.md) - Test integration flows
- [Test Results](./docs/testing/TEST_RESULTS.md) - Latest test results
- [Manual Testing Guide](./docs/testing/MANUAL_TESTING_GUIDE.md) - Manual testing procedures

### Architecture
- [Project Brief](./memory-bank/projectbrief.md) - Vision and requirements
- [System Patterns](./memory-bank/systemPatterns.md) - Architecture patterns
- [Tech Context](./memory-bank/techContext.md) - Technical stack details

## 🔌 API Endpoints

### Core Endpoints
```
Health
GET    /health                                  - System health check

Authentication
POST   /api/auth/login                          - Partner login
POST   /api/auth/refresh                        - Refresh access token

Leads
GET    /api/leads                               - List leads (partner-scoped)
POST   /api/leads                               - Create lead & sync to Zoho
GET    /api/leads/:id                           - Get lead details
PATCH  /api/leads/:id/status                    - Update lead status

Webhooks (Zoho CRM)
POST   /api/webhooks/zoho/partner               - Partner creation/update
POST   /api/webhooks/zoho/lead-status           - Lead status change
POST   /api/webhooks/zoho/contact               - Contact/sub-account creation
```

## 🗄️ Database Schema

7 main tables with comprehensive RLS policies:
- **`partners`** - Partner organizations (synced with Zoho)
- **`users`** - Partner accounts & sub-accounts (Supabase Auth)
- **`leads`** - Lead records with dual IDs (portal + Zoho)
- **`lead_status_history`** - Complete audit trail
- **`activity_log`** - System-wide activity tracking
- **`user_sessions`** - JWT session management
- **`notifications`** - User notifications (structure ready)

### Key Database Features
- ✅ 28 Row Level Security policies
- ✅ 43 performance indexes
- ✅ 6 automated triggers
- ✅ 11 utility functions
- ✅ Foreign key constraints
- ✅ Automated timestamp updates

## 🔐 Security

- **Authentication**: JWT tokens with refresh mechanism
- **Authorization**: Role-based access control (admin, partner, sub)
- **Database**: Row Level Security enforcing partner data isolation
- **API**: CORS, helmet, rate limiting (backend)
- **Validation**: Input validation with Zod schemas
- **Secrets**: Environment-based configuration

## 🚦 Testing

### Run Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Test Complete Flow
```bash
# Test backend webhook integration
cd backend
node test-complete-flow.js
```

### Manual Testing
See [Manual Testing Guide](./docs/testing/MANUAL_TESTING_GUIDE.md) for detailed testing procedures.

## 🌐 Deployment

### Production URLs
- **Frontend**: `https://your-frontend.vercel.app`
- **Backend**: `https://your-backend.up.railway.app`

### Deployment Commands
```bash
# Deploy backend (Railway)
git push railway main

# Deploy frontend (Vercel)
# Auto-deploys on push to main via Vercel GitHub integration
```

See deployment guides in [`docs/deployment/`](./docs/deployment/) for detailed instructions.

## 🛠️ Development Workflow

### Available Scripts

**Root:**
```bash
npm run install:all    # Install all dependencies
```

**Backend:**
```bash
npm run dev           # Development server with hot reload
npm run build         # Build for production
npm start             # Start production server
npm test              # Run tests
```

**Frontend:**
```bash
npm run dev           # Development server
npm run build         # Build for production
npm start             # Start production server
npm run lint          # Run linter
```

## 📊 Project Roadmap

### Completed ✅
- [x] Database schema with RLS
- [x] Backend API with Zoho integration
- [x] Frontend authentication & dashboard
- [x] Bi-directional webhook sync
- [x] Partner provisioning flow
- [x] Lead submission & tracking
- [x] Railway & Vercel deployment

### In Progress 🚧
- [ ] Email notifications (SendGrid integration)
- [ ] Real-time Socket.IO notifications
- [ ] Sub-account management UI
- [ ] Admin dashboard
- [ ] Public referral form

### Planned 📋
- [ ] Advanced analytics & reporting
- [ ] Mobile responsive improvements
- [ ] File upload support
- [ ] Multi-language support

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Update tests
4. Submit a pull request

## 📞 Support

For questions or issues:
- Review [documentation](./docs/)
- Check [memory bank](./memory-bank/) for context
- Create an issue in the repository

---

**Built with ❤️ for USA Payments**

*Last Updated: October 6, 2025*
