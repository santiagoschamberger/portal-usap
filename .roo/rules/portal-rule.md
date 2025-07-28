---
description: 
globs: 
alwaysApply: true
---
# Soho CRM ↔ Partner Portal Integration

## 1. Overview
Build a partner-facing web dashboard that syncs with Soho CRM to:
- **Automatically provision** partner accounts (when approved in Soho CRM).
- **Invite partners** via email with portal credentials.
- **Let partners** and their sub-accounts create & track leads.
- **Sync** lead creations/status changes both directions.
- **Expose** a public lead‐capture form tied to a partner.

## 2. Architecture & Tech Stack
- **Frontend**: React (Next.js or CRA)
- **Backend**: Node.js (Express or NestJS)
- **DB**: PostgreSQL (or MongoDB), with tables/collections for Partners, Users, Leads, LeadStatusHistory
- **Auth**: JWT + role/permission checks
- **Email**: SendGrid or equivalent
- **Hosting/CI**: Vercel/Netlify (frontend) + Heroku/AWS (backend)
- **Sync**:  
  - **Webhooks** from Soho CRM → our backend  
  - **Outbound API** calls → Soho CRM

## 3. Data Models

### Partner
- `id` (UUID)  
- `sohoPartnerId`  
- `name`, `email`  
- `approved` (boolean flag in Soho CRM triggers account)

### User
- `id`, `partnerId`, `email`, `passwordHash`, `role` (`admin` or `sub`)

### Lead
- `id`, `partnerId`, `sohoLeadId`  
- `firstName`, `lastName`, `contactInfo`, `metadata…`

### LeadStatusHistory
- `id`, `leadId`, `oldStatus`, `newStatus`, `timestamp`

## 4. API Endpoints

| Method | Path                          | Description                                 |
|--------|-------------------------------|---------------------------------------------|
| POST   | `/webhooks/soho/partner`      | Receive “partner created/updated” events    |
| POST   | `/webhooks/soho/lead-status`  | Receive lead status change events           |
| POST   | `/invite`                     | Send portal invitation email                |
| POST   | `/auth/login`                 | Partner/sub-account login                   |
| GET    | `/dashboard/stats`            | Return lead counts & conversion %           |
| POST   | `/leads`                      | Create a new lead (portal or public form)   |
| GET    | `/leads`                      | List leads (with filters & pagination)      |
| PATCH  | `/leads/:id/status`           | Update lead status (portal → Soho CRM)      |
| GET    | `/partners/:id/sub-accounts`  | List sub-accounts under a main partner      |

## 5. User Flows

1. **Partner Approval**  
   - In Soho CRM: set `approved = true` → fires webhook → backend creates Partner & primary User → emails credentials.

2. **Partner Login**  
   - Partner uses emailed link → registers/sets password → JWT issued.

3. **Dashboard**  
   - Dashboard calls `/dashboard/stats` → shows total leads submitted, conversion rate.

4. **New Lead (Portal)**  
   - Partner/sub submits form → POST `/leads` → backend saves → calls Soho CRM API → stores returned `sohoLeadId`.

5. **Lead Status Update**  
   - In Soho CRM: status change → fires webhook `/webhooks/soho/lead-status` → backend updates local Lead and LeadStatusHistory → notifies portal via real-time (WebSocket or polling).

6. **Sub-Account Management**  
   - Main partner can create sub-accounts under their Partner ID; sub-accounts inherit permission to submit leads but can’t see parent’s private fields.

7. **Public Lead Form**  
   - Public URL (`/public-form?partnerId=…`) → anyone can submit lead on behalf of a partner (no login) → same flow as portal lead.

## 6. 20 Setup Tasks

1. **Initialize Repos & Envs**  
   - Create frontend & backend repositories  
   - Add `.env.example` with placeholders for SOHO_API_KEY, DB_URL, JWT_SECRET, EMAIL_API_KEY

2. **DB Schema & Migrations**  
   - Define tables/collections for Partner, User, Lead, LeadStatusHistory  
   - Write and run migrations

3. **Soho CRM API Client**  
   - Implement a service module for auth + CRUD calls to Soho CRM

4. **Webhook Listener**  
   - Build `/webhooks/soho/partner` endpoint to handle partner events  
   - Validate payload signature

5. **Conditional Account Provisioning**  
   - Read `approved` flag in webhook payload  
   - Only create portal User if `approved === true`

6. **Email Invitation Service**  
   - Integrate SendGrid (or similar)  
   - Create and test partner invite template

7. **Auth & Permissions**  
   - Setup JWT-based login (`/auth/login`)  
   - Middleware to guard routes by `role` (admin vs sub)

8. **User Registration Flow**  
   - Build registration page for first-time login via invite  
   - Save password hash (bcrypt)

9. **Dashboard Stats Endpoint**  
   - Implement `/dashboard/stats` to compute lead counts, conversion rate

10. **Lead Creation API**  
    - Build POST `/leads` → save to DB → call Soho CRM create-lead endpoint → store `sohoLeadId`

11. **Lead Listing API**  
    - GET `/leads` with filters, pagination, partner-scoped

12. **Lead Status Sync**  
    - Webhook `/webhooks/soho/lead-status` → update local lead + history

13. **Real-Time Notifications**  
    - Add WebSocket or polling so portal shows live status updates

14. **Sub-Account CRUD**  
    - Endpoints + UI for main partner to create/list sub-accounts

15. **Permission Enforcement**  
    - Ensure sub-accounts only see leads they created and partner basic info

16. **Public Form Module**  
    - Create `/public-form` page with minimal UI  
    - Accept `partnerId` query param → hidden field

17. **Security & Validation**  
    - Input validation (Joi or Zod)  
    - Rate-limiting on public form

18. **Logging & Error Handling**  
    - Centralized logger (winston/pino)  
    - Graceful error responses + retry logic for API failures

19. **Testing Suite**  
    - Unit tests for services & controllers  
    - Integration tests for webhooks & lead flows

20. **CI/CD & Deployment**  
    - Configure GitHub Actions (or similar) to run tests & deploy  
    - Deploy backend to Heroku/AWS, frontend to Vercel/Netlify

---

> _Once you’ve got this scaffold, you can hand off each task to Coursor to generate the boilerplate code and implement endpoints, UI components, webhooks, etc._  
