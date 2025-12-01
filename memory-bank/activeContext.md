# Active Context

## Current Focus: Phase 6 - Sub-Account Management ✅ COMPLETED

### Recent Session: December 1, 2025

#### Phase 6: Sub-Account Management Implementation
**Status:** ✅ Complete - All migrations applied successfully

**Completed:**
- ✅ Created Migration 020: Add lead relationship to deals table
- ✅ Created Migration 021: Sub-account permissions with RLS policies
- ✅ Created permission middleware for backend
- ✅ Verified sub-account management API endpoints (already existed)
- ✅ Verified lead API permission checks (already in place)
- ✅ Created sub-accounts management page (frontend)
- ✅ Verified "Submitted By" column in leads list (already implemented)
- ✅ Created comprehensive documentation
- ✅ Applied both migrations in Supabase successfully

**Key Features Implemented:**
1. **Database-Level Security:** RLS policies enforce sub-account lead isolation
2. **Permission Fields:** `can_submit_leads` and `can_view_all_partner_leads`
3. **Sub-Account Management UI:** Activate, deactivate, manage sub-accounts
4. **Lead Isolation:** Sub-accounts only see their own submitted leads
5. **Admin Full Access:** Main partners see all partner leads with creator info

**Files Created:**
- `backend/database/migrations/020_add_lead_relationship_to_deals.sql`
- `backend/database/migrations/021_sub_account_permissions.sql`
- `backend/src/middleware/permissions.ts`
- `backend/scripts/apply-migration-021.js`
- `frontend/src/app/sub-accounts/page.tsx`
- `docs/features/SUB_ACCOUNT_PERMISSIONS.md`
- `docs/PHASE_6_COMPLETION.md`

**Next Steps:**
- Deploy backend to Railway
- Deploy frontend to Vercel
- Test in production
- Begin Phase 7: Agent/ISO Handling

---

### Previous Session: November 14, 2025

#### Comprehensive Enhancement Planning
**Stakeholder Requirements:** Michael Kieffer, Norberto, Matthew Mickler

**Planning Completed:**
- ✅ Gathered comprehensive requirements from stakeholders
- ✅ Asked 60+ clarifying questions to eliminate assumptions
- ✅ Received detailed answers for all questions
- ✅ Created comprehensive implementation plan (10 phases)
- ✅ Created implementation checklist for progress tracking
- ✅ Created status/stage mapping reference document
- ✅ Documented all technical specifications
- ✅ Defined testing strategy for each phase
- ✅ Established success criteria

**Key Requirements Clarified:**
1. **Lead Form Simplification:** Reduce to 6 fields, auto-populate lead source
2. **Status Alignment:** Map 6 Portal statuses ↔ Zoho statuses bidirectionally
3. **Deal Management:** Map 13 Zoho stages → 5 simplified Portal stages
4. **Sub-Account Permissions:** Sub-accounts see only their own leads
5. **Agent/ISO Handling:** Cannot submit leads, view assigned leads only
6. **Compensation Documents:** Upload system (30MB max, .xls/.xlsx/.csv)
7. **Pagination & Search:** 10 per page, search by name/company/email
8. **Refresh Button:** Visible to all users, manual Zoho sync

**Documents Created:**
- `docs/PORTAL_ENHANCEMENT_PLAN.md` (Comprehensive 10-phase plan)
- `docs/IMPLEMENTATION_CHECKLIST.md` (Progress tracking checklist)
- `docs/STATUS_STAGE_MAPPING_REFERENCE.md` (Status/stage mappings)

**Implementation Approach:**
- **Phased:** 10 testable phases
- **Test-driven:** Test each phase before proceeding
- **Production testing:** Use production environment for validation
- **No assumptions:** All requirements clarified upfront

**Next Steps:**
- Begin Phase 1: Verification & Foundation
- Verify all webhooks working correctly
- Document current Zoho field mappings
- Pull Zoho state field values for dropdown
- Create database backup

---

### Previous Session: October 28, 2025

## Previous Focus: Lead/Deal Status Management & Conversion Logic ✅ COMPLETED

#### Critical Requirements Implementation
**User Requirements:**
1. **Single Record Per Lead/Deal**: When changing status, delete previous records (keep only 1 record per lead/deal)
2. **Lead Conversion**: When converting lead to deal, remove lead from leads table

