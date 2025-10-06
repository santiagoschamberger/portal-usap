# Zoho CRM Integration - Complete Guide

This comprehensive guide documents how the referral portal connects to, retrieves data from, and sends data to Zoho CRM.

## 🔐 Authentication & Connection Setup

### OAuth 2.0 Token Management

**File**: `referral-backend/utils/zohoTokenManager.js`

The system uses OAuth 2.0 with refresh token flow for secure API access:

```javascript
// Token caching with automatic refresh
let cachedToken = null;
let tokenExpiryTime = null;

const getZohoAccessToken = async () => {
    if (cachedToken && tokenExpiryTime > Date.now()) {
        return cachedToken; // Use cached token if valid
    }
    
    // Fetch new token using refresh token
    const response = await axios.post("https://accounts.zoho.com/oauth/v2/token", null, {
        params: {
            refresh_token: process.env.ZOHO_REFRESH_TOKEN,
            client_id: process.env.ZOHO_CLIENT_ID,
            client_secret: process.env.ZOHO_CLIENT_SECRET,
            grant_type: "refresh_token",
        },
    });
    
    cachedToken = response.data.access_token;
    tokenExpiryTime = Date.now() + response.data.expires_in * 1000;
    return cachedToken;
};
```

### Required Environment Variables

```bash
ZOHO_CLIENT_ID=your_client_id
ZOHO_CLIENT_SECRET=your_client_secret  
ZOHO_REFRESH_TOKEN=your_refresh_token
```

---

## 📥 Data Retrieval from Zoho CRM

### 1. Fetch All Leads

**Endpoint**: `GET /api/v1/leads/referral`
**Zoho API**: `GET https://www.zohoapis.com/crm/v2/Leads`

```javascript
router.get('/referral', async (req, res) => {
    const accessToken = await getZohoAccessToken();
    const response = await axios.get('https://www.zohoapis.com/crm/v2/Leads', {
        headers: {
            Authorization: `Zoho-oauthtoken ${accessToken}`,
        },
    });
    res.status(200).json(response.data);
});
```

### 2. Fetch Leads by Referrer Name

**Endpoint**: `GET /api/v1/leads/by-referrer` (Authenticated)
**Zoho API**: `GET https://www.zohoapis.com/crm/v2/Leads` with criteria filter

```javascript
router.get('/by-referrer', authenticateToken, async (req, res) => {
    const referrer = req.user.full_name;
    const accessToken = await getZohoAccessToken();
    
    const response = await axios.get('https://www.zohoapis.com/crm/v2/Leads', {
        params: {
            criteria: `(Referrer:equals:${referrer})`, // Filter by Referrer field
        },
        headers: {
            Authorization: `Zoho-oauthtoken ${accessToken}`,
        },
    });
    res.status(200).json(response.data);
});
```

### 3. Fetch Leads by Strategic Partner ID

**Endpoint**: `GET /api/v1/leads/by-lead-source` (Authenticated)
**Zoho API**: `GET https://www.zohoapis.com/crm/v2/Leads/search`

```javascript
router.get('/by-lead-source', authenticateToken, async (req, res) => {
    const leadSource = req.user.uuid; // Use authenticated user's UUID
    const accessToken = await getZohoAccessToken();
    
    const response = await axios.get('https://www.zohoapis.com/crm/v2/Leads/search', {
        params: {
            criteria: `(StrategicPartnerId:equals:${leadSource})`,
        },
        headers: {
            Authorization: `Zoho-oauthtoken ${accessToken}`,
        },
    });
    
    if (response.data.data && response.data.data.length > 0) {
        res.status(200).json({
            message: 'Leads fetched successfully.',
            leads: response.data.data,
        });
    } else {
        res.status(404).json({
            message: "You didn't refer any lead yet.",
        });
    }
});
```

### 4. Fetch Deals by Vendor ID

**Endpoint**: `GET /api/v1/leads/deals/by-referrer` (Authenticated)
**Zoho API**: `GET https://www.zohoapis.com/crm/v2/Deals/search`

```javascript
router.get('/deals/by-referrer', authenticateToken, async (req, res) => {
    const vendorId = req.user.partner_id; // Zoho Vendor ID from user record
    const accessToken = await getZohoAccessToken();
    
    const response = await axios.get('https://www.zohoapis.com/crm/v2/Deals/search', {
        params: {
            criteria: `(Vendor.id:equals:${vendorId})`,
        },
        headers: {
            Authorization: `Zoho-oauthtoken ${accessToken}`,
        },
    });
    
    if (response.data.data && response.data.data.length > 0) {
        return res.status(200).json({
            message: 'Deals fetched successfully.',
            deals: response.data.data,
        });
    } else {
        return res.status(404).json({
            message: "No deals found for this vendor.",
            vendor_id: vendorId,
        });
    }
});
```

