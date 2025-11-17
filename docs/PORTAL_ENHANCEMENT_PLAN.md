# Partner Portal Enhancement Plan
**Project:** USA Payments Portal 2.0  
**Date Created:** November 14, 2025  
**Status:** Planning Phase  
**Prepared For:** Michael Kieffer, Norberto, Matthew Mickler

---

## 📋 Table of Contents
1. [Overview](#overview)
2. [Implementation Phases](#implementation-phases)
3. [Detailed Requirements](#detailed-requirements)
4. [Technical Specifications](#technical-specifications)
5. [Testing Strategy](#testing-strategy)
6. [Deployment Plan](#deployment-plan)

---

## Overview

### Goals
- Simplify lead submission forms
- Align status/stage terminology between Portal and Zoho CRM
- Implement sub-account permission controls
- Add compensation document management
- Improve user experience and navigation

### Approach
- **Phased Implementation**: Break into testable phases
- **Test Each Phase**: Verify functionality before proceeding
- **Production Testing**: Use production environment for validation
- **Documentation**: Update all docs to reflect changes

### Key Constraints
- No assumptions - all requirements clarified
- Backward compatibility with existing data
- Maintain Zoho CRM sync integrity
- Test thoroughly at each phase

---

## Implementation Phases

### **Phase 1: Verification & Foundation** ⚙️
**Goal:** Verify current system health and prepare foundation for changes

**Tasks:**
1. Verify all webhooks working correctly (partner, contact, lead-status, deal)
2. Test bi-directional sync (Portal → Zoho, Zoho → Portal)
3. Verify daily sync reliability (webhook-based real-time sync)
4. Document current Zoho field mappings
5. Pull and document Zoho "State" field values for dropdown
6. Verify Zoho API stage names (check "Send to Motion" existence)
7. Create database backup before any changes

**Deliverables:**
- System health report
- Current field mapping documentation
- Zoho API field reference document

**Testing:**
- Manual webhook trigger tests
- End-to-end sync verification
- Database query validation

---

### **Phase 2: Lead Form Simplification** 📝
**Goal:** Replace complex lead form with simplified version

#### **2.1: Backend Changes**

**Database:**
- No schema changes needed (existing fields support simplified form)
- Verify `lander_message` field exists in `leads` table

**API Endpoints:**
- Update `POST /api/leads` validation schema
- Remove required validation for removed fields
- Add auto-population logic for `lead_source` (partner name)
- Update URL field validation (accept without https://, auto-prepend if missing)

**Files to Modify:**
- `backend/src/routes/leads.ts`
- `backend/src/services/zohoService.ts` (field mapping)

#### **2.2: Frontend Changes**

**Lead Form Component:**
- Simplify to 6 fields only:
  1. **Business Name** (text, required)
  2. **Contact Name** (text, required)
  3. **Email** (email, required)
  4. **Phone Number** (tel, required)
  5. **State** (dropdown, required) - Pull values from Zoho
  6. **Additional Information** (textarea, optional) - Maps to `lander_message`

**Removed Fields:**
- Annual Revenue
- Number of Employees
- Lead Source (auto-populated with partner name)

**Field Specifications:**
- **State Dropdown:** Populate from Zoho CRM state values
- **Lead Source:** Auto-set to logged-in partner's company name (hidden field)
  - For sub-accounts: Use parent partner's company name
- **URL Validation:** Accept any format, auto-prepend "https://" if protocol missing
- **Additional Information:** Character limit: 1000 chars

**Files to Modify:**
- `frontend/src/app/leads/new/page.tsx` (or create new simplified form)
- `frontend/src/components/leads/LeadForm.tsx`
- `frontend/src/services/leadService.ts`

#### **2.3: Zoho Integration**

**Field Mapping (Portal → Zoho):**
```javascript
{
  "Business Name": "Company",
  "Contact Name": "Full_Name", // or split to First_Name/Last_Name
  "Email": "Email",
  "Phone Number": "Phone",
  "State": "State",
  "Additional Information": "Lander_Message",
  "Lead Source": "Lead_Source" // Auto: Partner company name
}
```

**Testing Checklist:**
- [ ] Form validation works correctly
- [ ] Required fields enforced
- [ ] State dropdown populated from Zoho
- [ ] Lead source auto-populated correctly
- [ ] URL validation accepts all formats
- [ ] Submission creates lead in Portal DB
- [ ] Lead syncs to Zoho CRM correctly
- [ ] All fields map to correct Zoho fields

---

### **Phase 3: Lead Status Alignment** 🔄
**Goal:** Simplify lead status display to 5 user-friendly terms

#### **3.1: Status Mapping Configuration**

**Portal Display → Zoho CRM Mapping:**

| Portal Display | Zoho Status | Direction |
|---------------|-------------|-----------|
| Pre-Vet / New Lead | Lead | Bidirectional |
| Contacted | Contacted | Bidirectional |
| Sent for Signature / Submitted | Application Submitted | Bidirectional |
| Approved | Approved | Bidirectional |
| Declined | Declined | Bidirectional |
| Dead / Withdrawn | Lost | Bidirectional |

**Implementation Notes:**
- "Pre-Vet / New Lead" and "Sent for Signature / Submitted" are **two ways of calling the same thing** (single status, two display names)
- "Approved" and "Declined" are **opposite statuses** (show one OR the other, not combined)
- Bidirectional means:
  - Portal sends simplified term → Backend maps to Zoho field
  - Zoho sends status → Backend maps to simplified display term

#### **3.2: Backend Implementation**

**Create Status Mapping Service:**
```typescript
// backend/src/services/statusMappingService.ts

const LEAD_STATUS_MAP = {
  // Portal → Zoho
  'Pre-Vet / New Lead': 'Lead',
  'Contacted': 'Contacted',
  'Sent for Signature / Submitted': 'Application Submitted',
  'Approved': 'Approved',
  'Declined': 'Declined',
  'Dead / Withdrawn': 'Lost',
  
  // Zoho → Portal (reverse mapping)
  'Lead': 'Pre-Vet / New Lead',
  'Contacted': 'Contacted',
  'Application Submitted': 'Sent for Signature / Submitted',
  'Approved': 'Approved',
  'Declined': 'Declined',
  'Lost': 'Dead / Withdrawn'
};

export function mapStatusToZoho(portalStatus: string): string;
export function mapStatusFromZoho(zohoStatus: string): string;
```

**Update Webhook Handler:**
- Modify `POST /api/webhooks/zoho/lead-status`
- Apply status mapping when receiving from Zoho
- Store both Portal display status and Zoho status

**Update Lead API:**
- Modify `PATCH /api/leads/:id/status`
- Apply status mapping when sending to Zoho

**Files to Modify:**
- `backend/src/services/statusMappingService.ts` (NEW)
- `backend/src/routes/webhooks.ts`
- `backend/src/routes/leads.ts`
- `backend/src/services/zohoService.ts`

#### **3.3: Frontend Implementation**

**Status Display:**
- Update all lead status displays to show Portal terminology
- Status dropdown shows only 6 simplified options
- Status badges styled by category (success, warning, danger, etc.)

**Files to Modify:**
- `frontend/src/components/leads/LeadStatusBadge.tsx`
- `frontend/src/app/leads/page.tsx` (list view)
- `frontend/src/app/leads/[id]/page.tsx` (detail view)

#### **3.4: Data Migration**

**Migrate Existing Leads:**
```sql
-- Update existing lead statuses to new display format
UPDATE leads 
SET status = CASE 
  WHEN status = 'Lead' THEN 'Pre-Vet / New Lead'
  WHEN status = 'Contacted' THEN 'Contacted'
  WHEN status = 'Application Submitted' THEN 'Sent for Signature / Submitted'
  WHEN status = 'Approved' THEN 'Approved'
  WHEN status = 'Declined' THEN 'Declined'
  WHEN status = 'Lost' THEN 'Dead / Withdrawn'
  ELSE status
END;
```

**Testing Checklist:**
- [ ] Status mapping works Portal → Zoho
- [ ] Status mapping works Zoho → Portal
- [ ] Existing leads display correct status
- [ ] Status updates sync correctly
- [ ] Status history preserved
- [ ] Dropdown shows only 6 options
- [ ] Status badges display correctly

---

### **Phase 4: Lead List Enhancements** 📊
**Goal:** Add pagination, search, and refresh functionality

#### **4.1: Pagination**

**Backend:**
- Update `GET /api/leads` to support pagination
- Add query parameters: `page`, `limit`, `sortBy`, `sortOrder`
- Default: 10 leads per page
- Return total count for pagination UI

**Frontend:**
- Add pagination component (1, 2, 3... buttons, no infinite scroll)
- Show "Showing X-Y of Z leads"
- Add page size selector (10, 25, 50)

#### **4.2: Search & Filters**

**Backend:**
- Add search query parameter to `GET /api/leads`
- Search across: Name, Company, Email
- Add filter parameters: `status`, `dateFrom`, `dateTo`

**Frontend:**
- Add search input with debounce (300ms)
- Add filter dropdowns:
  - Status filter (all 6 statuses + "All")
  - Date range filter (Date Created)
- Clear filters button

#### **4.3: Refresh Button**

**Implementation:**
- Add "Refresh" button on leads list page
- Button visible to **all users** (partners and sub-accounts)
- Button triggers manual sync from Zoho
- Show loading spinner during refresh
- Show success/error toast message

**Backend:**
- Create `POST /api/leads/sync` endpoint
- Fetch latest leads from Zoho for current partner
- Update local database
- Return sync results (new, updated, unchanged)

**Files to Modify:**
- `backend/src/routes/leads.ts` (pagination, search, sync endpoint)
- `frontend/src/app/leads/page.tsx` (pagination, search UI, refresh button)
- `frontend/src/components/leads/LeadFilters.tsx` (NEW)
- `frontend/src/components/ui/Pagination.tsx` (NEW)

**Testing Checklist:**
- [ ] Pagination works correctly
- [ ] Page size selector works
- [ ] Search finds leads by name, company, email
- [ ] Status filter works
- [ ] Date range filter works
- [ ] Refresh button syncs from Zoho
- [ ] Loading states display correctly
- [ ] All users can see refresh button

---

### **Phase 5: Deal Management** 💼
**Goal:** Implement deal tracking with simplified stage display

#### **5.1: Deal Stage Mapping**

**Portal Display (5 stages) → Zoho Stages (13) Mapping:**

| Portal Display | Zoho Stages Included |
|---------------|---------------------|
| **New Lead / Prevet** | New Deal, Pre-Vet |
| **Submitted** | Sent for Signature, Signed Application |
| **Underwriting** | Sent to Underwriting, App Pended |
| **Approved / Declined** | Approved, Declined, Conditionally Approved |
| **Closed** | Approved - Closed, Dead / Do Not Contact, Merchant Unresponsive, App Withdrawn |

**Implementation Notes:**
- "Approved / Declined" shows ONE status (Approved OR Declined), not combined
- Default stage for new deals: "New Lead / Prevet" (maps to "New Deal" in Zoho)
- Deals cannot be created in portal - they are leads that became deals in Zoho
- Check Zoho API for "Send to Motion" stage existence

#### **5.2: Backend Implementation**

**Create Stage Mapping Service:**
```typescript
// backend/src/services/stageMappingService.ts

const DEAL_STAGE_MAP = {
  // Zoho → Portal
  'New Deal': 'New Lead / Prevet',
  'Pre-Vet': 'New Lead / Prevet',
  'Sent for Signature': 'Submitted',
  'Signed Application': 'Submitted',
  'Sent to Underwriting': 'Underwriting',
  'App Pended': 'Underwriting',
  'Approved': 'Approved',
  'Declined': 'Declined',
  'Conditionally Approved': 'Approved',
  'Approved - Closed': 'Closed',
  'Dead / Do Not Contact': 'Closed',
  'Merchant Unresponsive': 'Closed',
  'App Withdrawn': 'Closed'
};

export function mapStageFromZoho(zohoStage: string): string;
export function getZohoStageColor(zohoStage: string): string;
```

**Update Deal Webhook:**
- Modify `POST /api/webhooks/zoho/deal`
- Apply stage mapping when receiving from Zoho
- Store both Portal display stage and Zoho stage
- Handle "Approval_Time_Stamp" field

**Deal Fields:**
- Remove "Amount" field from display
- Replace "Close Date" with "Approval Date" (from `Approval_Time_Stamp`)
- Show "Submitted By" field:
  - If submitted by sub-account: Show sub-account name
  - If submitted by main partner: Show partner name
  - If created in Zoho: Show "Submitted on ZOHO"

**Files to Modify:**
- `backend/src/services/stageMappingService.ts` (NEW)
- `backend/src/routes/webhooks.ts` (deal webhook)
- `backend/src/routes/deals.ts` (NEW - deal API endpoints)
- `backend/database/migrations/` (if schema changes needed)

#### **5.3: Frontend Implementation**

**Deals Page:**
- Create deals list page (`/deals`)
- Show deals with simplified 5-stage display
- Display fields:
  - Business Name
  - Contact Name
  - Stage (simplified)
  - Approval Date (from Zoho `Approval_Time_Stamp`)
  - Submitted By (sub-account/partner/ZOHO)
- Add pagination (10 per page)
- Add search and filters
- Add refresh button (all users)

**Deal Detail Page:**
- Show full deal information
- Stage history timeline
- Related lead information (if available)

**Files to Create:**
- `frontend/src/app/deals/page.tsx`
- `frontend/src/app/deals/[id]/page.tsx`
- `frontend/src/components/deals/DealCard.tsx`
- `frontend/src/components/deals/DealStageBadge.tsx`
- `frontend/src/services/dealService.ts`

**Testing Checklist:**
- [ ] Deals sync from Zoho correctly
- [ ] Stage mapping displays correctly
- [ ] Approval Date shows from Zoho field
- [ ] Submitted By shows correct attribution
- [ ] "Submitted on ZOHO" shows for Zoho-created deals
- [ ] Stage history tracked correctly
- [ ] Pagination and search work
- [ ] Refresh button syncs deals

---

### **Phase 6: Sub-Account Management** 👥
**Goal:** Implement sub-account permissions and controls

#### **6.1: Permission System**

**Sub-Account Permissions:**
- ✅ **Can submit leads** (via portal)
- ✅ **Can view leads THEY submitted** (not other sub-accounts' or main partner's)
- ❌ **Cannot view deals** (or limited view?)
- ❌ **Cannot manage other sub-accounts**
- ❌ **Cannot access compensation section**

**Main Partner Permissions:**
- ✅ **Can view all leads** (own + all sub-accounts)
- ✅ **Can view all deals** (own + all sub-accounts)
- ✅ **Can create sub-accounts** (via Zoho webhook only)
- ✅ **Can deactivate sub-accounts**
- ✅ **Can edit sub-account details** (email, name)
- ✅ **Can reset sub-account passwords**

#### **6.2: Database Changes**

**Update Users Table:**
```sql
-- Add permission fields if not exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS can_submit_leads BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS can_view_all_partner_leads BOOLEAN DEFAULT false;
```

**Update RLS Policies:**
```sql
-- Sub-accounts can only see their own submitted leads
CREATE POLICY "sub_accounts_own_leads" ON leads
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM users 
      WHERE role = 'sub_account' 
      AND created_by = auth.uid()
    )
  );

-- Main partners can see all partner leads
CREATE POLICY "partners_all_leads" ON leads
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM users 
      WHERE role = 'admin' 
      AND partner_id = leads.partner_id
    )
  );
```

#### **6.3: Backend Implementation**

**Sub-Account Management Endpoints:**
- `GET /api/partners/:id/sub-accounts` - List sub-accounts
- `PATCH /api/sub-accounts/:id` - Update sub-account (name, email)
- `PATCH /api/sub-accounts/:id/deactivate` - Deactivate sub-account
- `PATCH /api/sub-accounts/:id/activate` - Reactivate sub-account
- `POST /api/sub-accounts/:id/reset-password` - Send password reset email

**Permission Middleware:**
```typescript
// backend/src/middleware/permissions.ts
export const requireMainPartner = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Main partner access required' });
  }
  next();
};

export const requireCanSubmitLeads = (req, res, next) => {
  if (!req.user.can_submit_leads) {
    return res.status(403).json({ error: 'Lead submission not permitted' });
  }
  next();
};
```

**Files to Modify:**
- `backend/src/routes/partners.ts` (sub-account management)
- `backend/src/routes/leads.ts` (permission checks)
- `backend/src/middleware/permissions.ts` (NEW)
- `backend/database/migrations/` (RLS policy updates)

#### **6.4: Frontend Implementation**

**Sub-Accounts Page (Main Partner Only):**
- List all sub-accounts
- Show status (Active/Inactive)
- Actions per sub-account:
  - Edit details (modal)
  - Deactivate/Activate toggle
  - Reset password button
- Add sub-account button (disabled with tooltip: "Sub-accounts created via Zoho CRM")

**Lead Filtering by Permission:**
- Sub-accounts: Show only leads they created
- Main partners: Show all partner leads with "Submitted By" column

**Files to Create:**
- `frontend/src/app/sub-accounts/page.tsx`
- `frontend/src/components/sub-accounts/SubAccountCard.tsx`
- `frontend/src/components/sub-accounts/EditSubAccountModal.tsx`
- `frontend/src/services/subAccountService.ts`

**Testing Checklist:**
- [ ] Sub-accounts created via Zoho webhook
- [ ] Sub-accounts can only see their own leads
- [ ] Main partners can see all partner leads
- [ ] Deactivate/activate works
- [ ] Edit sub-account details works
- [ ] Reset password sends email
- [ ] Permission checks enforced on backend
- [ ] UI hides restricted features correctly

---

### **Phase 7: Agent/ISO & Strategic Partner Handling** 🤝
**Goal:** Implement special handling for Agent/ISO and Strategic Partner user types

#### **7.1: User Type Configuration**

**Zoho User Types:**
1. **Strategic Partners** - Can submit leads via portal
2. **Agent/ISO** - Cannot submit leads via portal, view assigned leads only

**Implementation:**
- Pull "Partner Type" from Zoho (field name: TBD - check Zoho API)
- Store in `partners` table: `partner_type` field
- Possible values: `'strategic_partner'`, `'agent_iso'`, `'standard'` (default)

#### **7.2: Database Changes**

```sql
-- Add partner_type to partners table
ALTER TABLE partners ADD COLUMN IF NOT EXISTS partner_type TEXT DEFAULT 'standard';

-- Add assigned_to field to leads (for Agent/ISO assignments)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_partner_id UUID REFERENCES partners(id);
```

#### **7.3: Backend Implementation**

**Partner Type Logic:**
- When partner webhook receives partner data, store `partner_type`
- When lead webhook receives lead with Agent/ISO assignment, store `assigned_partner_id`
- Agent/ISO partners can only view leads assigned to them (not submit)

**API Changes:**
- `GET /api/leads` - Filter by `assigned_partner_id` for Agent/ISO
- `POST /api/leads` - Block submission for Agent/ISO partners
- Update lead form visibility based on `partner_type`

**Files to Modify:**
- `backend/src/routes/webhooks.ts` (partner webhook)
- `backend/src/routes/leads.ts` (permission checks)
- `backend/database/migrations/` (schema changes)

#### **7.4: Frontend Implementation**

**Conditional UI:**
- Agent/ISO partners:
  - Hide "Submit Lead" button
  - Show "Assigned Leads" section
  - Display message: "Leads are submitted to Zoho CRM and assigned to you"
- Strategic Partners:
  - Show full lead submission form
  - Show all standard features

**Files to Modify:**
- `frontend/src/app/leads/page.tsx` (conditional rendering)
- `frontend/src/app/leads/new/page.tsx` (access control)
- `frontend/src/components/layout/DashboardLayout.tsx` (navigation)

**Testing Checklist:**
- [ ] Partner type synced from Zoho
- [ ] Agent/ISO cannot access lead submission
- [ ] Agent/ISO can view assigned leads
- [ ] Strategic Partners can submit leads
- [ ] UI adapts based on partner type
- [ ] Lead assignment from Zoho works

---

### **Phase 8: Compensation Document Management** 💰
**Goal:** Replace compensation display with document upload system

#### **8.1: Database Schema**

```sql
-- Create compensation_documents table
CREATE TABLE compensation_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID REFERENCES partners(id) NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL, -- .xls, .xlsx, .csv
  file_url TEXT NOT NULL, -- Supabase Storage URL
  upload_date TIMESTAMP DEFAULT NOW(),
  uploaded_by UUID REFERENCES users(id),
  month_year TEXT, -- e.g., "2025-11" for November 2025
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for fast lookups
CREATE INDEX idx_compensation_partner ON compensation_documents(partner_id);
CREATE INDEX idx_compensation_date ON compensation_documents(upload_date);
```

#### **8.2: File Storage Setup**

**Supabase Storage:**
- Create bucket: `compensation-documents`
- Set up RLS policies:
  - Partners can upload to their own folder
  - Partners can only read their own documents
- Folder structure: `{partner_id}/{year}/{month}/{filename}`
- Max file size: 30MB
- Allowed types: `.xls`, `.xlsx`, `.csv`

**Storage Policies:**
```sql
-- Partners can upload their own documents
CREATE POLICY "partners_upload_own" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'compensation-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Partners can read their own documents
CREATE POLICY "partners_read_own" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'compensation-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

#### **8.3: Backend Implementation**

**API Endpoints:**
- `POST /api/compensation/upload` - Upload document
  - Validate file type (.xls, .xlsx, .csv)
  - Validate file size (max 30MB)
  - Upload to Supabase Storage
  - Create database record
- `GET /api/compensation/documents` - List documents
  - Support date range filter
  - Pagination (10 per page)
  - Return download URLs
- `GET /api/compensation/documents/:id/download` - Download document
  - Generate signed URL
  - Log download activity

**File Upload Logic:**
```typescript
// backend/src/routes/compensation.ts
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  const { file } = req;
  const { month_year, notes } = req.body;
  const partnerId = req.user.partnerId;
  
  // Validate file type
  const allowedTypes = ['.xls', '.xlsx', '.csv'];
  if (!allowedTypes.some(type => file.originalname.endsWith(type))) {
    return res.status(400).json({ error: 'Invalid file type' });
  }
  
  // Validate file size (30MB)
  if (file.size > 30 * 1024 * 1024) {
    return res.status(400).json({ error: 'File too large (max 30MB)' });
  }
  
  // Upload to Supabase Storage
  const filePath = `${partnerId}/${new Date().getFullYear()}/${month_year}/${file.originalname}`;
  const { data, error } = await supabase.storage
    .from('compensation-documents')
    .upload(filePath, file.buffer);
  
  if (error) throw error;
  
  // Create database record
  const { data: doc } = await supabase
    .from('compensation_documents')
    .insert({
      partner_id: partnerId,
      file_name: file.originalname,
      file_size: file.size,
      file_type: path.extname(file.originalname),
      file_url: data.path,
      month_year,
      notes,
      uploaded_by: req.user.id
    })
    .select()
    .single();
  
  res.json({ success: true, document: doc });
});
```

**Files to Create:**
- `backend/src/routes/compensation.ts` (NEW)
- `backend/database/migrations/016_compensation_documents.sql` (NEW)

#### **8.4: Frontend Implementation**

**Compensation Page:**
- Replace existing compensation display
- Show document upload section:
  - File input (drag & drop + click to browse)
  - Month/Year selector
  - Notes field (optional)
  - Upload button
- Show document history table:
  - Columns: File Name, Month/Year, Upload Date, Size, Actions
  - Date range filter
  - Pagination (10 per page)
  - Download button per document
- Show latest uploaded document prominently

**Files to Create:**
- `frontend/src/app/compensation/page.tsx` (NEW)
- `frontend/src/components/compensation/DocumentUpload.tsx` (NEW)
- `frontend/src/components/compensation/DocumentList.tsx` (NEW)
- `frontend/src/services/compensationService.ts` (NEW)

**Testing Checklist:**
- [ ] File upload works (.xls, .xlsx, .csv)
- [ ] File type validation works
- [ ] File size validation works (30MB max)
- [ ] Files stored in Supabase Storage
- [ ] Database record created
- [ ] Document list displays correctly
- [ ] Date range filter works
- [ ] Pagination works
- [ ] Download generates signed URL
- [ ] Partners can only see their own documents
- [ ] Multiple uploads allowed
- [ ] Documents never deleted

---

### **Phase 9: Referral Form Logic** 📋
**Goal:** Implement conditional referral form based on partner type

#### **9.1: Requirements**

**Logic:**
- **Agent/ISO Partners:** Hide/disable referral form entirely
- **Strategic Partners:** Show simplified referral form
- **Standard Partners:** Show simplified referral form

**Referral Form Fields (Same as Lead Form):**
1. Business Name (required)
2. Contact Name (required)
3. Email (required)
4. Phone Number (required)
5. State (dropdown, required)
6. Additional Information (textarea, optional) - Maps to `Lander_Message`

#### **9.2: Implementation**

**Backend:**
- Referral form uses same endpoint as lead submission: `POST /api/leads`
- Add `source` field: `'referral'` vs `'direct'`
- Same validation and Zoho sync logic

**Frontend:**
- Add referral form page: `/referrals/new`
- Check partner type before rendering
- If Agent/ISO: Show message "Referral submission not available for your account type"
- If Strategic/Standard: Show referral form (identical to lead form)

**Files to Create:**
- `frontend/src/app/referrals/new/page.tsx` (NEW)
- `frontend/src/components/referrals/ReferralForm.tsx` (NEW)

**Testing Checklist:**
- [ ] Agent/ISO partners cannot access referral form
- [ ] Strategic partners can submit referrals
- [ ] Standard partners can submit referrals
- [ ] Referral form fields match lead form
- [ ] Referrals sync to Zoho with correct source
- [ ] Referrals appear in leads list

---

### **Phase 10: Final Polish & Testing** ✨
**Goal:** Final testing, bug fixes, and documentation updates

#### **10.1: Comprehensive Testing**

**End-to-End Tests:**
1. Partner provisioning (Zoho → Portal)
2. Sub-account creation (Zoho → Portal)
3. Lead submission (Portal → Zoho)
4. Lead status update (Zoho → Portal)
5. Deal creation (Zoho → Portal)
6. Deal stage update (Zoho → Portal)
7. Sub-account permissions
8. Document upload and retrieval
9. Referral submission
10. Agent/ISO lead assignment

**Performance Tests:**
- Load testing on lead list (1000+ leads)
- Pagination performance
- Search performance
- File upload performance (large files)

**Security Tests:**
- RLS policy enforcement
- Permission checks
- File access controls
- XSS/CSRF protection

#### **10.2: Documentation Updates**

**Update Files:**
- `docs/README.md` - Add new features
- `docs/setup/COMPLETE_SETUP_GUIDE.md` - Update setup steps
- `docs/testing/MANUAL_TESTING_GUIDE.md` - Add new test cases
- `memory-bank/activeContext.md` - Update current state
- `memory-bank/progress.md` - Document completion
- `PROJECT_STRUCTURE.md` - Add new files/routes

**Create New Docs:**
- `docs/features/COMPENSATION_MANAGEMENT.md`
- `docs/features/SUB_ACCOUNT_PERMISSIONS.md`
- `docs/features/AGENT_ISO_HANDLING.md`

#### **10.3: Bug Fixes & Refinements**

- Address any issues found during testing
- Improve error messages
- Add loading states
- Improve mobile responsiveness
- Add tooltips and help text

---

## Technical Specifications

### API Endpoints Summary

#### New Endpoints
```
# Leads
GET    /api/leads?page=1&limit=10&search=&status=&dateFrom=&dateTo=
POST   /api/leads/sync

# Deals
GET    /api/deals?page=1&limit=10&search=&stage=&dateFrom=&dateTo=
GET    /api/deals/:id
POST   /api/deals/sync

# Sub-Accounts
GET    /api/partners/:id/sub-accounts
PATCH  /api/sub-accounts/:id
PATCH  /api/sub-accounts/:id/deactivate
PATCH  /api/sub-accounts/:id/activate
POST   /api/sub-accounts/:id/reset-password

# Compensation
POST   /api/compensation/upload
GET    /api/compensation/documents?page=1&limit=10&dateFrom=&dateTo=
GET    /api/compensation/documents/:id/download

# Referrals
POST   /api/referrals (uses /api/leads with source='referral')
```

#### Modified Endpoints
```
POST   /api/leads - Simplified validation, auto-populate lead_source
PATCH  /api/leads/:id/status - Status mapping
POST   /api/webhooks/zoho/partner - Store partner_type
POST   /api/webhooks/zoho/lead-status - Status mapping
POST   /api/webhooks/zoho/deal - Stage mapping, approval date
POST   /api/webhooks/zoho/contact - Sub-account permissions
```

### Database Schema Changes

```sql
-- Partners table
ALTER TABLE partners ADD COLUMN IF NOT EXISTS partner_type TEXT DEFAULT 'standard';

-- Users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS can_submit_leads BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS can_view_all_partner_leads BOOLEAN DEFAULT false;

-- Leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_partner_id UUID REFERENCES partners(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lander_message TEXT;

-- Deals table (if not exists)
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID REFERENCES partners(id) NOT NULL,
  zoho_deal_id TEXT UNIQUE,
  business_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  stage TEXT NOT NULL,
  zoho_stage TEXT, -- Original Zoho stage
  approval_date TIMESTAMP,
  submitted_by UUID REFERENCES users(id),
  submitted_by_type TEXT, -- 'partner', 'sub_account', 'zoho'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Deal stage history
CREATE TABLE IF NOT EXISTS deal_stage_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID REFERENCES deals(id) NOT NULL,
  old_stage TEXT,
  new_stage TEXT NOT NULL,
  changed_by TEXT,
  changed_at TIMESTAMP DEFAULT NOW()
);

-- Compensation documents
CREATE TABLE compensation_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID REFERENCES partners(id) NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  upload_date TIMESTAMP DEFAULT NOW(),
  uploaded_by UUID REFERENCES users(id),
  month_year TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Frontend Routes Summary

```
# New Routes
/deals                    - Deals list
/deals/[id]              - Deal detail
/sub-accounts            - Sub-account management (main partner only)
/compensation            - Compensation document management
/referrals/new           - Referral submission form

# Modified Routes
/leads                   - Add pagination, search, filters, refresh
/leads/new               - Simplified form
/leads/[id]              - Updated status display
```

---

## Testing Strategy

### Testing Approach
- **Phase-by-phase testing**: Test each phase before moving to next
- **Production environment**: Use production for testing (as agreed)
- **Manual testing**: Follow test checklists for each phase
- **Automated testing**: Create test scripts where applicable

### Test Environments
- **Production**: Primary testing environment
- **Local Development**: Initial development and debugging

### Test Data
- **Real Zoho data**: Use actual Zoho CRM data for testing
- **Test partners**: Create test partner accounts
- **Test sub-accounts**: Create test sub-accounts via Zoho

### Testing Checklist Template

For each phase:
```
[ ] Functionality works as specified
[ ] Error handling works correctly
[ ] Loading states display properly
[ ] Success/error messages clear
[ ] Mobile responsive
[ ] No console errors
[ ] No linter errors
[ ] Database queries optimized
[ ] RLS policies enforced
[ ] Documentation updated
```

---

## Deployment Plan

### Pre-Deployment
1. Create database backup
2. Document current system state
3. Verify all tests pass
4. Update environment variables if needed

### Deployment Process
1. **Backend Deployment:**
   - Push to Railway
   - Run database migrations
   - Verify health endpoint
   - Check logs for errors

2. **Frontend Deployment:**
   - Push to Vercel
   - Verify build success
   - Test production URL
   - Check console for errors

3. **Post-Deployment:**
   - Test critical flows
   - Monitor error logs
   - Verify webhooks working
   - Check Zoho sync

### Rollback Plan
- Keep previous Railway deployment available
- Database backup ready to restore
- Document rollback steps

---

## Risk Mitigation

### Identified Risks
1. **Data Loss**: Mitigated by database backups before each phase
2. **Sync Failures**: Mitigated by thorough webhook testing
3. **Permission Issues**: Mitigated by RLS policy testing
4. **Performance**: Mitigated by pagination and indexing

### Monitoring
- Railway logs for backend errors
- Vercel logs for frontend errors
- Supabase logs for database issues
- Zoho webhook logs for sync issues

---

## Success Criteria

### Phase Completion Criteria
Each phase is complete when:
- ✅ All functionality implemented
- ✅ All tests pass
- ✅ No critical bugs
- ✅ Documentation updated
- ✅ Code reviewed
- ✅ Deployed to production

### Overall Project Success
- ✅ All 10 phases completed
- ✅ All requirements met
- ✅ System stable in production
- ✅ User acceptance testing passed
- ✅ Documentation complete

---

## Timeline Estimate

| Phase | Estimated Time | Dependencies |
|-------|---------------|--------------|
| Phase 1: Verification | 1-2 days | None |
| Phase 2: Lead Form | 2-3 days | Phase 1 |
| Phase 3: Status Alignment | 2-3 days | Phase 2 |
| Phase 4: Lead List | 2-3 days | Phase 3 |
| Phase 5: Deal Management | 3-4 days | Phase 3 |
| Phase 6: Sub-Accounts | 3-4 days | Phase 1 |
| Phase 7: Agent/ISO | 2-3 days | Phase 6 |
| Phase 8: Compensation | 3-4 days | Phase 1 |
| Phase 9: Referral Form | 1-2 days | Phase 2, 7 |
| Phase 10: Final Polish | 2-3 days | All phases |

**Total Estimated Time:** 21-31 days (3-4.5 weeks)

*Note: Timeline assumes one developer working full-time. Adjust based on team size and availability.*

---

## Notes & Decisions

### Key Decisions Made
1. **Phased approach**: Break into 10 testable phases
2. **Production testing**: Use production environment for testing
3. **No assumptions**: All requirements clarified with stakeholders
4. **Backward compatibility**: Migrate existing data to new formats
5. **Webhook-only sub-accounts**: Sub-accounts created via Zoho only

### Open Questions
- [ ] Exact Zoho field name for "Partner Type"
- [ ] Confirm "Send to Motion" stage exists in Zoho
- [ ] Zoho state field values for dropdown
- [ ] Production domain for launch (deferred)

### Future Enhancements (Out of Scope)
- Advanced analytics and reporting
- Email notification system
- Real-time Socket.IO updates
- Mobile app
- Bulk operations
- API documentation portal

---

**Document Version:** 1.0  
**Last Updated:** November 14, 2025  
**Status:** Ready for Implementation  
**Next Step:** Begin Phase 1 - Verification & Foundation