**Implementation Completed:**
- ✅ Updated lead status webhook to delete previous status history records
- ✅ Updated deal stage webhook to delete previous stage history records  
- ✅ Added lead conversion detection and deletion logic
- ✅ Enhanced deal webhook to identify and remove converted leads
- ✅ Added comprehensive logging for conversion tracking
- ✅ Created comprehensive test script for validation
- ✅ Created database verification SQL script
- ✅ No linter errors

**Files Modified:**
- `backend/src/routes/webhooks.ts` - Core webhook logic updated
- `backend/scripts/test-lead-deal-conversion.js` - Comprehensive test script
- `backend/scripts/verify-single-records.sql` - Database verification queries

**Key Changes Made:**

**Lead Status Webhook (`/api/webhooks/zoho/lead-status`):**
```typescript
// BEFORE: Added status history records (accumulating)
await supabase.from('lead_status_history').insert({...});

// AFTER: Delete previous records, keep only current one
await supabase.from('lead_status_history').delete().eq('lead_id', lead.id);
await supabase.from('lead_status_history').insert({...});
```

**Deal Webhook (`/api/webhooks/zoho/deal`):**
```typescript
// BEFORE: Added stage history records (accumulating)
await supabase.from('deal_stage_history').insert({...});

// AFTER: Delete previous records, keep only current one
await supabase.from('deal_stage_history').delete().eq('deal_id', existingDeal.id);
await supabase.from('deal_stage_history').insert({...});

// NEW: Lead conversion detection and deletion
const matchingLead = await supabaseAdmin.from('leads')
  .select('id, zoho_lead_id')
  .eq('partner_id', partnerId)
  .eq('first_name', firstName)
  .eq('last_name', lastName)
  .single();

if (matchingLead) {
  // Delete the lead from leads table
  await supabaseAdmin.from('leads').delete().eq('id', matchingLead.id);
  // Clean up lead status history
  await supabaseAdmin.from('lead_status_history').delete().eq('lead_id', matchingLead.id);
}
```

**Ready for Production:**
- ✅ Deploy updated backend to Railway (committed and pushed)
- ✅ Database migrations applied via Supabase MCP
- ✅ Both builds tested and passing locally
- ⏳ Test with real Zoho CRM data
- ⏳ Verify production deployment successful

---

### Previous Session: October 27, 2025

#### Enhanced Deal Webhook Implementation  
**Previous Issue:** Deal webhook was implemented but needed USA Payments specific field support.

**Completed Enhancement:**
- ✅ Enhanced webhook to capture USA Payments specific fields (MID, MCC, Processor, etc.)
- ✅ Added metadata storage for payment-specific data
- ✅ Improved contact information extraction with fallbacks
- ✅ Created comprehensive setup guide
- ✅ Built test script for webhook validation
- ✅ No linter errors

---

### Previous Session: October 6, 2025

#### Completed Tasks
- ✅ **Documentation Organization**: Restructured all documentation into logical folders
  - Created `docs/setup/` for setup and integration guides
  - Created `docs/deployment/` for deployment instructions
  - Created `docs/testing/` for testing documentation
  - Created `docs/archive/` for historical notes
  - Moved 22 documentation files to appropriate locations

- ✅ **README.md Update**: Completely rewrote project README
  - Added comprehensive project overview
  - Documented current status and features
  - Included architecture diagrams
  - Added quick start guide
  - Listed all key features and capabilities
  - Linked to organized documentation
  - Added roadmap and metrics

- ✅ **Memory Bank Update**: Created comprehensive progress tracker
  - Documented complete project timeline
  - Listed all completed features
  - Tracked architectural decisions
  - Documented technical learnings
  - Added success metrics
  - Outlined next steps

## Current State: Production-Ready Testing

### System Status

#### ✅ Fully Operational
1. **Database (Supabase)**
   - 7 tables with complete schema
   - 28 RLS policies enforcing security
   - 43 performance indexes
   - 6 automated triggers
   - 11 utility functions
   - Foreign key constraints active

2. **Backend API (Railway)**
   - Express.js server running
   - Health endpoint: `/health` ✅
   - Authentication: JWT with Supabase Auth
   - Zoho CRM integration active
   - Webhook endpoints exposed
   - Environment variables configured

3. **Frontend (Vercel)**
   - Next.js 15 application
   - Authentication flows working
   - Dashboard with stats and navigation
   - Leads management pages
   - Protected routes with role checks
   - Responsive layout

4. **Zoho Integration**
   - Partner provisioning: Zoho → Portal ✅
   - Lead creation: Portal → Zoho ✅
   - Status updates: Zoho → Portal ✅
   - OAuth token management ✅

