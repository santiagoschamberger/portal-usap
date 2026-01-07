# Agent/ISO Assignment Guide

**How to Assign Leads and Deals to Agents/ISOs**

---

## 📋 Overview

Agents and ISOs have **read-only access** to view leads and deals assigned to them. All assignments are managed through **Zoho CRM** and automatically sync to the Partner Portal.

---

## 🎯 Assignment Process

### Method 1: Assign via Zoho CRM (Recommended)

#### For Leads

1. **Open Zoho CRM**
   - Navigate to the **Leads** module
   - Find the lead you want to assign

2. **Edit the Lead**
   - Click on the lead to open details
   - Find the **"Assigned Agent"** field
   - Select the agent/ISO partner from the dropdown

3. **Save Changes**
   - Click **Save**
   - Zoho will fire a webhook to the Partner Portal

4. **Automatic Sync**
   - Portal receives webhook at `/api/webhooks/zoho/lead-status`
   - Webhook extracts `Assigned_Agent` field
   - Portal looks up agent partner by Zoho ID
   - Updates `leads.assigned_agent_id` in database
   - Logs assignment in `activity_log`

5. **Agent Can Now View**
   - Agent logs into Partner Portal
   - Sees lead in "Assigned Leads" section
   - Can view all lead details (read-only)

#### For Deals

1. **Open Zoho CRM**
   - Navigate to the **Deals** module
   - Find the deal you want to assign

2. **Edit the Deal**
   - Click on the deal to open details
   - Find the **"Assigned Agent"** field
   - Select the agent/ISO partner from the dropdown

3. **Save Changes**
   - Click **Save**
   - Zoho will fire a webhook to the Partner Portal

4. **Automatic Sync**
   - Portal receives webhook at `/api/webhooks/zoho/deal`
   - Webhook extracts `Assigned_Agent` field
   - Portal looks up agent partner by Zoho ID
   - Updates `deals.assigned_agent_id` in database
   - Logs assignment in `activity_log`

5. **Agent Can Now View**
   - Agent logs into Partner Portal
   - Sees deal in "Assigned Deals" section
   - Can view all deal details (read-only)

---

## 🔧 Zoho CRM Field Setup

### Required Custom Fields

To enable agent assignment, ensure these fields exist in Zoho CRM:

#### Leads Module
```
Field Name: Assigned Agent
Field Type: Lookup (to Vendors module)
API Name: Assigned_Agent
Required: No
Description: The agent/ISO assigned to this lead
```

#### Deals Module
```
Field Name: Assigned Agent
Field Type: Lookup (to Vendors module)
API Name: Assigned_Agent
Required: No
Description: The agent/ISO assigned to this deal
```

### Webhook Configuration

Ensure webhooks include the `Assigned_Agent` field:

#### Lead Status Webhook
```json
{
  "id": "${Lead.id}",
  "Lead_Status": "${Lead.Lead_Status}",
  "StrategicPartnerId": "${Lead.StrategicPartnerId}",
  "Assigned_Agent": "${Lead.Assigned_Agent.id}"
}
```

#### Deal Webhook
```json
{
  "zohoDealId": "${Deal.id}",
  "Deal_Name": "${Deal.Deal_Name}",
  "Stage": "${Deal.Stage}",
  "Assigned_Agent": "${Deal.Assigned_Agent.id}",
  ...
}
```

---

## 🔍 How It Works Behind the Scenes

### Database Structure

```sql
-- Partners table has partner_type
partners (
  id UUID,
  zoho_partner_id TEXT,
  partner_type TEXT DEFAULT 'partner', -- 'partner', 'agent', 'iso'
  ...
)

-- Leads table has assigned_agent_id
leads (
  id UUID,
  partner_id UUID,  -- The partner who owns/submitted the lead
  assigned_agent_id UUID,  -- The agent assigned to work this lead
  ...
)

-- Deals table has assigned_agent_id
deals (
  id UUID,
  partner_id UUID,  -- The partner who owns the deal
  assigned_agent_id UUID,  -- The agent assigned to work this deal
  ...
)
```

### RLS (Row Level Security) Policies

Agents can only see records where they are assigned:

```sql
-- Agents can view only assigned leads
CREATE POLICY "agents_view_assigned_leads" ON leads
  FOR SELECT USING (
    assigned_agent_id IN (
      SELECT partner_id FROM users WHERE id = auth.uid()
    )
  );

-- Agents can view only assigned deals
CREATE POLICY "agents_view_assigned_deals" ON deals
  FOR SELECT USING (
    assigned_agent_id IN (
      SELECT partner_id FROM users WHERE id = auth.uid()
    )
  );
```

### API Endpoints

Agents use special endpoints that leverage database functions:

```typescript
// GET /api/leads/assigned
// Uses: get_agent_assigned_leads(user_uuid)
// Returns: Only leads where assigned_agent_id = agent's partner_id

// GET /api/deals/assigned
// Uses: get_agent_assigned_deals(user_uuid)
// Returns: Only deals where assigned_agent_id = agent's partner_id
```

---

## 📊 Agent Dashboard View

When an agent logs in, they see:

### Stats Cards
- **Assigned Leads**: Count of leads assigned to them
- **Assigned Deals**: Count of deals assigned to them
- **Conversion Rate**: Percentage of assigned leads converted to deals

### Quick Actions
- **View Assigned Leads**: Link to leads page (filtered)
- **View Assigned Deals**: Link to deals page (filtered)

### Restrictions Notice
> "As an agent, you have read-only access to view leads and deals assigned to you. To submit new leads or manage accounts, please contact your administrator."

---

## 🔄 Assignment Workflow Example

### Scenario: Assigning a Lead to an Agent

