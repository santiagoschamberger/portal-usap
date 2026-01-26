# Admin User Impersonation Feature

## Overview

The Admin User Impersonation feature allows system administrators to temporarily log in as any user in the portal for support, debugging, and troubleshooting purposes. This is a powerful administrative tool that includes comprehensive security measures and audit logging.

## Features

### 1. User Search & Discovery
- Search users by email, first name, or last name
- View user details including:
  - Full name and email
  - User role (admin, sub_account)
  - Partner organization
  - Partner type (partner, agent, ISO)
  - Account status (active/inactive)

### 2. Impersonation Controls
- One-click impersonation of any active user
- Cannot impersonate yourself
- Cannot impersonate inactive users
- Visual banner showing impersonation status
- Easy exit from impersonation mode

### 3. Security & Audit Trail
- All impersonation actions are logged to database
- Logs include:
  - Admin user who initiated impersonation
  - Target user being impersonated
  - Timestamp
  - IP address
  - User agent
  - Additional metadata
- Console logging for real-time monitoring
- Row-level security policies on audit logs

## User Interface

### Admin Users Page (`/admin/users`)
The main interface for user impersonation includes:

1. **Search Bar**: Search for users by email or name
2. **User List**: Shows matching users with:
   - User details and badges
   - Partner information
   - Role and status indicators
   - Impersonate button
3. **Security Notice**: Reminder about audit logging

### Impersonation Banner
When impersonating a user, a prominent yellow banner appears at the top of all pages showing:
- Current impersonated user
- Original admin user
- "Exit Impersonation" button

## API Endpoints

### 1. Search Users
```
GET /api/partners/users/search?query=<search_term>&limit=<number>
```

**Authentication**: Admin only

**Query Parameters**:
- `query` (optional): Search term for email, first name, or last name
- `limit` (optional): Maximum results to return (default: 20)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "admin",
      "partner_id": "uuid",
      "is_active": true,
      "partners": {
        "id": "uuid",
        "name": "Partner Name",
        "partner_type": "partner"
      }
    }
  ]
}
```

### 2. Impersonate User
```
POST /api/partners/impersonate-any/:userId
```

**Authentication**: Admin only

**Parameters**:
- `userId`: UUID of the user to impersonate

**Response**:
```json
{
  "success": true,
  "message": "Impersonation started",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "partner_id": "uuid",
      "role": "admin",
      "first_name": "John",
      "last_name": "Doe",
      "is_impersonating": true,
      "original_user_id": "admin-uuid",
      "original_user_email": "admin@example.com",
      "original_user_role": "admin"
    },
    "token": "jwt-token",
    "partner": {
      "id": "uuid",
      "name": "Partner Name",
      "partner_type": "partner"
    }
  }
}
```

### 3. Legacy Sub-Account Impersonation
```
POST /api/partners/impersonate/:subAccountId
```

**Authentication**: Admin only (partner-scoped)

This endpoint is maintained for backward compatibility and only allows impersonating sub-accounts within the same partner organization.

## Database Schema

### Audit Logs Table
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  target_user_id UUID REFERENCES auth.users(id),
  admin_email TEXT NOT NULL,
  target_email TEXT,
  target_partner_name TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Helper Function
```sql
log_impersonation(
  p_action TEXT,
  p_admin_user_id UUID,
  p_target_user_id UUID,
  p_admin_email TEXT,
  p_target_email TEXT,
  p_target_partner_name TEXT,
  p_metadata JSONB,
  p_ip_address TEXT,
  p_user_agent TEXT
) RETURNS UUID
```

### View
```sql
CREATE VIEW recent_impersonations AS
SELECT 
  al.id,
  al.action,
  al.admin_email,
  al.target_email,
  al.target_partner_name,
  al.created_at,
  al.metadata,
  u1.first_name as admin_first_name,
  u1.last_name as admin_last_name,
  u2.first_name as target_first_name,
  u2.last_name as target_last_name