#### 🚧 Ready But Not Active
1. **Email Service**
   - SendGrid integration coded
   - Welcome email template exists
   - Waiting for API key configuration

2. **Real-Time Updates**
   - Socket.IO server configured
   - Client setup complete
   - Not yet connected in production

3. **Sub-Account Management**
   - Database structure exists
   - API endpoints structured
   - UI not yet implemented

### Documentation Structure

```
docs/
├── setup/                        # Setup & Integration
│   ├── COMPLETE_SETUP_GUIDE.md   # Comprehensive setup
│   ├── QUICK_START.md            # Quick setup
│   ├── ZOHO_INTEGRATION_SETUP.md # Zoho webhook config
│   ├── ZOHO_INTEGRATION_COMPLETE.md
│   ├── zoho-integration-guide.md # Detailed Zoho docs
│   └── frontend-doc.md           # Frontend architecture
│
├── deployment/                   # Deployment Guides
│   ├── DEPLOYMENT_GUIDE.md       # General deployment
│   ├── RAILWAY_BACKEND_DEPLOY.md # Railway setup
│   └── VERCEL_DEPLOYMENT.md      # Vercel setup
│
├── testing/                      # Testing Documentation
│   ├── TESTING_ZOHO_SYNC.md      # Integration testing
│   ├── TEST_RESULTS.md           # Latest test results
│   ├── MANUAL_TESTING_GUIDE.md   # Manual procedures
│   └── ZOHO_TESTING_GUIDE.md     # Zoho-specific tests
│
└── archive/                      # Historical Notes
    ├── DATABASE_SETUP_COMPLETE.md
    ├── FRONTEND_ERRORS_FIXED.md
    ├── LAYOUT_COMPLETE.md
    ├── RAILWAY_FRONTEND_FIX.md
    ├── RAILWAY_QUICK_FIX.md
    ├── VERCEL_FIX.md
    ├── TEST_ZOHO_PRODUCTION.md
    └── CLAUDE.md
```

### Code Structure

```
usapayments-portal-2.0/
├── frontend/
│   ├── src/
│   │   ├── app/              # Pages (8+)
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   ├── forgot-password/
│   │   │   │   └── reset-password/
│   │   │   ├── dashboard/
│   │   │   └── leads/
│   │   │
│   │   ├── components/       # UI Components (25+)
│   │   │   ├── auth/
│   │   │   ├── layout/
│   │   │   └── ui/
│   │   │
│   │   ├── lib/              # Utilities
│   │   │   ├── api-client.ts
│   │   │   ├── supabase.ts
│   │   │   └── stores/
│   │   │
│   │   └── services/         # API Services
│   │       ├── auth.service.ts
│   │       └── leads.service.ts
│   │
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── routes/           # API Routes
│   │   │   ├── auth.ts
│   │   │   ├── leads.ts
│   │   │   └── webhooks.ts
│   │   │
│   │   ├── services/         # Business Logic
│   │   │   ├── authService.ts
│   │   │   └── zohoService.ts
│   │   │
│   │   ├── middleware/       # Middleware
│   │   │   └── auth.ts
│   │   │
│   │   └── config/           # Configuration
│   │       └── database.ts
│   │
│   ├── database/
│   │   ├── migrations/       # 12 migration files
│   │   └── functions/        # Database functions
│   │
│   └── package.json
│
├── docs/                     # All documentation
├── memory-bank/              # AI context
└── README.md                 # Main project documentation
```

## Next Immediate Actions

### For Production Launch
1. **Configure Zoho Webhooks**: Update webhook URLs in Zoho CRM to point to Railway backend
2. **Test End-to-End**: Complete production flow test (partner → lead → status)
3. **Email Service**: Configure SendGrid or Resend for notifications
4. **Monitoring**: Set up error tracking (Sentry) and logging

### For Feature Completion
1. **Sub-Account Management**: Build UI for partner to manage sub-accounts
2. **Admin Dashboard**: Create admin interface for system monitoring
3. **Public Form**: Implement public referral submission page
4. **Real-Time**: Connect Socket.IO for live dashboard updates

### For Production Readiness
1. **Security Audit**: Review all security policies and access controls
2. **Performance Testing**: Load testing for API endpoints
3. **Error Handling**: Comprehensive error handling and user feedback
4. **Documentation**: API documentation with OpenAPI/Swagger

## Current Implementation Patterns