### 5. Fetch Leads by Multiple Contact IDs (Agent ISO Feature)

**Endpoint**: `GET /api/v1/leads/leads/by-contacts` (Authenticated)
**Purpose**: Allows Agent ISOs to see leads from all their sub-accounts

```javascript
router.get('/leads/by-contacts', authenticateToken, async (req, res) => {
    let leadSources = req.query.contact_ids; // Comma-separated UUIDs
    leadSources = leadSources.split(',').map(id => id.trim());
    
    const accessToken = await getZohoAccessToken();
    
    // Construct OR criteria for multiple StrategicPartnerId values
    const criteria = leadSources.map(id => `(StrategicPartnerId:equals:${id})`).join(' or ');
    
    const response = await axios.get('https://www.zohoapis.com/crm/v2/Leads/search', {
        params: { criteria },
        headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
    });
    
    let leads = response.data.data || [];
    
    // Fetch matching users from local database
    const usersFromDB = await User.findAll({
        where: { partner_id: leadSources },
        attributes: ['uuid', 'full_name', 'email', 'partner_id'],
        raw: true
    });
    
    // Enrich leads with user data
    const enrichedLeads = leads.map(lead => {
        const matchingUser = usersFromDB.find(user => user.partner_id === lead.StrategicPartnerId);
        return {
            contact_id: lead?.Contact_Name?.id || "N/A",
            lead_id: lead.id,
            lead_name: lead.Full_Name || "Unknown",
            company: lead.Company || "N/A",
            email: lead.Email || "N/A",
            phone: lead.Phone || "N/A",
            contact_details: matchingUser || null,
        };
    });
    
    res.status(200).json({
        message: 'Leads fetched successfully with user data.',
        leads: enrichedLeads,
    });
});
```

---

## 📤 Data Sending to Zoho CRM

### 1. Create Lead with Referral Submission (Authenticated Users)

**Endpoint**: `POST /api/v1/leads/referral` (Authenticated)
**Zoho APIs**: 
- `POST https://www.zohoapis.com/crm/v2/Leads` (Create Lead)
- `POST https://www.zohoapis.com/crm/v2/Notes` (Add Note)
- `PUT https://www.zohoapis.com/crm/v2/Leads` (Update Contact Association)

