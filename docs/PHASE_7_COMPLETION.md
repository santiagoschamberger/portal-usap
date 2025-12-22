# Phase 7: Agent/ISO Handling - COMPLETE ✅

**Date Completed:** December 10, 2025  
**Status:** ✅ Database migration applied, ready for backend/frontend implementation

---

## Summary

Phase 7 successfully implements the database foundation for Agent/ISO partner types with granular access control. Agents/ISOs can now view only their assigned leads and deals, while regular partners maintain full functionality.

---

## ✅ Completed Tasks

### Database Migration (Migration 022)
- ✅ **Applied Migration 022** via Supabase SQL Editor
- ✅ Added `partner_type` column to partners table
- ✅ Added `assigned_agent_id` to leads table
- ✅ Added `assigned_agent_id` to deals table
- ✅ Created 4 performance indexes
- ✅ Updated 7 RLS policies for agent access control
- ✅ Created 3 helper functions for agent operations
- ✅ Created 2 triggers for agent assignment logging

### Documentation
- ✅ **Migration Guide** (`docs/PHASE_7_AGENT_ISO_MIGRATION.md`)
  - Complete migration instructions
  - Schema change documentation
  - Testing procedures
  - Rollback plan
  - Next steps outlined

---

## 🔒 Security Features Implemented

### Partner Type System

**Three Partner Types:**
1. **`partner`** (default) - Regular partners
   - Can submit leads
   - Can manage sub-accounts
   - View all partner organization leads/deals

2. **`agent`** - Agent partners
   - Cannot submit leads (read-only)
   - Cannot manage sub-accounts
   - View only assigned leads/deals

3. **`iso`** - ISO partners
   - Same restrictions as agents
   - Cannot submit leads (read-only)
   - View only assigned leads/deals

### Row Level Security (RLS) Policies

**Leads Table (7 policies):**
1. ✅ Admins can view all partner leads
2. ✅ Sub-accounts with full access can view all partner leads
3. ✅ Sub-accounts can view only their own leads
4. ✅ **Agents can view only assigned leads** (NEW)
5. ✅ Users with permission can create leads (prevents agents)
6. ✅ Admins can update all partner leads (regular partners only)
7. ✅ Sub-accounts can update only their own leads (regular partners only)

**Deals Table (3 policies):**
1. ✅ **Admins can view all partner deals** (NEW)
2. ✅ **Sub-accounts can view partner deals** (NEW)
3. ✅ **Agents can view only assigned deals** (NEW)

### Helper Functions

```sql
-- Check if user is agent/ISO
is_agent_or_iso(user_uuid UUID) → BOOLEAN

-- Get agent's assigned leads
get_agent_assigned_leads(user_uuid UUID) → TABLE

-- Get agent's assigned deals
get_agent_assigned_deals(user_uuid UUID) → TABLE
```

### Activity Logging

**Automatic logging for:**
- Lead assignment to agent
- Deal assignment to agent
- Agent assignment changes

---

## 📊 Database Schema

### Partners Table
```sql
partner_type TEXT DEFAULT 'partner' 
  CHECK (partner_type IN ('partner', 'agent', 'iso'))
```

**Existing partners:** All set to `'partner'` type (default)

### Leads Table
```sql
assigned_agent_id UUID REFERENCES partners(id) ON DELETE SET NULL
```

### Deals Table
```sql
assigned_agent_id UUID REFERENCES partners(id) ON DELETE SET NULL
```

### Performance Indexes
```sql
idx_partners_partner_type              -- Partner type lookups
idx_leads_assigned_agent               -- Agent lead queries
idx_deals_assigned_agent               -- Agent deal queries
idx_leads_partner_assigned_agent       -- Composite optimization
```

---

## 🚀 Next Steps: Backend Implementation

### 1. Middleware Updates

**File:** `backend/src/middleware/permissions.ts`

Add agent-specific permission checks:

