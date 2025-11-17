# Implementation Checklist - Partner Portal Enhancements

**Quick Reference:** Track progress for each phase  
**Related Document:** [PORTAL_ENHANCEMENT_PLAN.md](./PORTAL_ENHANCEMENT_PLAN.md)  
**Last Updated:** November 14, 2025

---

## 📊 Overall Progress

- [x] Phase 1: Verification & Foundation ✅
- [ ] Phase 2: Lead Form Simplification
- [ ] Phase 3: Lead Status Alignment
- [ ] Phase 4: Lead List Enhancements
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

## Phase 2: Lead Form Simplification 📝

### Backend Tasks
- [ ] Update `POST /api/leads` validation schema
- [ ] Remove required validation for removed fields
- [ ] Add auto-population for `lead_source` (partner name)
- [ ] Update URL validation (auto-prepend https://)
- [ ] Update Zoho field mapping in `zohoService.ts`
- [ ] Test lead creation API
- [ ] Test Zoho sync with new fields

### Frontend Tasks
- [ ] Simplify lead form to 6 fields
- [ ] Add State dropdown (populate from Zoho)
- [ ] Add Additional Information textarea (1000 char limit)
- [ ] Remove Annual Revenue field
- [ ] Remove Number of Employees field
- [ ] Hide Lead Source field (auto-populated)
- [ ] Update form validation
- [ ] Test form submission
- [ ] Test mobile responsiveness

### Testing
- [ ] Form validation works
- [ ] Required fields enforced
- [ ] State dropdown populated
- [ ] Lead source auto-populated correctly
- [ ] URL validation accepts all formats
- [ ] Lead created in Portal DB
- [ ] Lead syncs to Zoho correctly
- [ ] All fields map correctly

### Files Modified
- [ ] `backend/src/routes/leads.ts`
- [ ] `backend/src/services/zohoService.ts`
- [ ] `frontend/src/app/leads/new/page.tsx`
- [ ] `frontend/src/components/leads/LeadForm.tsx`
- [ ] `frontend/src/services/leadService.ts`

---

## Phase 3: Lead Status Alignment 🔄

### Backend Tasks
- [ ] Create `statusMappingService.ts`
- [ ] Implement `mapStatusToZoho()` function
- [ ] Implement `mapStatusFromZoho()` function
- [ ] Update lead-status webhook with mapping
- [ ] Update `PATCH /api/leads/:id/status` with mapping
- [ ] Update Zoho service with status mapping
- [ ] Test bidirectional status mapping

### Frontend Tasks
- [ ] Update `LeadStatusBadge.tsx` component
- [ ] Update status dropdown (6 options only)
- [ ] Update leads list view
- [ ] Update lead detail view
- [ ] Add status badge styling
- [ ] Test status display

### Data Migration
- [ ] Create migration SQL script
- [ ] Test migration on backup
- [ ] Run migration on production
- [ ] Verify existing leads updated

### Testing
- [ ] Status mapping Portal → Zoho works
- [ ] Status mapping Zoho → Portal works
- [ ] Existing leads display correctly
- [ ] Status updates sync correctly
- [ ] Status history preserved
- [ ] Dropdown shows 6 options only
- [ ] Status badges styled correctly

### Files Modified
- [ ] `backend/src/services/statusMappingService.ts` (NEW)
- [ ] `backend/src/routes/webhooks.ts`
- [ ] `backend/src/routes/leads.ts`
- [ ] `backend/src/services/zohoService.ts`
- [ ] `frontend/src/components/leads/LeadStatusBadge.tsx`
- [ ] `frontend/src/app/leads/page.tsx`
- [ ] `frontend/src/app/leads/[id]/page.tsx`

---

## Phase 4: Lead List Enhancements 📊

### Backend Tasks
- [ ] Add pagination to `GET /api/leads`
- [ ] Add search query parameter
- [ ] Add filter parameters (status, date)
- [ ] Create `POST /api/leads/sync` endpoint
- [ ] Test pagination
- [ ] Test search functionality
- [ ] Test filters
- [ ] Test sync endpoint

### Frontend Tasks
- [ ] Add pagination component
- [ ] Add search input with debounce
- [ ] Add status filter dropdown
- [ ] Add date range filter
- [ ] Add "Refresh" button (visible to all)
- [ ] Add loading states
- [ ] Add success/error toasts
- [ ] Test pagination
- [ ] Test search
- [ ] Test filters
- [ ] Test refresh button

### Testing
- [ ] Pagination works (10 per page)
- [ ] Page size selector works
- [ ] Search finds by name/company/email
- [ ] Status filter works
- [ ] Date range filter works
- [ ] Refresh syncs from Zoho
- [ ] Loading states display
- [ ] All users see refresh button
- [ ] Mobile responsive

### Files Modified
- [ ] `backend/src/routes/leads.ts`
- [ ] `frontend/src/app/leads/page.tsx`
- [ ] `frontend/src/components/leads/LeadFilters.tsx` (NEW)
- [ ] `frontend/src/components/ui/Pagination.tsx` (NEW)

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