```javascript
router.post('/referral', authenticateToken, async (req, res) => {
    const referrer = req.user.uuid;
    let vendorId = req.user.partner_id;
    let contactId;
    let contactName;
    const parentId = req.user.parent_id;
    let vendorName = req.user.full_name;
    
    // Handle Agent ISO sub-account logic
    if (parentId) {
        contactId = vendorId; // Current user's partner_id becomes contactId
        contactName = vendorName;
        
        // Get parent vendor details
        const parentVendorProfile = await User.findOne({ 
            where: { uuid: parentId },
            attributes: ['partner_id', 'full_name'],
            raw: true
        });
        
        vendorId = parentVendorProfile?.partner_id; // Use parent's partner_id
        vendorName = parentVendorProfile?.full_name;
    }
    
    const accessToken = await getZohoAccessToken();
    
    // Step 1: Create the Lead
    const leadPayload = {
        data: [{
            Last_Name: req.body.Last_Name,
            First_Name: req.body.First_Name,
            Email: req.body.Email,
            Company: req.body.Company,
            Phone: req.body.Title,
            StrategicPartnerId: referrer, // Portal user UUID
            Entity_Type: Array.isArray(req.body.Business_Type) ? req.body.Business_Type : [req.body.Business_Type],
            Lead_Status: "New",
            Lead_Source: "Strategic Partner",
            Vendor: {
                name: vendorName,  
                id: vendorId, // Zoho Vendor ID
            },
        }],
    };
    
    const leadResponse = await axios.post('https://www.zohoapis.com/crm/v2/Leads', leadPayload, {
        headers: {
            Authorization: `Zoho-oauthtoken ${accessToken}`,
            'Content-Type': 'application/json',
        },
    });
    
    const leadId = leadResponse.data.data[0].details.id;
    
    // Step 2: Update Contact Association (for sub-accounts)
    let updateLeadResponse = null;
    if (contactId) {
        const updateLeadPayload = {
            data: [{
                id: leadId,
                StrategicPartnerId: contactId, // Update with Contact ID
            }],
        };
        
        updateLeadResponse = await axios.put('https://www.zohoapis.com/crm/v2/Leads', updateLeadPayload, {
            headers: {
                Authorization: `Zoho-oauthtoken ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });
    }
    
    // Step 3: Add Note to Lead
    const notePayload = {
        data: [{
            Note_Title: 'Referral Description',
            Note_Content: req.body.Description || 'No description provided.',
            Parent_Id: leadId,
            se_module: 'Leads',
        }],
    };
    
    const noteResponse = await axios.post('https://www.zohoapis.com/crm/v2/Notes', notePayload, {
        headers: {
            Authorization: `Zoho-oauthtoken ${accessToken}`,
            'Content-Type': 'application/json',
        },
    });
    
    // Step 4: Send Email Notifications
    const userEmailSubject = 'Hey thanks for submitting a new referral.';
    const userEmailBody = `
        <p>Dear ${vendorName},</p>
        <p>Thank you for submitting a referral. Here are the details:</p>
        <ul>
            <li><strong>Name:</strong> ${req.body.First_Name} ${req.body.Last_Name}</li>
            <li><strong>Email:</strong> ${req.body.Email}</li>
            <li><strong>Company:</strong> ${req.body.Company}</li>
            <li><strong>Phone:</strong> ${req.body.Title}</li>
            <li><strong>Description:</strong> ${req.body.Description}</li>
        </ul>
        <p>We appreciate your efforts in helping us grow!</p>
        <p>Best regards,<br/>Platform Team</p>
    `;
    
    sendEmail(req.user.email, userEmailSubject, userEmailBody);
    sendEmail(process.env.ADMIN_EMAIL, 'New Referral Submitted', adminEmailBody);
    
    return res.status(200).json({
        message: 'Lead created and Contact updated successfully.',
        leadData: leadResponse.data,
        updateLeadData: updateLeadResponse ? updateLeadResponse.data : null,
        noteData: noteResponse.data,
    });
});
```

### 2. Create Lead by UUID (Public/Unauthenticated)

**Endpoint**: `POST /api/v1/leads/referral/by-uuid`
**Purpose**: Allows public referral submissions using a user's UUID

```javascript
router.post('/referral/by-uuid', async (req, res) => {
    const { uuid } = req.body;
    
    // Fetch user details using UUID
    const user = await User.findOne({ where: { uuid } });
    if (!user) {
        return res.status(404).json({ message: 'User not found with the provided ID.' });
    }
    
    const referrer = user.uuid;
    const vendorId = user.partner_id;
    const vendorName = user.full_name;
    
    const accessToken = await getZohoAccessToken();
    
    // Extract additional fields from Description
    const description = req.body.Description || '';
    const extractedValues = {
        monthlyVolume: description.match(/Monthly Volume:\s*\$(\d+)/)?.[1] || null,
        address: description.match(/Address:\s*(.*)/)?.[1]?.split('City:')[0]?.trim() || null,
        city: description.match(/City:\s*(.*)/)?.[1]?.split('State:')[0]?.trim() || null,
        state: description.match(/State:\s*(.*)/)?.[1]?.split('ZIP:')[0]?.trim() || null,
        zip: description.match(/ZIP:\s*(\d+)/)?.[1] || null,
        smsConsent: description.match(/SMS Consent:\s*(Yes|No)/i)?.[1] || null,
        additionalNotes: description.match(/Additional Notes:\s*(.*)/)?.[1]?.trim() || null,
    };
    
    // Create Lead with extracted data
    const payload = {
        data: [{
            Last_Name: req.body.Last_Name,
            First_Name: req.body.First_Name,
            Email: req.body.Email,
            Company: req.body.Company,
            Phone: req.body.Title,
            StrategicPartnerId: referrer,
            Entity_Type: Array.isArray(req.body.Business_Type) ? req.body.Business_Type : [req.body.Business_Type],
            Lead_Status: "New",
            Lead_Source: "Strategic Partner",
            Vendor: {
                name: vendorName,
                id: vendorId,
            },
            Monthly_Volume: extractedValues.monthlyVolume,
            Address: extractedValues.address,
            City: extractedValues.city,
            State: extractedValues.state,
            ZIP: extractedValues.zip,
            SMS_Consent: extractedValues.smsConsent,
        }],
    };
    
    const leadResponse = await axios.post('https://www.zohoapis.com/crm/v2/Leads', payload, {
        headers: {
            Authorization: `Zoho-oauthtoken ${accessToken}`,
            'Content-Type': 'application/json',
        },
    });
    
    const leadId = leadResponse.data.data[0].details.id;
    
    // Add Note with additional notes
    const notePayload = {
        data: [{
            Note_Title: 'Referral Description',
            Note_Content: extractedValues.additionalNotes || 'No additional notes provided.',
            Parent_Id: leadId,
            se_module: 'Leads',
        }],
    };
    
    const noteResponse = await axios.post('https://www.zohoapis.com/crm/v2/Notes', notePayload, {
        headers: {
            Authorization: `Zoho-oauthtoken ${accessToken}`,
            'Content-Type': 'application/json',
        },
    });
    
    // Send email notifications to user and admin
    sendEmail(user.email, userEmailSubject, userEmailBody);
    sendEmail(process.env.ADMIN_EMAIL, adminEmailSubject, adminEmailBody);
    
    return res.status(200).json({
        message: 'Lead and note created successfully.',
        leadData: leadResponse.data,
        noteData: noteResponse.data,
    });
});
```

### 3. Create Vendor/Partner in Zoho

**Function**: `createPartnerInZoho(fullName, email)`
**Zoho API**: `POST https://www.zohoapis.com/crm/v2.2/Vendors`

