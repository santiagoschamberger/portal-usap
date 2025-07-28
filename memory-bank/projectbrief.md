# Partner Portal Project Brief

## Vision
Build a comprehensive partner-facing web dashboard that seamlessly integrates with Zoho CRM to automate partner lifecycle management, lead generation, and bi-directional data synchronization.

## Core Requirements

### 1. Partner Account Management
- **Automatic Provisioning**: Partner accounts are auto-created when approved in Zoho CRM
- **Email Invitations**: Automated invitation system with portal credentials
- **Role-Based Access**: Main partners and sub-accounts with appropriate permissions
- **Authentication**: JWT-based secure authentication system

### 2. Lead Management System
- **Lead Creation**: Partners can create and submit leads through the portal
- **Status Tracking**: Real-time lead status updates from Zoho CRM
- **History Tracking**: Complete audit trail of lead status changes
- **Public Form**: External lead capture form tied to specific partners

### 3. Bi-Directional CRM Sync
- **Webhook Integration**: Real-time data sync from Zoho CRM to portal
- **API Integration**: Portal-to-CRM data push for lead creation and updates
- **Data Consistency**: Maintain data integrity across both systems
- **Error Handling**: Robust error handling and retry mechanisms

### 4. Dashboard & Analytics
- **Performance Metrics**: Lead counts, conversion rates, status distributions
- **Partner Insights**: Individual partner performance tracking
- **Real-Time Updates**: Live dashboard updates via WebSocket or polling

## Technical Foundation

### Architecture
- **Frontend**: React with Next.js for SSR and optimal performance
- **Backend**: Node.js with Express for API services
- **Database**: Supabase (PostgreSQL) for scalable, managed database
- **Authentication**: JWT with role-based permissions
- **Real-Time**: WebSocket or Server-Sent Events for live updates

### Integration Points
- **Zoho CRM API**: v8 NodeJS SDK for all CRM operations
- **Webhooks**: Inbound webhook endpoints for CRM event processing
- **Email Service**: Transactional emails for invitations and notifications
- **File Storage**: Secure file handling for lead attachments

### Key Data Models
- **Partners**: CRM sync, approval status, contact information
- **Users**: Portal accounts linked to partners with role management
- **Leads**: Complete lead lifecycle with CRM synchronization
- **Lead Status History**: Audit trail for all status changes

## Success Criteria
1. **Automated Workflow**: Partners are automatically provisioned upon CRM approval
2. **Seamless Sync**: Real-time bi-directional data flow between portal and CRM
3. **User Experience**: Intuitive portal interface with responsive design
4. **Scalability**: System handles growing partner base and lead volume
5. **Security**: Secure authentication and data protection compliance

## Scope Boundaries
- **In Scope**: Partner management, lead lifecycle, CRM integration, dashboard analytics
- **Out of Scope**: Complex CRM customizations, advanced reporting beyond basic metrics
- **Future Considerations**: Multi-tenant architecture, advanced analytics, mobile app

This project establishes the foundation for a scalable partner ecosystem management platform that grows with business needs. 