### Authentication Flow
```typescript
1. User submits credentials
2. Frontend → POST /api/auth/login
3. Backend validates against Supabase
4. Returns JWT access token + refresh token
5. Frontend stores in Zustand store
6. API calls include Authorization header
7. Protected routes check auth state
8. Refresh token used when access expires
```

### Lead Submission Flow
```typescript
1. Partner fills lead form
2. Frontend validates with Zod schema
3. POST /api/leads with partner context
4. Backend creates lead in Supabase
5. Backend syncs to Zoho CRM
6. Zoho returns lead ID
7. Backend updates local lead with zoho_lead_id
8. Activity logged
9. Success response to frontend
```

### Webhook Processing Flow
```typescript
1. Zoho CRM triggers webhook
2. Backend receives POST request
3. Validates payload structure
4. Processes based on webhook type:
   - Partner: Create partner + user + send invite
   - Lead Status: Update lead + create history
   - Contact: Create sub-account
5. Logs activity
6. Returns success/error response
```

## Technical Decisions & Patterns

### Security Definer Functions
**Pattern**: Use PostgreSQL security definer functions for operations requiring elevated permissions

**Example**: `create_partner_with_user()`
```sql
CREATE FUNCTION create_partner_with_user(...)
RETURNS json
SECURITY DEFINER
SET search_path = public
```

**Reason**: Allows creating partner + Supabase Auth user + portal user atomically, bypassing RLS

**Usage**: Called from partner webhook to provision accounts

### Row Level Security Strategy
**Pattern**: Multi-layered RLS policies for data isolation

**Layers**:
1. **Partner Isolation**: Users only see their partner's data
2. **Role Elevation**: Admin users bypass partner isolation
3. **Action Scoping**: Different policies for SELECT, INSERT, UPDATE, DELETE

**Example**:
```sql
-- Partners can view own data
CREATE POLICY "partner_view" ON leads
  FOR SELECT USING (
    partner_id = (SELECT partner_id FROM users WHERE id = auth.uid())
  );

-- Admins can view all data
CREATE POLICY "admin_view" ON leads
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );
```

### Component Organization
**Pattern**: Atomic design with feature-based folders

**Structure**:
- `components/ui/` - Primitive components (button, input, card)
- `components/auth/` - Authentication components
- `components/layout/` - Layout components
- `components/leads/` - Feature-specific components (planned)

**Reason**: Scalable, maintainable, clear boundaries

### API Client Pattern
**Pattern**: Axios instance with interceptors

**Features**:
- Automatic Authorization header injection
- Token refresh on 401
- Error handling
- Request/response logging

**Location**: `frontend/src/lib/api-client.ts`

### State Management
**Pattern**: Zustand for client state, React Query for server state (planned)

**Current**: Using Zustand for auth state
**Planned**: React Query for data fetching, caching, and synchronization

**Reason**: Lightweight, TypeScript-friendly, minimal boilerplate

## Environment Configuration

### Backend (.env)
```env
# Required for production
✅ NODE_ENV=production
✅ PORT=5001
✅ FRONTEND_URL=https://your-frontend.vercel.app
✅ SUPABASE_URL=...
✅ SUPABASE_SERVICE_ROLE_KEY=...
✅ DATABASE_URL=...
✅ JWT_SECRET=...
✅ JWT_REFRESH_SECRET=...
✅ ZOHO_CLIENT_ID=...
✅ ZOHO_CLIENT_SECRET=...
✅ ZOHO_REFRESH_TOKEN=...
✅ ZOHO_ENVIRONMENT=production

# Optional
🚧 SENDGRID_API_KEY=... (not yet configured)
🚧 SENTRY_DSN=... (monitoring)
```