1. **Initial State**
   - Lead exists in Zoho CRM
   - Lead synced to Partner Portal
   - `leads.assigned_agent_id = NULL`
   - Agent cannot see this lead

2. **Assignment in Zoho**
   - Admin opens lead in Zoho CRM
   - Sets "Assigned Agent" = "John Doe (Agent)"
   - Saves the lead

3. **Webhook Fires**
   ```
   POST /api/webhooks/zoho/lead-status
   {
     "id": "12345",
     "Lead_Status": "Qualified",
     "Assigned_Agent": "67890"  // John's Zoho Vendor ID
   }
   ```

4. **Portal Processing**
   ```typescript
   // Backend finds John's partner record
   const agent = await supabase
     .from('partners')
     .select('id')
     .eq('zoho_partner_id', '67890')
     .single()
   
   // Updates lead with assignment
   await supabase
     .from('leads')
     .update({ assigned_agent_id: agent.id })
     .eq('zoho_lead_id', '12345')
   
   // Logs activity
   await supabase.from('activity_log').insert({
     activity_type: 'lead_assigned_to_agent',
     description: 'Lead assigned to agent John Doe',
     ...
   })
   ```

5. **Agent Can Now View**
   - John logs into Partner Portal
   - Dashboard shows: "Assigned Leads: 1"
   - Clicks "View Assigned Leads"
   - Sees the lead in the list
   - Can view all details (read-only)

---

## ❓ FAQ

### Q: Can agents assign leads to themselves?
**A:** No. Agents have read-only access. All assignments must be done by admins in Zoho CRM.

### Q: Can agents see leads that aren't assigned to them?
**A:** No. RLS policies at the database level prevent this. They only see leads where `assigned_agent_id = their partner_id`.

### Q: What happens if I remove an agent assignment in Zoho?
**A:** The webhook will fire with `Assigned_Agent = null`, and the portal will update `assigned_agent_id = NULL`. The agent will no longer see that lead/deal.

### Q: Can I assign multiple agents to one lead?
**A:** Currently, the system supports one agent per lead/deal. For multiple agents, you would need to create separate lead records or use a different workflow.

### Q: How do I create an agent partner?
**A:** In Zoho CRM:
1. Create a new Vendor record
2. Set the **"Vendor Type"** field to "Agent" or "ISO"
3. Save the vendor
4. Webhook will create the partner in the portal with `partner_type = 'agent'` or `'iso'`

### Q: What's the difference between Agent and ISO?
**A:** In the portal, they function identically (read-only access to assigned records). The distinction is for your business logic in Zoho CRM.

### Q: Can agents see the partner who submitted the lead?
**A:** Yes, agents can see the "Submitted By" information, but they cannot access that partner's account or other leads.

### Q: Can I bulk assign leads to agents?
**A:** Yes, use Zoho CRM's bulk update feature:
1. Select multiple leads
2. Click "Mass Update"
3. Set "Assigned Agent" field
4. All webhooks will fire and portal will sync

---

## 🔐 Security Notes

### Defense in Depth
The system uses multiple layers of security:

1. **Database RLS Policies**: Prevent unauthorized data access at the lowest level
2. **API Middleware**: Validates partner type before allowing actions
3. **Frontend UI**: Hides restricted features (but server validates)

### Audit Trail
All agent assignments are logged:
- **When**: Timestamp of assignment
- **Who**: Which admin made the assignment (from Zoho)
- **What**: Lead/Deal ID and agent ID
- **Where**: Logged in `activity_log` table

### Data Isolation
Agents cannot:
- Submit new leads
- Manage sub-accounts
- Access compensation documents
- View public URL settings
- See unassigned leads/deals
- Modify any data (read-only)

---

## 🚀 Best Practices

### 1. Clear Naming Convention
Use consistent naming for agents in Zoho:
- Format: "FirstName LastName (Agent)"
- Example: "John Doe (Agent)"
- Makes it easy to identify agents in dropdowns

### 2. Regular Assignment Reviews
Periodically review agent assignments:
- Check for unassigned leads that should be assigned
- Verify agents aren't overloaded
- Reassign if agent leaves or role changes

### 3. Training Agents
Ensure agents understand:
- They have read-only access
- How to view their assigned leads/deals
- Who to contact for new lead submissions
- How to report issues or request changes

### 4. Monitor Agent Performance
Use the portal's activity logs to track:
- How many leads/deals assigned to each agent
- Conversion rates per agent
- Response times (if tracked in Zoho)

### 5. Webhook Monitoring
Set up alerts for webhook failures:
- Monitor webhook delivery in Zoho
- Check portal logs for processing errors
- Verify assignments sync correctly

---

## 📞 Support

If you encounter issues with agent assignments:

1. **Check Zoho Webhook Logs**
   - Verify webhook fired successfully
   - Check payload includes `Assigned_Agent` field

2. **Check Portal Activity Logs**
   - Look for assignment activity entries
   - Verify agent partner exists in database

3. **Verify Agent Partner Type**
   - Query: `SELECT * FROM partners WHERE partner_type IN ('agent', 'iso')`
   - Ensure `zoho_partner_id` matches Zoho

4. **Test Assignment Flow**
   - Create test lead in Zoho
   - Assign to test agent
   - Verify agent can see it in portal

---

**Last Updated:** January 7, 2026  
**Version:** 1.0  
**Related Docs:** 
- [Phase 7 Implementation Summary](./PHASE_7_IMPLEMENTATION_SUMMARY.md)
- [Phase 7 Completion](./PHASE_7_COMPLETION.md)
- [Zoho Integration Setup](./setup/ZOHO_INTEGRATION_SETUP.md)
