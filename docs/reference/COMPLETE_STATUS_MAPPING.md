# Complete Status & Stage Mapping Reference

## Lead Statuses (Zoho → Portal)

### Merchant Layout Lead Statuses:

| Zoho Lead Status | Portal Display | Category | Notes |
|-----------------|----------------|----------|-------|
| **New** | Pre-Vet / New Lead | Open | Initial state |
| **Interested** | Contacted | Open | Lead shows interest |
| **Sent Pre-Vet** | Contacted | Open | Pre-vet sent |
| **Contact Attempt 1** | Contacted | Open | First contact attempt |
| **Contact Attempt 2** | Contacted | Open | Second contact attempt |
| **Contact Attempt 3** | Contacted | Open | Third contact attempt |
| **Contact Attempt 4** | Contacted | Open | Fourth contact attempt |
| **Contact Attempt 5** | Contacted | Open | Fifth contact attempt |
| **Sent Pre-App** | Contacted | Open | Pre-application sent |
| **Pre-App Received** | Contacted | Open | Pre-application received |
| **Sent Application for Signature** | Sent for Signature / Submitted | Open | Application sent |
| **Signed Application** | Sent for Signature / Submitted | Open | Application signed |
| **Convert** | N/A | Open | 🎯 **TRIGGERS AUTO CONVERSION** to Deal |
| **Notify Apps Team** | Contacted | Open | Apps team notified |
| **Interested - Needs Follow Up** | Contacted | Open | Needs follow-up |
| **Not Interested** | Dead / Withdrawn | Open | Lead not interested |
| **Awaiting Signature - No Motion.io** | Sent for Signature / Submitted | Open | Awaiting signature |
| **Send to Motion.io** | Contacted | Open | Send to Motion.io |
| **Lost** | Dead / Withdrawn | Not Qualified | Lead is lost |
| **Junk** | Dead / Withdrawn | Not Qualified | Junk lead |

### Strategic Partner Layout Lead Statuses:

| Zoho Lead Status | Portal Display | Category | Notes |
|-----------------|----------------|----------|-------|
| **New** | Pre-Vet / New Lead | Open | Initial state |
| **Contact Attempt 1** | Contacted | Open | First contact attempt |
| **Contact Attempt 2** | Contacted | Open | Second contact attempt |
| **Interested** | Contacted | Open | Lead shows interest |
| **Interested - SP Lead** | Contacted | Open | Strategic Partner lead |
| **Interested - Merchant Lead** | Contacted | Open | Merchant lead |
| **Interested - Needs Follow Up** | Contacted | Open | Interested but needs follow-up |
| **Contacted - Needs Follow up** | Contacted | Open | Has been contacted |
| **Needs Follow Up** | Contacted | Open | Requires follow-up |
| **Reset Appointment** | Contacted | Open | Need to reschedule |
| **Sent Agreement for Signature** | Sent for Signature / Submitted | Open | Agreement sent to lead |
| **Signed Agreement** | Sent for Signature / Submitted | Open | Agreement signed |
| **Lost** | Dead / Withdrawn | Not Qualified | Lead is lost |

### Portal Lead Status Values
- `Pre-Vet / New Lead` - Initial state
- `Contacted` - In communication
- `Sent for Signature / Submitted` - Agreement stage
- `Approved` - Approved (rare for leads)
- `Declined` - Declined (rare for leads)
- `Dead / Withdrawn` - Closed/Lost

---

## Deal Stages (Zoho → Portal)

| Zoho Deal Stage | Portal Display | Probability | Record Category | Forecast | Notes |
|----------------|----------------|-------------|-----------------|----------|-------|
| **Sent to Underwriting** | Underwriting | 75% | Open | Pipeline | Under review |
| **App Pended** | Underwriting | 90% | Open | Pipeline | Pending additional info |
| **Conditionally Approved** | Approved | 95% | Open | Pipeline | Approved with conditions |
| **Approved** | Approved | 100% | Closed Won | Closed | Fully approved |
| **Approved - Closed** | Closed | 0% | Closed Lost | Omitted | Deal completed |
| **Declined** | Declined | 0% | Closed Lost | Omitted | Application declined |
| **Dead / Do Not Contact** | Closed | 0% | Closed Lost | Omitted | Do not contact |
| **Merchant Unresponsive** | Closed | 0% | Closed Lost | Omitted | No response from merchant |
| **App Withdrawn** | Closed | 0% | Closed Lost | Omitted | Application withdrawn |

