# Technical Context

## Technology Stack

### Frontend Architecture
- **Framework**: Next.js 14+ with App Router
- **UI Library**: React 18+ with TypeScript
- **Styling**: Tailwind CSS for responsive design
- **State Management**: Zustand for client state, React Query for server state
- **Forms**: React Hook Form with Zod validation
- **Real-Time**: Socket.IO client for live updates

### Backend Architecture
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js with middleware pattern
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Authentication**: JWT with refresh token strategy
- **Real-Time**: Socket.IO server for WebSocket connections
- **Email**: SendGrid for transactional emails
- **File Storage**: Supabase Storage for file uploads

### Integration Layer
- **Zoho CRM**: @zohocrm/nodejs-sdk-8.0 for API operations
- **Webhooks**: Express middleware for incoming CRM events
- **API Client**: Axios with retry and rate limiting
- **Data Sync**: Event-driven architecture with queue processing

## Database Design (Supabase/PostgreSQL)

### Core Tables
```sql
-- Partners table synced with Zoho CRM
partners (
  id UUID PRIMARY KEY,
  zoho_partner_id TEXT UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Portal users linked to partners
users (
  id UUID PRIMARY KEY,
  partner_id UUID REFERENCES partners(id),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  role TEXT CHECK (role IN ('admin', 'sub')),
  created_at TIMESTAMP,
  last_login TIMESTAMP
)

-- Leads with dual ID tracking
leads (
  id UUID PRIMARY KEY,
  partner_id UUID REFERENCES partners(id),
  zoho_lead_id TEXT UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  status TEXT,
  source TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Status change audit trail
lead_status_history (
  id UUID PRIMARY KEY,
  lead_id UUID REFERENCES leads(id),
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by TEXT, -- zoho_user_id or portal_user_id
  changed_at TIMESTAMP DEFAULT NOW()
)
```

### Security Model
- **Row Level Security (RLS)**: Supabase policies enforce partner data isolation
- **JWT Tokens**: Signed tokens with partner_id claims for authorization
- **API Key Rotation**: Environment-based key management for Zoho integration

## Zoho CRM Integration

### Authentication Setup
```javascript
// OAuth2 configuration for Zoho CRM v8 SDK
const zohoConfig = {
  clientId: process.env.ZOHO_CLIENT_ID,
  clientSecret: process.env.ZOHO_CLIENT_SECRET,
  refreshToken: process.env.ZOHO_REFRESH_TOKEN,
  environment: ZOHOCRMSDK.USDataCenter.PRODUCTION(), // or SANDBOX
  scopes: [
    'ZohoCRM.modules.ALL',
    'ZohoCRM.settings.fields.ALL',
    'ZohoCRM.settings.related_lists.ALL'
  ]
}
```

### Key API Operations
1. **Lead Creation**: Create leads in Zoho CRM with portal metadata
2. **Status Monitoring**: Periodic sync of lead status changes
3. **Partner Management**: Monitor partner approval status changes
4. **Field Mapping**: Custom field synchronization between systems

### Webhook Endpoints
```javascript
// Partner approval webhook
POST /webhooks/zoho/partner
// Lead status change webhook
POST /webhooks/zoho/lead-status
// General record update webhook
POST /webhooks/zoho/record-update
```

## Development Environment

### Local Setup
- **Database**: Supabase local development with Docker
- **Environment**: dotenv for configuration management
- **Development Server**: Concurrent frontend/backend development
- **Hot Reload**: Next.js dev server with API proxy to backend

### Required Environment Variables
```bash
# Database
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key

# Zoho CRM
ZOHO_CLIENT_ID=your_zoho_client_id
ZOHO_CLIENT_SECRET=your_zoho_client_secret
ZOHO_REFRESH_TOKEN=your_zoho_refresh_token
ZOHO_ENVIRONMENT=production

# Authentication
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret

# Email
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# Application
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
```

## Deployment Architecture

### Production Environment
- **Frontend**: Vercel for Next.js deployment with edge functions
- **Backend**: Railway or Render for Node.js API server
- **Database**: Supabase managed PostgreSQL
- **CDN**: Vercel Edge Network for global content delivery
- **Monitoring**: Sentry for error tracking, LogRocket for user sessions

### CI/CD Pipeline
- **Code Quality**: ESLint, Prettier, TypeScript checks
- **Testing**: Jest for unit tests, Playwright for E2E tests
- **Deployment**: GitHub Actions with environment-specific deployments
- **Database Migrations**: Supabase CLI for schema version control

## Performance Considerations

### Frontend Optimization
- **Code Splitting**: Route-based lazy loading
- **Image Optimization**: Next.js Image component with WebP
- **Caching**: SWR for client-side caching with revalidation
- **Bundle Analysis**: Regular bundle size monitoring

### Backend Optimization
- **Database Indexing**: Optimized queries with proper indexes
- **Connection Pooling**: Supabase handles connection management
- **Rate Limiting**: API endpoint protection
- **Caching Layer**: Redis for session storage and temporary data

### Integration Reliability
- **Retry Logic**: Exponential backoff for failed API calls
- **Circuit Breaker**: Prevent cascade failures to Zoho CRM
- **Queue Processing**: Background job processing for webhook events
- **Health Checks**: Endpoint monitoring and alerting

This technical foundation provides a scalable, maintainable, and secure platform for partner portal operations. 