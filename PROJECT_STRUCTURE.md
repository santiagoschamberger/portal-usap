# USA Payments Portal 2.0 - Project Structure

## 📁 Root Directory

```
usapayments-portal-2.0/
├── backend/          # Backend API (Node.js + Express + TypeScript)
├── frontend/         # Frontend UI (Next.js + React + TypeScript)
├── docs/             # Project documentation
├── memory-bank/      # AI context and project memory
├── supabase/         # Supabase migrations
└── PROJECT_STRUCTURE.md  # This file
```

---

## 🔧 Backend Structure

```
backend/
├── src/                    # TypeScript source code
│   ├── config/            # Configuration files (database, etc.)
│   ├── controllers/       # Request handlers
│   ├── middleware/        # Express middleware (auth, validation)
│   ├── models/           # Data models and types
│   ├── routes/           # API route definitions
│   │   ├── auth.ts       # Authentication routes
│   │   ├── partners.ts   # Partner management
│   │   ├── leads.ts      # Lead management
│   │   ├── deals.ts      # Deal management
│   │   └── webhooks.ts   # Zoho CRM webhooks
│   ├── services/         # Business logic
│   │   ├── authService.ts
│   │   └── zohoService.ts
│   ├── utils/            # Utility functions
│   └── index.ts          # Entry point
├── database/             # Database schemas and migrations
│   ├── migrations/       # SQL migration files
│   ├── functions/        # PostgreSQL functions
│   └── supabase_schema.sql
├── tests/                # Test files (organized)
│   └── README.md
├── scripts/              # Utility scripts
│   ├── apply-migrations.js
│   └── temp/            # Temporary/one-off scripts
├── dist/                 # Compiled JavaScript (auto-generated, gitignored)
├── package.json
├── tsconfig.json
└── railway.json          # Railway deployment config
```

---

## 🎨 Frontend Structure

```
frontend/
├── src/
│   ├── app/              # Next.js app directory
│   │   ├── (auth)/      # Auth pages (login, register)
│   │   ├── leads/       # Leads management pages
│   │   ├── deals/       # Deals management pages
│   │   ├── sub-accounts/ # Sub-accounts management
│   │   └── layout.tsx    # Root layout
│   ├── components/       # Reusable React components
│   │   ├── layout/      # Layout components
│   │   └── ui/          # UI components (shadcn/ui)
│   ├── services/         # API service clients
│   │   ├── api.ts       # API client
│   │   ├── authService.ts
│   │   ├── partnerService.ts
│   │   └── leadService.ts
│   ├── lib/              # Utility libraries
│   └── types/            # TypeScript type definitions
├── public/               # Static assets
├── package.json
├── next.config.ts
└── railway.toml          # Railway deployment config
```

---

## 📚 Documentation Structure

```
docs/
├── README.md             # Main documentation index
├── prd.txt               # Product Requirements Document
├── CHANGES_SUMMARY.md    # Project change history
├── DEPLOYMENT_STATUS.md  # Current deployment status
│
├── setup/                # Setup and installation guides
│   ├── QUICK_START.md
│   ├── COMPLETE_SETUP_GUIDE.md
│   ├── ZOHO_INTEGRATION_SETUP.md
│   └── zoho-integration-guide.md
│
├── deployment/           # Deployment documentation
│   ├── DEPLOYMENT_GUIDE.md
│   ├── RAILWAY_DEPLOYMENT.md
│   └── VERCEL_DEPLOYMENT.md
│
├── testing/              # Testing guides
│   ├── MANUAL_TESTING_GUIDE.md
│   ├── TESTING_ZOHO_SYNC.md
│   └── ZOHO_TESTING_GUIDE.md
│
├── bugs/                 # Bug fix documentation
│   ├── README.md
│   ├── CONTACT_WEBHOOK_BUG_FIX.md
│   ├── DEAL_WEBHOOK_FIX.md
│   ├── SUB_ACCOUNT_FILTER_BUG.md
│   └── QUICK_FIX_SUMMARY.md
│
├── features/             # Feature implementation docs
│   ├── README.md
│   ├── SUB_ACCOUNTS_SETUP.md
│   ├── LEAD_SYNC_IMPLEMENTATION.md
│   └── ZOHO_LEAD_SYNC.md
│
└── archive/              # Archived/historical docs
    └── (old documentation)
```

---