```javascript
async function createPartnerInZoho(fullName, email) {
    const accessToken = await getZohoAccessToken();
    const payload = {
        data: [{
            Lead_Status: "New Prospect",
            Email_Opt_Out: false,
            Vendor_Name: fullName, 
            Email: email,
            Vendor_Type: "Strategic Partner (Referral)",
            $zia_owner_assignment: "owner_recommendation_unavailable",
        }],
        skip_mandatory: false,  
    };
    
    const response = await axios.post("https://www.zohoapis.com/crm/v2.2/Vendors", payload, {
        headers: {
            Authorization: `Zoho-oauthtoken ${accessToken}`,
            "Content-Type": "application/json",
        },
    });
    
    if (response.data.data && response.data.data.length > 0) {
        const vendorData = response.data.data[0];
        if (vendorData.code === "SUCCESS") {
            return vendorData.details.id; // Return Vendor ID
        } else {
            throw new Error(`Zoho CRM Error: ${vendorData.message}`);
        }
    }
}
```

---

## 🔗 Webhook Integration

### 1. Partner Registration Webhook

**Endpoint**: `POST /api/v1/users/zoho-register`
**Purpose**: Automatically creates portal users when Partners are added in Zoho CRM
**Zoho Webhook**: `Stage Name Zoho Partners Register Webhook`

```javascript
router.post("/zoho-register", async (req, res) => {
    const endpoint = '/zoho-register';
    const { id, VendorName, Email, PartnerType } = req.body;
    
    try {
        // Check if user already exists
        const existingUser = await User.findOne({ where: { partner_id: id } });
        if (existingUser) {
            await logWebhookResponse(endpoint, req.headers, 200, { message: 'User already exists' });
            return successResponse(res, "User already exists", existingUser, 200);
        }
        
        // Generate temporary password
        const tempPassword = crypto.randomBytes(8).toString('hex');
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        
        // Create user in portal database
        const newUser = await User.create({
            uuid: uuidv4(),
            full_name: VendorName,
            email: Email,
            password: hashedPassword,
            partner_id: id, // Zoho Vendor ID
            role: "user", // Strategic Partner role
        });
        
        // Send welcome email with credentials
        const emailSubject = "Welcome to the Partner Portal!";
        const emailBody = `
            <p>Dear ${VendorName},</p>
            <p>Welcome to the Partner Portal! Your account has been created successfully.</p>
            <p><strong>Login Details:</strong></p>
            <ul>
                <li>Email: ${Email}</li>
                <li>Temporary Password: ${tempPassword}</li>
            </ul>
            <p>Please log in and change your password immediately.</p>
            <p>Portal URL: ${process.env.FRONTEND_URL || 'https://your-portal.com'}</p>
        `;
        
        await sendEmail(Email, emailSubject, emailBody);
        
        await logWebhookResponse(endpoint, req.headers, 201, { message: 'User created successfully', user: newUser });
        return successResponse(res, "User created successfully", newUser, 201);
        
    } catch (error) {
        console.error("Error in Zoho registration webhook:", error.message);
        await logWebhookResponse(endpoint, req.headers, 500, { error: error.message });
        return errorResponse(res, "Error processing webhook", { error: error.message }, 500);
    }
});
```

