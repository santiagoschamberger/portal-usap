# Implementation Checklist - Partner Portal Enhancements

**Quick Reference:** Track progress for each phase  
**Related Document:** [PORTAL_ENHANCEMENT_PLAN.md](./PORTAL_ENHANCEMENT_PLAN.md)  
**Last Updated:** November 14, 2025

---

## 📊 Overall Progress

- [x] Phase 1: Verification & Foundation ✅
- [x] Phase 2: Lead Form Simplification ✅
- [x] Phase 3: Lead Status Alignment ✅
- [x] Phase 4: Lead List Enhancements ✅
- [ ] Phase 5: Deal Management
- [ ] Phase 6: Sub-Account Management
- [ ] Phase 7: Agent/ISO Handling
- [ ] Phase 8: Compensation Documents
- [ ] Phase 9: Referral Form Logic
- [ ] Phase 10: Final Polish & Testing

---

## Phase 1: Verification & Foundation ✅ COMPLETE!

### Tasks
- [x] Review webhook implementations
- [x] Create verification report
- [x] Create field investigation script
- [x] Create webhook testing script
- [x] Create scripts documentation
- [x] Run field investigation script
- [x] Run webhook tests
- [x] Verify partner webhook working
- [x] Verify contact webhook working
- [x] Verify lead-status webhook working (validation correct)
- [x] Verify deal webhook working (validation correct)
- [x] Test Portal → Zoho sync (ready for real data)
- [x] Test Zoho → Portal sync (webhooks validated)
- [x] Document current Zoho field mappings
- [x] Pull Zoho "State" field values (text field confirmed)
- [x] Check if "Send to Motion" stage exists (Lead Status, not Deal Stage)
- [x] Verify Zoho "Partner Type" field name (Vendor_Type confirmed)
- [x] Build backend locally
- [x] Build frontend locally
- [x] Create comprehensive findings document

### Deliverables
- [x] PHASE_1_VERIFICATION_REPORT.md
- [x] investigate-zoho-fields.js script
- [x] test-webhooks.js script
- [x] backend/scripts/README.md
- [x] Field investigation results (zoho-field-investigation.txt)
- [x] Webhook test results (captured in terminal)
- [x] ZOHO_FIELD_FINDINGS.md (comprehensive documentation)
- [ ] Zoho field mapping reference
- [ ] Database backup confirmation

---

## Phase 2: Lead Form Simplification 📝 ✅