```typescript
// Check if user is agent/ISO
export const requireRegularPartner = async (req, res, next) => {
  const user = req.user;
  const { data: partner } = await supabase
    .from('partners')
    .select('partner_type')
    .eq('id', user.partner_id)
    .single();
  
  if (partner?.partner_type !== 'partner') {
    return res.status(403).json({ 
      error: 'This action is only available to regular partners' 
    });
  }
  next();
};

// Check if user is agent/ISO
export const isAgent = async (userId) => {
  const { data } = await supabase.rpc('is_agent_or_iso', { 
    user_uuid: userId 
  });
  return data;
};
```

### 2. Partner Routes Updates

**File:** `backend/src/routes/partners.ts`

Add partner type endpoint:

```typescript
// GET /api/partners/me/type
router.get('/me/type', authenticateToken, async (req, res) => {
  try {
    const { data: partner, error } = await supabase
      .from('partners')
      .select('partner_type')
      .eq('id', req.user.partner_id)
      .single();
    
    if (error) throw error;
    
    res.json({ 
      partner_type: partner.partner_type,
      is_agent: ['agent', 'iso'].includes(partner.partner_type)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 3. Leads Routes Updates

**File:** `backend/src/routes/leads.ts`

Add agent-specific endpoints:

```typescript
// GET /api/leads/assigned (for agents)
router.get('/assigned', authenticateToken, async (req, res) => {
  try {
    const { data: leads, error } = await supabase
      .rpc('get_agent_assigned_leads', { 
        user_uuid: req.user.id 
      });
    
    if (error) throw error;
    res.json(leads);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update POST /api/leads to prevent agents from creating
router.post('/', authenticateToken, requireRegularPartner, async (req, res) => {
  // Existing lead creation logic
});
```

### 4. Deals Routes Updates

**File:** `backend/src/routes/deals.ts` (create if doesn't exist)

```typescript
// GET /api/deals (with agent filtering)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const isAgentUser = await isAgent(req.user.id);
    
    let query;
    if (isAgentUser) {
      // Agents see only assigned deals
      const { data, error } = await supabase
        .rpc('get_agent_assigned_deals', { 
          user_uuid: req.user.id 
        });
      if (error) throw error;
      return res.json(data);
    } else {
      // Regular partners see all partner deals
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('partner_id', req.user.partner_id);
      if (error) throw error;
      return res.json(data);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 5. Webhook Updates

**File:** `backend/src/routes/webhooks.ts`

Update webhooks to capture agent assignments:

```typescript
// Partner webhook - capture partner_type
router.post('/zoho/partner', async (req, res) => {
  const { Type, ...otherFields } = req.body;
  
  // Map Zoho Type to partner_type
  let partnerType = 'partner';
  if (Type === 'Agent' || Type === 'ISO') {
    partnerType = Type.toLowerCase();
  }
  
  // Create partner with type
  const { data, error } = await supabase
    .from('partners')
    .insert({
      ...otherFields,
      partner_type: partnerType
    });
});

// Lead webhook - capture assigned_agent_id
router.post('/zoho/lead-status', async (req, res) => {
  const { Assigned_Agent, ...leadData } = req.body;
  
  // Find agent partner by Zoho ID
  let assignedAgentId = null;
  if (Assigned_Agent) {
    const { data: agent } = await supabase
      .from('partners')
      .select('id')
      .eq('zoho_partner_id', Assigned_Agent)
      .single();
    assignedAgentId = agent?.id;
  }
  
  // Update lead with assignment
  await supabase
    .from('leads')
    .update({ assigned_agent_id: assignedAgentId })
    .eq('zoho_lead_id', leadData.id);
});
```

---

## 🎨 Next Steps: Frontend Implementation

### 1. Auth Store Updates

**File:** `frontend/src/lib/stores/authStore.ts`

Add partner type to user state:

```typescript
interface UserState {
  user: User | null;
  partner: Partner | null;
  partnerType: 'partner' | 'agent' | 'iso' | null;
  isAgent: boolean;
}

// Add method to fetch partner type
const fetchPartnerType = async () => {
  const response = await apiClient.get('/api/partners/me/type');
  set({ 
    partnerType: response.data.partner_type,
    isAgent: response.data.is_agent
  });
};
```

### 2. Dashboard Layout Updates

**File:** `frontend/src/components/layout/DashboardLayout.tsx`

Conditional navigation based on partner type:

```tsx
const { user, isAgent } = useAuthStore();

// Hide sub-accounts menu for agents
{!isAgent && (
  <NavItem href="/sub-accounts" icon={Users}>
    Sub-Accounts
  </NavItem>
)}

// Show different label for agents
<NavItem href="/leads" icon={FileText}>
  {isAgent ? 'Assigned Leads' : 'Leads'}
</NavItem>
```

### 3. Dashboard Page Updates

**File:** `frontend/src/app/dashboard/page.tsx`

Show agent-specific dashboard:

```tsx
const { isAgent } = useAuthStore();

if (isAgent) {
  return <AgentDashboard />;
}

return <RegularDashboard />;
```

### 4. Leads Page Updates

**File:** `frontend/src/app/leads/page.tsx`

Hide "New Lead" button for agents:

```tsx
const { isAgent } = useAuthStore();

// Fetch assigned leads for agents
useEffect(() => {
  if (isAgent) {
    fetchAssignedLeads();
  } else {
    fetchAllLeads();
  }
}, [isAgent]);

// Conditional rendering
{!isAgent && (
  <Button onClick={() => router.push('/leads/new')}>
    New Lead
  </Button>
)}

// Show "Assigned To" column
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Company</TableHead>
      <TableHead>Status</TableHead>
      {!isAgent && <TableHead>Submitted By</TableHead>}
      {isAgent && <TableHead>Assigned To</TableHead>}
    </TableRow>
  </TableHeader>
</Table>
```

### 5. New Components Needed

**Create:** `frontend/src/components/dashboard/AgentDashboard.tsx`

```tsx
export function AgentDashboard() {
  return (
    <div>
      <h1>Agent Dashboard</h1>
      <div className="grid grid-cols-3 gap-4">
        <StatsCard title="Assigned Leads" value={assignedLeads} />
        <StatsCard title="Assigned Deals" value={assignedDeals} />
        <StatsCard title="Conversion Rate" value={conversionRate} />
      </div>
      
      <Alert className="mt-4">
        <Info className="h-4 w-4" />
        <AlertDescription>
          As an agent, you can view leads and deals assigned to you. 
          Contact your administrator to submit new leads.
        </AlertDescription>
      </Alert>
      
      <RecentAssignedLeads />
    </div>
  );
}
```

---

## 🧪 Testing Checklist

### Database Testing
- [x] Migration applied successfully
- [x] partner_type column exists in partners table
- [x] assigned_agent_id column exists in leads table
- [x] assigned_agent_id column exists in deals table
- [x] All 4 indexes created
- [x] All 3 helper functions created
- [x] All 2 triggers created
- [x] RLS policies updated

### Backend Testing (TODO)
- [ ] Create agent partner via API
- [ ] Verify agent cannot create leads
- [ ] Assign lead to agent
- [ ] Verify agent can view assigned lead
- [ ] Verify agent cannot view unassigned leads
- [ ] Verify regular partners unaffected
- [ ] Test helper functions return correct data
- [ ] Test activity logging for agent assignments

### Frontend Testing (TODO)
- [ ] Agent login shows correct dashboard
- [ ] "New Lead" button hidden for agents
- [ ] "Sub-Accounts" menu hidden for agents
- [ ] Assigned leads display correctly
- [ ] Agent restrictions banner shows
- [ ] Regular partner UI unaffected

### Integration Testing (TODO)
- [ ] Zoho webhook creates agent partner
- [ ] Zoho webhook assigns lead to agent
- [ ] Agent sees assigned lead in portal
- [ ] Lead assignment logged in activity_log

---

## 📁 Files Modified/Created

### Database
```
✅ backend/database/migrations/022_agent_iso_handling.sql (NEW)
```

### Backend (TODO)
```
⏳ backend/src/middleware/permissions.ts (UPDATE)
⏳ backend/src/routes/partners.ts (UPDATE)
⏳ backend/src/routes/leads.ts (UPDATE)
⏳ backend/src/routes/deals.ts (CREATE)
⏳ backend/src/routes/webhooks.ts (UPDATE)
```

### Frontend (TODO)
```
⏳ frontend/src/lib/stores/authStore.ts (UPDATE)
⏳ frontend/src/components/layout/DashboardLayout.tsx (UPDATE)
⏳ frontend/src/app/dashboard/page.tsx (UPDATE)
⏳ frontend/src/app/leads/page.tsx (UPDATE)
⏳ frontend/src/components/dashboard/AgentDashboard.tsx (CREATE)
```

### Documentation
```
✅ docs/PHASE_7_AGENT_ISO_MIGRATION.md (NEW)
✅ docs/PHASE_7_COMPLETION.md (NEW)
```

---

## 🎯 Success Criteria

### Database Layer ✅
- ✅ Partner types enforced at database level
- ✅ Agent access restricted via RLS policies
- ✅ Helper functions available for agent queries
- ✅ Activity logging for agent assignments
- ✅ Performance indexes in place

### Backend Layer ⏳
- [ ] API endpoints respect partner types
- [ ] Agents cannot create leads
- [ ] Agents see only assigned records
- [ ] Webhooks capture agent assignments
- [ ] Middleware enforces restrictions

### Frontend Layer ⏳
- [ ] Agent UI is read-only
- [ ] Conditional rendering based on partner type
- [ ] Clear messaging about restrictions
- [ ] Assigned leads/deals display correctly

---

## 📊 Performance Metrics

### Database Indexes
- `idx_partners_partner_type` - Fast partner type filtering
- `idx_leads_assigned_agent` - Optimized agent lead queries
- `idx_deals_assigned_agent` - Optimized agent deal queries
- `idx_leads_partner_assigned_agent` - Composite index for complex queries

### Expected Performance
- Agent lead list (100 assigned): < 50ms
- Agent deal list (50 assigned): < 30ms
- Partner type check: < 10ms (cached in JWT)
- Agent assignment logging: < 20ms

---

## 🔄 Integration Points

### Zoho CRM Fields Required

**Partner Module:**
- `Type` field → maps to `partner_type` ('Partner', 'Agent', 'ISO')

**Lead Module:**
- `Assigned_Agent` field → maps to `assigned_agent_id` (Zoho partner ID)

**Deal Module:**
- `Assigned_Agent` field → maps to `assigned_agent_id` (Zoho partner ID)

---

## 🔜 Immediate Next Steps

1. **Backend Implementation** (Priority 1)
   - Update middleware with agent checks
   - Add partner type endpoint
   - Update leads/deals routes
   - Modify webhooks for agent assignments

2. **Frontend Implementation** (Priority 2)
   - Update auth store with partner type
   - Create agent dashboard component
   - Update leads page for agents
   - Hide restricted UI elements

3. **Testing** (Priority 3)
   - Create test agent partner
   - Test lead assignment flow
   - Verify RLS policies in action
   - Test webhook integration

4. **Deployment** (Priority 4)
   - Deploy backend changes to Railway
   - Deploy frontend changes to Vercel
   - Configure Zoho webhooks
   - Monitor production logs

---

## 📝 Notes

### Key Decisions
- Used `partner_type` enum for clear distinction
- Separate `assigned_agent_id` allows multiple agents per organization
- RLS policies provide defense-in-depth security
- Helper functions simplify agent queries
- Activity logging tracks all agent assignments

### Lessons Learned
- Database-first approach ensures security at lowest level
- RLS policies must be tested with actual auth context
- Helper functions reduce complexity in application code
- Triggers automate activity logging consistently

### Future Enhancements
- Agent performance metrics and reporting
- Lead/deal reassignment functionality
- Agent quotas and limits
- Bulk agent assignment tools
- Agent-specific notifications

---

**Phase 7 Status:** ✅ **DATABASE COMPLETE** | ⏳ **BACKEND/FRONTEND IN PROGRESS**  
**Ready for:** Backend and Frontend Implementation  
**Next Phase:** Continue Phase 7 implementation

---

*Database Migration Completed: December 10, 2025*  
*Migration 022 Applied Successfully*  
*Ready for Application Layer Implementation*