### 2. Contact Addition Webhook

**Endpoint**: `POST /api/v1/users/webhook/add-contact`
**Purpose**: Creates portal sub-accounts when Contacts are added in Zoho CRM
**Zoho Webhook**: `Zoho Contact Sync Webhook`

```javascript
router.post("/webhook/add-contact", async (req, res) => {
    const endpoint = '/webhook/add-contact';
    const { contactId, name, email, partnerId } = req.body; // Expected payload structure
    
    try {
        // Find parent Agent ISO by partner_id
        const parentUser = await User.findOne({ 
            where: { partner_id: partnerId },
            attributes: ['uuid', 'partner_id', 'full_name']
        });
        
        if (!parentUser) {
            await logWebhookResponse(endpoint, req.headers, 404, { error: 'Parent Partner not found' });
            return errorResponse(res, "Parent Partner not found", {}, 404);
        }
        
        // Check if contact already exists
        const existingContact = await User.findOne({ where: { partner_id: contactId } });
        if (existingContact) {
            await logWebhookResponse(endpoint, req.headers, 200, { message: 'Contact already exists' });
            return successResponse(res, "Contact already exists", existingContact, 200);
        }
        
        // Generate temporary password
        const tempPassword = crypto.randomBytes(8).toString('hex');
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        
        // Create sub-account user
        const newContact = await User.create({
            uuid: uuidv4(),
            full_name: name,
            email: email,
            password: hashedPassword,
            partner_id: contactId, // Zoho Contact ID
            parent_id: parentUser.uuid, // Link to parent Agent ISO
            role: "contact", // Sub-account role
        });
        
        // Send welcome email
        const emailSubject = "Welcome to the Partner Portal - Sub Account!";
        const emailBody = `
            <p>Dear ${name},</p>
            <p>A sub-account has been created for you under ${parentUser.full_name}'s Agent ISO account.</p>
            <p><strong>Login Details:</strong></p>
            <ul>
                <li>Email: ${email}</li>
                <li>Temporary Password: ${tempPassword}</li>
            </ul>
            <p>Please log in and change your password immediately.</p>
        `;
        
        await sendEmail(email, emailSubject, emailBody);
        
        await logWebhookResponse(endpoint, req.headers, 201, { message: 'Contact created successfully', contact: newContact });
        return successResponse(res, "Contact created successfully", newContact, 201);
        
    } catch (error) {
        console.error("Error in add-contact webhook:", error.message);
        await logWebhookResponse(endpoint, req.headers, 500, { error: error.message });
        return errorResponse(res, "Error processing webhook", { error: error.message }, 500);
    }
});
```

### 3. Lead Status Update Webhook

**Endpoint**: `POST /api/v1/leads/webhook/lead-status`
**Purpose**: Receives notifications when lead status changes in Zoho CRM
**Zoho Webhook**: `Referral Platform Hook for lead`

```javascript
router.post('/webhook/lead-status', (req, res) => {
    try {
        console.log('Webhook payload received:', JSON.stringify(req.body, null, 2));
        
        // Process webhook data (currently just logging)
        // Future implementation could:
        // - Update local cache
        // - Send notifications to referrers
        // - Update compensation tracking
        
        res.status(200).json({ message: 'Webhook processed successfully.' });
    } catch (error) {
        console.error('Error processing webhook:', error.message);
        res.status(500).json({ message: 'Error processing webhook.' });
    }
});
```

---

## 🎯 Frontend Integration Patterns

### Service Layer Architecture

**File**: `referral-frontend/src/services/zoho.ts`

```typescript
import { getLeads, submitReferral } from './api/leads';
import { getDeals } from './api/deals';
import { getStats } from './api/stats';

export const zohoService = {
  getLeads,
  getDeals,
  getStats,
  submitReferral
};
```

### Lead Data Fetching

**File**: `referral-frontend/src/services/api/leads.ts`