### Portal Deal Stage Values
- `New Lead / Prevet` - Initial deal (if created directly)
- `Submitted` - Application submitted
- `Underwriting` - Under review (75-90% probability)
- `Approved` - Approved (95-100% probability)
- `Declined` - Application declined
- `Closed` - Deal closed (various reasons)

---

## Lead-to-Deal Conversion Flow

### When a Lead is Converted in Zoho:

1. **User clicks "Convert" in Zoho CRM**
   - Creates Contact
   - Creates Deal
   - Optionally creates Account

2. **Zoho fires "2.0 Deals sync" webhook**
   - Sends deal data to Portal
   - Includes: Email, Phone, Deal Name, Stage, Partner ID

3. **Portal Backend Processing:**
   ```
   a. Receives webhook at /api/webhooks/zoho/deal
   b. Finds partner by StrategicPartnerId
   c. Searches for matching lead by:
      - Email (primary)
      - First Name + Last Name
      - Company Name
   d. If lead found:
      - Deletes the lead from leads table
      - Creates notification for user
      - Creates/updates deal in deals table
   e. Returns success
   ```

4. **Portal Frontend Updates:**
   - Lead disappears from Leads page
   - Deal appears in Deals page
   - Notification appears in bell icon 🔔

### Important Notes:
- **"Signed Agreement"** status on a Lead should trigger manual conversion
- Conversion is done via Zoho's "Convert" button, NOT by changing status
- The webhook must include Email for reliable lead matching
- Notifications are created automatically on successful conversion

---

## Database Constraints

### Leads Table Status Constraint
```sql
CHECK (status IN (
    'Pre-Vet / New Lead',
    'Contacted',
    'Sent for Signature / Submitted',
    'Approved',
    'Declined',
    'Dead / Withdrawn'
))
```

### Deals Table Stage Constraint
```sql
CHECK (stage IN (
    'New Lead / Prevet',
    'Submitted',
    'Underwriting',
    'Approved',
    'Declined',
    'Closed'
))
```

---

## Webhook Configuration

### Lead Status Webhook
- **Name:** 2.0 Lead Status sync
- **URL:** `https://backend-production-c5d1.up.railway.app/api/webhooks/zoho/lead-status`
- **Trigger:** When Lead Status is updated
- **Parameters:**
  ```json
  {
    "zohoLeadId": "${Leads.Id}",
    "Lead_Status": "${Leads.Lead_Status}",
    "StrategicPartnerId": "${Leads.StrategicPartnerId}"
  }
  ```

### Deal Webhook (Conversion + Updates)
- **Name:** 2.0 Deals sync
- **URL:** `https://backend-production-c5d1.up.railway.app/api/webhooks/zoho/deal`
- **Trigger:** When Deal is created or updated
- **Parameters:**
  ```json
  {
    "zohoDealId": "${Deals.Id}",
    "Deal_Name": "${Deals.Deal_Name}",
    "Stage": "${Deals.Stage}",
    "Email": "${Deals.Email}",
    "Phone": "${Deals.Phone}",
    "Partners_Id": "${Deals.Vendor}",
    "StrategicPartnerId": "${Deals.StrategicPartnerId}",
    "Approval_Time_Stamp": "${Deals.Approval_Time_Stamp}"
  }
  ```

---

## Testing Checklist

### Lead Status Updates
- [ ] Create lead in Portal → syncs to Zoho
- [ ] Change status in Zoho → updates in Portal
- [ ] Test all status mappings
- [ ] Verify database constraints

### Lead-to-Deal Conversion
- [ ] Create lead in Portal
- [ ] Convert lead in Zoho (use "Convert" button)
- [ ] Verify lead disappears from Leads page
- [ ] Verify deal appears in Deals page
- [ ] Verify notification is created
- [ ] Check Railway logs for success messages

### Deal Stage Updates
- [ ] Update deal stage in Zoho
- [ ] Verify stage updates in Portal
- [ ] Test all stage mappings
- [ ] Verify database constraints

---

Last Updated: December 1, 2025