### Frontend (.env.local)
```env
✅ NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app
✅ NEXT_PUBLIC_SOCKET_URL=https://your-backend.up.railway.app
✅ NEXT_PUBLIC_SUPABASE_URL=...
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Key Files Reference

### Critical Configuration
- `backend/src/config/database.ts` - Database connection
- `backend/src/services/zohoService.ts` - Zoho CRM integration
- `frontend/src/lib/api-client.ts` - API client
- `frontend/src/lib/supabase.ts` - Supabase client
- `frontend/src/lib/stores/authStore.ts` - Auth state

### Core Features
- `backend/src/routes/auth.ts` - Authentication endpoints
- `backend/src/routes/leads.ts` - Lead management endpoints
- `backend/src/routes/webhooks.ts` - Webhook handlers
- `frontend/src/app/dashboard/page.tsx` - Main dashboard
- `frontend/src/components/layout/DashboardLayout.tsx` - Layout

### Database
- `backend/database/complete_migration.sql` - Complete schema
- `backend/database/migrations/` - Individual migrations
- `backend/database/functions/` - Database functions

## Known Issues & Workarounds

### Issue: Placeholder Password on Partner Creation
**Description**: Webhooks create users with placeholder password
**Impact**: Partners can't login immediately
**Workaround**: Partners must use "Forgot Password" flow
**Permanent Fix**: Implement email service to send password reset link automatically

### Issue: No Real-Time Dashboard Updates
**Description**: Lead status changes don't appear live
**Impact**: Users must refresh to see updates
**Workaround**: Manual refresh
**Permanent Fix**: Connect Socket.IO for real-time push

### Issue: Limited Error Feedback
**Description**: Some errors show generic messages
**Impact**: Users may not understand what went wrong
**Workaround**: Check backend logs
**Permanent Fix**: Improve error handling and user messaging

## Testing Checklist

### ✅ Tested & Working
- [x] Backend health check
- [x] Database connection
- [x] Zoho CRM connection
- [x] Partner webhook (development)
- [x] Lead creation → Zoho sync
- [x] Status webhook (development)
- [x] Login/logout flow
- [x] Password reset flow
- [x] Dashboard rendering
- [x] Lead form validation
- [x] Protected routes

### 🚧 Needs Production Testing
- [ ] Partner webhook (production)
- [ ] Lead status webhook (production)
- [ ] Complete flow: Add partner in Zoho → Login → Submit lead → Update status
- [ ] Performance under load
- [ ] Error recovery scenarios

### 📋 Not Yet Implemented
- [ ] Email notifications
- [ ] Real-time Socket.IO updates
- [ ] Sub-account creation
- [ ] Admin dashboard
- [ ] Public referral form

## Development Notes

### Git Workflow
- Main branch: `main` (production)
- Working directly on main for now
- Need to establish branch strategy for multi-developer work

### Deployment Strategy
- **Backend**: Push to Railway via git
- **Frontend**: Auto-deploys from GitHub via Vercel
- **Database**: Manual migrations via Supabase dashboard or scripts

### Monitoring Strategy (Planned)
- **Errors**: Sentry integration
- **Logs**: Railway built-in logging
- **Metrics**: Need APM solution
- **Uptime**: Need monitoring service

## Recent Fixes (October 6, 2025 - Evening Session)

### Critical Bug Fixes
1. **Lead Database Storage Issue**: Fixed incorrect column name in lead creation
   - **Problem**: Leads were being created in Zoho CRM but not saved to local Supabase database
   - **Root Cause**: Code used `created_by_user_id` but schema defines `created_by`
   - **Fix**: Updated `backend/src/routes/leads.ts` line 145 to use correct column name
   - **Also Fixed**: Changed `source` to `lead_source` to match schema
   - **Impact**: Leads now properly save to database and appear in portal

2. **Sub-Account Stats Query Issue**: Fixed incorrect column reference
   - **Problem**: Sub-account statistics weren't calculating correctly
   - **Root Cause**: Stats query in `backend/src/routes/partners.ts` line 276 used wrong column name
   - **Fix**: Updated to use `created_by` instead of `created_by_user_id`
   - **Impact**: Sub-accounts now show accurate lead statistics

### Database Verification Results
- **Users Table**: Contains 6 users, all with role='admin', no sub_accounts yet
- **Leads Table**: Contains 1 lead with `created_by=null` (from before fix)
- **Sub-Accounts Location**: Sub-accounts appear in the `users` table with:
  - `role = 'sub_account'`
  - `partner_id` linking to parent partner
  - `is_active = true`
  - Created via Zoho Contact webhook or manual creation endpoint

### How to Verify Sub-Accounts Work
1. In Zoho CRM, create a Contact linked to an existing Partner (Account)
2. Webhook will trigger at `/api/webhooks/zoho/contact`
3. Sub-account will be created in `users` table with `role='sub_account'`
4. Check Supabase users table: `SELECT * FROM users WHERE role='sub_account'`
5. Sub-account receives password reset email and can login to portal

## Conclusion

The project is well-organized with clear documentation structure and comprehensive progress tracking. All foundational features are complete and working. Recent bug fixes ensure leads save properly to database and sub-account stats calculate correctly. Next steps focus on production validation and completing secondary features.

---

*Last Updated: October 6, 2025*
*Session: Bug fixes for lead storage and sub-account queries*