```typescript
export async function getLeads(params?: LeadsParams, signal?: AbortSignal): Promise<Referral[]> {
    try {
        const queryParams: Record<string, string> = {};
        
        if (params?.period) {
            queryParams.period = params.period;
        } else if (params?.startDate && params?.endDate) {
            queryParams.start_date = formatDateForAPI(params.startDate);
            queryParams.end_date = formatDateForAPI(params.endDate);
        }
        
        const response = await api.get<ZohoLeadResponse>('/leads/by-lead-source', {
            params: queryParams,
            signal,
        });
        
        return (response.data?.leads || []).map((lead) => ({
            id: lead.id,
            Full_Name: lead.Full_Name || 'Unknown',
            Company: lead.Company || 'N/A',
            Lead_Status: lead.Lead_Status as ReferralStatus,
            Created_Time: lead.Created_Time,
            Email: lead.Email,
            Phone: lead.Phone,
            Contact_Number: lead.Contact_Number
        }));
    } catch (error) {
        if (error.response?.status === 500) {
            return []; // Return empty array for server errors
        }
        return handleApiError(error);
    }
}
```

### Contact Leads for Agent ISOs

```typescript
export async function getContactLeads(contactId: string, signal?: AbortSignal): Promise<ContactLead[]> {
    try {
        const response = await api.get('/leads/leads/by-contacts', {
            params: { contact_ids: contactId },
            signal,
        });
        
        if (!response.data?.leads) {
            return [];
        }
        
        return response.data.leads.map((lead: any) => ({
            contact_id: lead.contact_id || '',
            lead_id: lead.lead_id || '',
            lead_name: lead.lead_name || 'Unnamed Lead',
            company: lead.company || '',
            email: lead.email || '',
            contact_details: {
                uuid: lead.contact_details?.uuid || '',
                full_name: lead.contact_details?.full_name || '',
                email: lead.contact_details?.email || '',
                partner_id: lead.contact_details?.partner_id || ''
            }
        }));
    } catch (error) {
        console.error('Error fetching contact leads:', error);
        return [];
    }
}
```

### Referral Submission

```typescript
export async function submitReferral(referral: ReferralSubmission): Promise<void> {
    try {
        const response = await api.post('/leads/referral', {
            Last_Name: referral.lastName,
            First_Name: referral.firstName,
            Email: referral.email,
            Company: referral.company,
            Business_Type: referral.businessType,
            Title: referral.title,
            Description: referral.description,
        });
        
        const leadData = response.data?.leadData?.data?.[0];
        const noteData = response.data?.noteData?.data?.[0];
        
        if (leadData?.code === 'DUPLICATE_DATA') {
            throw new Error(
                `A referral with this email already exists (Lead ID: ${leadData.details.id})`
            );
        }
        
        if (leadData?.code !== 'SUCCESS') {
            throw new Error(
                leadData?.message || 'Failed to create lead. Please try again later.'
            );
        }
        
        if (noteData?.code !== 'SUCCESS') {
            throw new Error(
                noteData?.message || 'Failed to create note. Please try again later.'
            );
        }
        
        console.log('Referral submitted successfully:', {
            leadId: leadData.details.id,
            noteId: noteData.details.id,
        });
    } catch (error) {
        handleApiError(error);
    }
}
```

---

## 🗺️ Data Flow Summary

### User Creation Flow
1. **Zoho CRM**: Partner/Contact created
2. **Webhook**: Triggers portal user creation
3. **Portal DB**: User record created with `partner_id` linking to Zoho
4. **Email**: Welcome email sent with credentials

### Referral Submission Flow
1. **Frontend**: User submits referral form
2. **Backend**: Creates Lead in Zoho CRM with `StrategicPartnerId`
3. **Backend**: Adds Note to Lead with description
4. **Backend**: Updates Lead with Contact association (for sub-accounts)
5. **Email**: Confirmation sent to user and admin

### Data Retrieval Flow
1. **Frontend**: Requests lead data
2. **Backend**: Fetches from Zoho CRM using search criteria
3. **Backend**: Enriches with local user data where needed
4. **Frontend**: Displays data in tables/dashboards

### Key Zoho CRM Field Mappings
- **`StrategicPartnerId`**: Portal user UUID for lead attribution
- **`Vendor.id`**: Zoho Vendor ID for partner association
- **`Contact_Name.id`**: Zoho Contact ID for sub-account leads
- **`Lead_Status`**: Lead progression tracking
- **`Lead_Source`**: Always "Strategic Partner" for portal submissions

This integration enables seamless bidirectional data flow between the portal and Zoho CRM while maintaining proper user attribution and hierarchical relationships.