### Backend Tasks
- [x] Update `POST /api/leads` validation schema
- [x] Remove required validation for removed fields
- [x] Add auto-population for `lead_source` (partner name)
- [x] Update URL validation (auto-prepend https://)
- [x] Update Zoho field mapping in `zohoService.ts`
- [x] Test lead creation API
- [x] Test Zoho sync with new fields
- [x] Add `state` column to leads table (Migration 016)

### Frontend Tasks
- [x] Simplify lead form to 6 fields
- [x] Add State dropdown (52 US states/territories)
- [x] Add Additional Information textarea (optional)
- [x] Remove Annual Revenue field
- [x] Remove Number of Employees field
- [x] Hide Lead Source field (auto-populated)
- [x] Update form validation
- [x] Test form submission
- [x] Test mobile responsiveness

### Testing
- [x] Form validation works
- [x] Required fields enforced
- [x] State dropdown populated
- [x] Lead source auto-populated correctly
- [x] URL validation accepts all formats
- [x] Lead created in Portal DB
- [x] Lead syncs to Zoho correctly
- [x] All fields map correctly
- [x] Database schema updated with state column

### Files Modified
- [x] `backend/src/routes/leads.ts`
- [x] `backend/database/migrations/016_add_state_to_leads.sql` (NEW)
- [x] `backend/scripts/apply-migration-016.js` (NEW)
- [x] `frontend/src/app/leads/new/page.tsx`
- [x] `frontend/src/components/leads/StateDropdown.tsx` (NEW)

---

## Phase 3: Lead Status Alignment 🔄 ✅

### Backend Tasks
- [x] Create `statusMappingService.ts`
- [x] Implement `mapStatusToZoho()` function
- [x] Implement `mapStatusFromZoho()` function
- [x] Update lead-status webhook with mapping
- [x] Add `zoho_status` column to leads table
- [x] Test bidirectional status mapping

### Frontend Tasks
- [x] Create `LeadStatusBadge.tsx` component
- [x] Update status dropdown (6 options only)
- [x] Update leads list view
- [x] Add status badge styling

### Data Migration
- [x] Create migration SQL script (017)
- [x] Run migration on database

### Testing
- [x] Status mapping Zoho → Portal works
- [x] Status badges styled correctly
- [ ] Status updates sync correctly (pending user testing)
- [ ] Dropdown shows 6 options only (pending user testing)

### Files Modified
- [x] `backend/src/services/statusMappingService.ts` (NEW)
- [x] `backend/src/routes/webhooks.ts`
- [x] `backend/database/migrations/017_add_zoho_status_to_leads.sql` (NEW)
- [x] `backend/scripts/apply-migration-017.js` (NEW)
- [x] `frontend/src/components/leads/LeadStatusBadge.tsx` (NEW)
- [x] `frontend/src/app/leads/page.tsx`

---

## Phase 4: Lead List Enhancements 📊 ✅

### Backend Tasks
- [x] Add pagination to `GET /api/leads`
- [x] Add search query parameter
- [x] Add filter parameters (status, date)
- [x] Create `POST /api/leads/sync` endpoint (Refined)
- [x] Test pagination
- [x] Test search functionality
- [x] Test filters
- [x] Test sync endpoint

### Frontend Tasks
- [x] Add pagination component
- [x] Add search input with debounce
- [x] Add status filter dropdown
- [x] Add date range filter
- [x] Add "Refresh" button (visible to all)
- [x] Add loading states
- [x] Add success/error toasts
- [x] Test pagination
- [x] Test search
- [x] Test filters
- [x] Test refresh button

### Testing
- [x] Pagination works (10 per page)
- [x] Page size selector works
- [x] Search finds by name/company/email
- [x] Status filter works
- [x] Date range filter works
- [x] Refresh syncs from Zoho
- [x] Loading states display
- [x] All users see refresh button
- [x] Mobile responsive

### Files Modified
- [x] `backend/src/routes/leads.ts`
- [x] `frontend/src/app/leads/page.tsx`
- [x] `frontend/src/components/leads/LeadFilters.tsx` (NEW)
- [x] `frontend/src/components/ui/Pagination.tsx` (NEW)

---

## Phase 5: Deal Management 💼

### Backend Tasks
- [ ] Create `stageMappingService.ts`
- [ ] Implement stage mapping (13 → 5)
- [ ] Update deal webhook with mapping
- [ ] Handle `Approval_Time_Stamp` field
- [ ] Handle "Submitted By" logic
- [ ] Create `GET /api/deals` endpoint
- [ ] Create `GET /api/deals/:id` endpoint
- [ ] Create `POST /api/deals/sync` endpoint
- [ ] Test deal webhook
- [ ] Test deal endpoints

### Frontend Tasks
- [ ] Create deals list page
- [ ] Create deal detail page
- [ ] Create `DealCard` component
- [ ] Create `DealStageBadge` component
- [ ] Add pagination (10 per page)
- [ ] Add search and filters
- [ ] Add refresh button
- [ ] Display "Approval Date"
- [ ] Display "Submitted By" correctly
- [ ] Test all functionality

### Testing
- [ ] Deals sync from Zoho
- [ ] Stage mapping displays correctly
- [ ] Approval Date shows correctly
- [ ] Submitted By shows correct attribution
- [ ] "Submitted on ZOHO" shows correctly
- [ ] Stage history tracked
- [ ] Pagination works
- [ ] Search works
- [ ] Refresh button works
- [ ] Mobile responsive

### Files Modified
- [ ] `backend/src/services/stageMappingService.ts` (NEW)
- [ ] `backend/src/routes/webhooks.ts`
- [ ] `backend/src/routes/deals.ts` (NEW)
- [ ] `frontend/src/app/deals/page.tsx` (NEW)
- [ ] `frontend/src/app/deals/[id]/page.tsx` (NEW)
- [ ] `frontend/src/components/deals/DealCard.tsx` (NEW)
- [ ] `frontend/src/components/deals/DealStageBadge.tsx` (NEW)
- [ ] `frontend/src/services/dealService.ts` (NEW)

---

## Phase 6: Sub-Account Management 👥

### Database Tasks
- [ ] Add `is_active` column to users
- [ ] Add `can_submit_leads` column to users
- [ ] Add `can_view_all_partner_leads` column to users
- [ ] Create RLS policy: sub-accounts own leads
- [ ] Create RLS policy: partners all leads
- [ ] Test RLS policies

### Backend Tasks
- [ ] Create `GET /api/partners/:id/sub-accounts`
- [ ] Create `PATCH /api/sub-accounts/:id`
- [ ] Create `PATCH /api/sub-accounts/:id/deactivate`
- [ ] Create `PATCH /api/sub-accounts/:id/activate`
- [ ] Create `POST /api/sub-accounts/:id/reset-password`
- [ ] Create permission middleware
- [ ] Update lead routes with permission checks
- [ ] Test all endpoints
- [ ] Test permission enforcement

### Frontend Tasks
- [ ] Create sub-accounts list page
- [ ] Create `SubAccountCard` component
- [ ] Create `EditSubAccountModal` component
- [ ] Add deactivate/activate toggle
- [ ] Add edit details functionality
- [ ] Add reset password button
- [ ] Update lead filtering by permission
- [ ] Test all functionality

### Testing
- [ ] Sub-accounts created via webhook
- [ ] Sub-accounts see only their leads
- [ ] Main partners see all leads
- [ ] Deactivate/activate works
- [ ] Edit details works
- [ ] Reset password works
- [ ] Permission checks enforced
- [ ] UI hides restricted features
- [ ] Mobile responsive

### Files Modified
- [ ] `backend/database/migrations/` (schema changes)
- [ ] `backend/src/routes/partners.ts`
- [ ] `backend/src/routes/leads.ts`
- [ ] `backend/src/middleware/permissions.ts` (NEW)
- [ ] `frontend/src/app/sub-accounts/page.tsx` (NEW)
- [ ] `frontend/src/components/sub-accounts/SubAccountCard.tsx` (NEW)
- [ ] `frontend/src/components/sub-accounts/EditSubAccountModal.tsx` (NEW)
- [ ] `frontend/src/services/subAccountService.ts` (NEW)

---

## Phase 7: Agent/ISO & Strategic Partner Handling 🤝

### Database Tasks
- [ ] Add `partner_type` column to partners
- [ ] Add `assigned_partner_id` column to leads
- [ ] Test schema changes

### Backend Tasks
- [ ] Update partner webhook to store `partner_type`
- [ ] Update lead webhook to store `assigned_partner_id`
- [ ] Update `GET /api/leads` for Agent/ISO filtering
- [ ] Block `POST /api/leads` for Agent/ISO
- [ ] Test partner type logic
- [ ] Test lead assignment

### Frontend Tasks
- [ ] Add conditional UI for Agent/ISO
- [ ] Hide "Submit Lead" for Agent/ISO
- [ ] Show "Assigned Leads" section
- [ ] Add informational message
- [ ] Update navigation based on type
- [ ] Test all scenarios

### Testing
- [ ] Partner type synced from Zoho
- [ ] Agent/ISO cannot submit leads
- [ ] Agent/ISO see assigned leads only
- [ ] Strategic Partners can submit
- [ ] UI adapts based on type
- [ ] Lead assignment works
- [ ] Mobile responsive

### Files Modified
- [ ] `backend/database/migrations/` (schema changes)
- [ ] `backend/src/routes/webhooks.ts`
- [ ] `backend/src/routes/leads.ts`
- [ ] `frontend/src/app/leads/page.tsx`
- [ ] `frontend/src/app/leads/new/page.tsx`
- [ ] `frontend/src/components/layout/DashboardLayout.tsx`

---

## Phase 8: Compensation Document Management 💰

### Database Tasks
- [ ] Create `compensation_documents` table
- [ ] Create indexes
- [ ] Create Supabase Storage bucket
- [ ] Set up storage RLS policies
- [ ] Test storage policies

### Backend Tasks
- [ ] Create `POST /api/compensation/upload`
- [ ] Create `GET /api/compensation/documents`
- [ ] Create `GET /api/compensation/documents/:id/download`
- [ ] Implement file type validation
- [ ] Implement file size validation (30MB)
- [ ] Implement file upload to Supabase
- [ ] Test all endpoints

### Frontend Tasks
- [ ] Create compensation page
- [ ] Create `DocumentUpload` component
- [ ] Create `DocumentList` component
- [ ] Add drag & drop upload
- [ ] Add month/year selector
- [ ] Add notes field
- [ ] Add date range filter
- [ ] Add pagination (10 per page)
- [ ] Add download functionality
- [ ] Test all functionality

### Testing
- [ ] File upload works (.xls, .xlsx, .csv)
- [ ] File type validation works
- [ ] File size validation works (30MB)
- [ ] Files stored in Supabase
- [ ] Database record created
- [ ] Document list displays
- [ ] Date range filter works
- [ ] Pagination works
- [ ] Download works
- [ ] Partners see only their docs
- [ ] Multiple uploads allowed
- [ ] Mobile responsive

### Files Modified
- [ ] `backend/database/migrations/016_compensation_documents.sql` (NEW)
- [ ] `backend/src/routes/compensation.ts` (NEW)
- [ ] `frontend/src/app/compensation/page.tsx` (NEW)
- [ ] `frontend/src/components/compensation/DocumentUpload.tsx` (NEW)
- [ ] `frontend/src/components/compensation/DocumentList.tsx` (NEW)
- [ ] `frontend/src/services/compensationService.ts` (NEW)

---

## Phase 9: Referral Form Logic 📋

### Backend Tasks
- [ ] Verify `POST /api/leads` supports referral source
- [ ] Test referral submission
- [ ] Test Zoho sync with referral source

### Frontend Tasks
- [ ] Create referral form page
- [ ] Create `ReferralForm` component
- [ ] Add partner type check
- [ ] Show message for Agent/ISO
- [ ] Show form for Strategic/Standard
- [ ] Test all scenarios

### Testing
- [ ] Agent/ISO cannot access form
- [ ] Strategic partners can submit
- [ ] Standard partners can submit
- [ ] Form fields match lead form
- [ ] Referrals sync to Zoho
- [ ] Referrals appear in leads list
- [ ] Mobile responsive

### Files Modified
- [ ] `frontend/src/app/referrals/new/page.tsx` (NEW)
- [ ] `frontend/src/components/referrals/ReferralForm.tsx` (NEW)

---

## Phase 10: Final Polish & Testing ✨

### Comprehensive Testing
- [ ] Partner provisioning (Zoho → Portal)
- [ ] Sub-account creation (Zoho → Portal)
- [ ] Lead submission (Portal → Zoho)
- [ ] Lead status update (Zoho → Portal)
- [ ] Deal creation (Zoho → Portal)
- [ ] Deal stage update (Zoho → Portal)
- [ ] Sub-account permissions
- [ ] Document upload/retrieval
- [ ] Referral submission
- [ ] Agent/ISO lead assignment

### Performance Testing
- [ ] Load test lead list (1000+ leads)
- [ ] Test pagination performance
- [ ] Test search performance
- [ ] Test file upload (large files)

### Security Testing
- [ ] RLS policy enforcement
- [ ] Permission checks
- [ ] File access controls
- [ ] XSS/CSRF protection

### Documentation Updates
- [ ] Update `docs/README.md`
- [ ] Update `docs/setup/COMPLETE_SETUP_GUIDE.md`
- [ ] Update `docs/testing/MANUAL_TESTING_GUIDE.md`
- [ ] Update `memory-bank/activeContext.md`
- [ ] Update `memory-bank/progress.md`
- [ ] Update `PROJECT_STRUCTURE.md`
- [ ] Create `docs/features/COMPENSATION_MANAGEMENT.md`
- [ ] Create `docs/features/SUB_ACCOUNT_PERMISSIONS.md`
- [ ] Create `docs/features/AGENT_ISO_HANDLING.md`

### Bug Fixes & Refinements
- [ ] Address issues from testing
- [ ] Improve error messages
- [ ] Add loading states
- [ ] Improve mobile responsiveness
- [ ] Add tooltips and help text

### Deployment
- [ ] Backend deployed to Railway
- [ ] Frontend deployed to Vercel
- [ ] Database migrations applied
- [ ] Environment variables updated
- [ ] Webhooks verified
- [ ] Monitoring in place

---

## 🎯 Success Criteria

### Phase Completion
- [ ] All functionality implemented
- [ ] All tests pass
- [ ] No critical bugs
- [ ] Documentation updated
- [ ] Code reviewed
- [ ] Deployed to production

### Overall Project
- [ ] All 10 phases completed
- [ ] All requirements met
- [ ] System stable in production
- [ ] User acceptance testing passed
- [ ] Documentation complete

---

## 📝 Notes

### Open Questions
- [ ] Exact Zoho field name for "Partner Type"
- [ ] Confirm "Send to Motion" stage exists
- [ ] Zoho state field values
- [ ] Production domain (deferred)

### Blockers
*Record any blockers here as they arise*

### Decisions Log
*Record key decisions made during implementation*

---

**Quick Links:**
- [Full Enhancement Plan](./PORTAL_ENHANCEMENT_PLAN.md)
- [Project Structure](../PROJECT_STRUCTURE.md)
- [Memory Bank](../memory-bank/)

**Status:** Ready to Begin  
**Next Action:** Start Phase 1 - Verification & Foundation