FROM audit_logs al
LEFT JOIN users u1 ON al.admin_user_id = u1.id
LEFT JOIN users u2 ON al.target_user_id = u2.id
WHERE al.action IN ('impersonate_user', 'stop_impersonation')
ORDER BY al.created_at DESC;
```

## Frontend Components

### 1. UserImpersonation Component
**Location**: `/frontend/src/components/admin/UserImpersonation.tsx`

Main component for searching and impersonating users. Includes:
- Search interface
- User list with details
- Impersonation controls
- Error handling
- Loading states

### 2. ImpersonationBanner Component
**Location**: `/frontend/src/components/admin/ImpersonationBanner.tsx`

Persistent banner shown during impersonation. Features:
- Shows current impersonated user
- Shows original admin user
- Exit impersonation button
- Prominent visual styling

### 3. Auth Store Updates
**Location**: `/frontend/src/lib/auth-store.ts`

Enhanced with impersonation state management:
- `isImpersonating`: Boolean flag
- `originalUser`: Stored admin user
- `startImpersonation()`: Begin impersonation
- `stopImpersonation()`: Return to admin account

## Security Considerations

### Access Control
1. **Admin-Only Access**: All impersonation endpoints require admin role
2. **Active Users Only**: Cannot impersonate inactive accounts
3. **Self-Impersonation Prevention**: Cannot impersonate yourself

### Audit Trail
1. **Database Logging**: All actions logged to `audit_logs` table
2. **Console Logging**: Real-time logging for monitoring
3. **Metadata Capture**: IP address, user agent, timestamps
4. **RLS Policies**: Users can view their own audit logs

### Best Practices
1. Use impersonation only when necessary
2. Exit impersonation mode when finished
3. Document the reason for impersonation in support tickets
4. Regularly review audit logs for unusual activity
5. Limit admin access to trusted personnel

## Usage Examples

### As an Admin User

1. **Navigate to User Management**:
   - Go to `/admin/users`
   - You'll see the User Impersonation card

2. **Search for a User**:
   - Enter email, first name, or last name in search box
   - Click "Search" or press Enter
   - Review the list of matching users

3. **Impersonate a User**:
   - Click "Impersonate" button next to the desired user
   - You'll be redirected to the dashboard as that user
   - Yellow banner appears at top showing impersonation status

4. **Navigate as the User**:
   - Browse the portal as the impersonated user
   - Test features, reproduce issues, etc.
   - All actions are performed as that user

5. **Exit Impersonation**:
   - Click "Exit Impersonation" in the yellow banner
   - You'll return to the admin users page as yourself

## Troubleshooting

### Cannot Find User
- Verify the user exists in the system
- Check spelling of search terms
- Try searching by email instead of name

### Cannot Impersonate User
- Verify the user account is active
- Ensure you're not trying to impersonate yourself
- Check that you have admin role

### Impersonation Not Working
- Check browser console for errors
- Verify API endpoint is accessible
- Check that database migration 025 has been applied

### Audit Logs Not Recording
- Verify migration 025 was applied successfully
- Check database permissions
- Review server logs for errors

## Migration Instructions

### Database Setup
Run the migration to create audit logging infrastructure:

```bash
# Apply migration 025
psql $DATABASE_URL -f backend/database/migrations/025_add_impersonation_audit_log.sql
```

### Verification
```sql
-- Check that table exists
SELECT * FROM audit_logs LIMIT 1;

-- Check that function exists
SELECT log_impersonation(
  'test_action',
  auth.uid(),
  auth.uid(),
  'test@example.com',
  'test@example.com'
);

-- View recent impersonations
SELECT * FROM recent_impersonations;
```

## Future Enhancements

### Potential Features
1. **Time-Limited Impersonation**: Auto-expire after X minutes
2. **Impersonation Reasons**: Require reason/ticket number
3. **Enhanced Audit Dashboard**: Visual analytics of impersonation usage
4. **Notifications**: Alert users when they're being impersonated
5. **Approval Workflow**: Require approval for sensitive impersonations
6. **Session Recording**: Record actions taken during impersonation

### Performance Optimizations
1. **User Search Caching**: Cache search results
2. **Pagination**: Add pagination for large user lists
3. **Advanced Filters**: Filter by role, partner, status, etc.

## Related Documentation

- [User Management](./USER_MANAGEMENT.md)
- [Security Policies](../security/POLICIES.md)
- [Audit Logging](../security/AUDIT_LOGGING.md)
- [Admin Features](./ADMIN_FEATURES.md)

## Support

For issues or questions about the impersonation feature:
1. Check this documentation
2. Review audit logs for error patterns
3. Check server logs for detailed error messages
4. Contact the development team

---

**Last Updated**: January 26, 2026
**Version**: 1.0.0
**Status**: Production Ready