## 🧠 Memory Bank

```
memory-bank/
├── activeContext.md      # Current session context
├── progress.md           # Development progress tracking
├── projectbrief.md       # Project overview
├── productContext.md     # Product specifications
├── techContext.md        # Technical architecture
└── systemPatterns.md     # Code patterns and conventions
```

---

## 🗄️ Database

**Provider:** Supabase (PostgreSQL)

**Main Tables:**
- `partners` - Partner organizations
- `users` - User accounts (main + sub-accounts)
- `leads` - Lead/prospect data
- `deals` - Converted leads/opportunities
- `activity_log` - Audit trail
- `lead_status_history` - Lead status changes
- `deal_stage_history` - Deal stage changes

**Migrations:** Located in `backend/database/migrations/`

---

## 🔗 Key Integrations

### Zoho CRM
- **Service:** `backend/src/services/zohoService.ts`
- **Webhooks:** `backend/src/routes/webhooks.ts`
- **Endpoints:**
  - `/api/webhooks/zoho/partner` - Partner creation
  - `/api/webhooks/zoho/contact` - Sub-account creation
  - `/api/webhooks/zoho/deal` - Deal sync
  - `/api/webhooks/zoho/lead-status` - Lead status updates

### Supabase
- **Auth:** JWT-based authentication
- **Database:** PostgreSQL with RLS (Row Level Security)
- **Client:** `@supabase/supabase-js`

---

## 🚀 Deployment

- **Backend:** Railway (https://railway.app)
- **Frontend:** Vercel (https://vercel.com)
- **Database:** Supabase (https://supabase.com)

**Environment Variables:**
- Backend: See `backend/.env.example`
- Frontend: See `frontend/.env.example`

---

## 📦 Key Dependencies

### Backend
- `express` - Web framework
- `typescript` - Type safety
- `@supabase/supabase-js` - Database client
- `axios` - HTTP client for Zoho API
- `jsonwebtoken` - JWT auth
- `bcryptjs` - Password hashing

### Frontend
- `next` - React framework
- `react` - UI library
- `@supabase/supabase-js` - Database client
- `axios` - HTTP client
- `shadcn/ui` - UI components
- `tailwindcss` - Styling

---

## 🔒 Security

- **Authentication:** JWT tokens via Supabase Auth
- **Authorization:** Role-based (admin, partner, sub_account)
- **Database:** Row Level Security (RLS) policies
- **API:** Rate limiting, CORS, helmet
- **Secrets:** Environment variables (never committed)

---

## 📝 Development Workflow

1. **Feature Development:**
   - Create feature branch
   - Implement feature
   - Test locally
   - Update documentation
   - Submit for review

2. **Bug Fixes:**
   - Document the bug (in `docs/bugs/`)
   - Implement fix
   - Test the fix
   - Update documentation
   - Deploy

3. **Database Changes:**
   - Create migration file (`backend/database/migrations/`)
   - Test migration locally
   - Apply to Supabase
   - Update schema documentation

---

## 🧪 Testing

- **Backend Tests:** Located in `backend/tests/`
- **API Testing:** Use Postman or test scripts
- **Integration Testing:** Test Zoho webhooks
- **Manual Testing:** Follow guides in `docs/testing/`

---

## 📖 Documentation Guidelines

- **Bug Fixes:** Document in `docs/bugs/` with:
  - Problem description
  - Root cause analysis
  - Solution implemented
  - Files modified
  - Testing steps

- **Features:** Document in `docs/features/` with:
  - Feature overview
  - Implementation details
  - Setup guide
  - Usage instructions

- **Keep Updated:** Update docs when code changes

---

## 🆘 Troubleshooting

**Common Issues:**

1. **Build Fails:**
   - Check TypeScript errors: `npm run build`
   - Verify all dependencies installed: `npm install`

2. **Database Connection:**
   - Check Supabase credentials in `.env`
   - Verify network access

3. **Zoho Integration:**
   - Check API credentials
   - Verify webhook URLs
   - Check Zoho CRM settings

4. **Authentication:**
   - Check JWT secret
   - Verify Supabase Auth setup

---

## 📞 Support

For questions or issues:
1. Check existing documentation in `docs/`
2. Review bug fixes in `docs/bugs/`
3. Check memory bank context
4. Contact development team

---

**Last Updated:** October 27, 2025  
**Version:** 2.0

