# Zoho CRM Integration Testing Guide

This guide provides comprehensive testing procedures for the Zoho CRM integration in the USA Payments Partner Portal.

## Prerequisites

Before running tests, ensure you have:

1. **Environment Variables Set** in your `.env` file:
   ```bash
   ZOHO_CLIENT_ID=your_zoho_client_id
   ZOHO_CLIENT_SECRET=your_zoho_client_secret
   ZOHO_REFRESH_TOKEN=your_zoho_refresh_token
   ```

2. **Zoho CRM API Access**:
   - Valid OAuth2 credentials
   - Proper API permissions for Leads, Vendors, and Notes
   - Active Zoho CRM account

## Quick Health Check

Run a basic connectivity test:

```bash
cd backend
npm run test:zoho:health
```

This will test:
- ✅ Environment variable configuration
- ✅ Authentication token generation
- ✅ API connectivity

## Basic Functionality Test

Test core Zoho service functions:

```bash
npm run test:zoho:basic
```

This tests:
- ✅ Access token generation and caching
- ✅ Configuration validation
- ✅ API response structure

## Comprehensive Integration Test

Run the full test suite (creates test data):

```bash
npm run test:zoho:comprehensive
```

This comprehensive test includes:
- ✅ Environment configuration validation
- ✅ Authentication and token management
- ✅ API connectivity verification
- ✅ Vendor creation (creates test vendor)
- ✅ Lead creation (creates test lead)
- ✅ Lead update functionality
- ✅ Lead search by partner criteria
- ✅ Note creation for leads
- ✅ Error handling for invalid requests
- ✅ Test data cleanup (skipped for manual verification)

## Manual Testing Procedures

### 1. Test Lead Creation via API

```bash
curl -X POST http://localhost:5001/api/leads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "company": "Test Company",
    "businessType": "Restaurant",
    "notes": "Test lead from partner portal"
  }'
```

### 2. Test Webhook Reception

Send a test webhook to verify partner creation:

```bash
curl -X POST http://localhost:5001/api/webhooks/zoho/partner \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": 123456,
    "token": "test_token",
    "module": "Vendors",
    "operation": "INSERT",
    "resource_uri": "https://www.zohoapis.com/crm/v2/Vendors/123456789",
    "resource_id": "123456789",
    "channel_expiry": "2024-12-31T23:59:59+00:00"
  }'
```

### 3. Test Real-time Updates

Check Socket.IO connection for real-time updates:

```javascript
// In browser console
const socket = io('http://localhost:5001');
socket.on('connect', () => {
  console.log('Connected to real-time updates');
});
socket.on('lead:update', (data) => {
  console.log('Lead update received:', data);
});
```

## Expected Test Results

### Successful Health Check
```
🔍 Zoho CRM Health Check

========================================
✅ Environment Variables: All required environment variables are set
✅ Authentication: Successfully obtained access token
✅ API Connectivity: Successfully connected to Zoho CRM API

========================================
🎉 All health checks passed! Zoho CRM is ready.
```

### Successful Comprehensive Test
```
🧪 Comprehensive Zoho CRM Integration Test Suite

============================================================
✅ Environment Configuration: All required environment variables are set
✅ Authentication: Successfully obtained access token
✅ API Connectivity: Successfully connected to Zoho CRM API
✅ Vendor Creation: Successfully created test vendor
✅ Lead Creation: Successfully created test lead
✅ Lead Update: Successfully updated test lead
✅ Lead Search: Successfully searched for partner leads
✅ Note Creation: Successfully created test note
✅ Error Handling: Properly handled invalid lead ID error
⏭️ Test Cleanup: Cleanup skipped - test data preserved for manual verification

============================================================
📊 TEST RESULTS SUMMARY
============================================================
Total Tests: 10
✅ Passed: 9
❌ Failed: 0
⏭️ Skipped: 1
Success Rate: 90.0%

✅ All critical tests passed! Some tests were skipped due to missing prerequisites.
```

## Troubleshooting Common Issues

### 1. Authentication Failures

**Error**: `Authentication failed: Failed to get Zoho access token`

**Solutions**:
- Verify `ZOHO_REFRESH_TOKEN` is valid and not expired
- Check `ZOHO_CLIENT_ID` and `ZOHO_CLIENT_SECRET` are correct
- Ensure OAuth2 app is properly configured in Zoho Developer Console

### 2. API Permission Errors

**Error**: `API error: 403`

**Solutions**:
- Verify API scopes include: `ZohoCRM.modules.ALL`
- Check user permissions in Zoho CRM
- Ensure API access is enabled for your Zoho account

### 3. Network Connectivity Issues

**Error**: `Connection failed: ECONNREFUSED`

**Solutions**:
- Check internet connectivity
- Verify firewall settings
- Ensure no proxy interference

### 4. Invalid Response Format

**Error**: `Lead creation response invalid`

**Solutions**:
- Check Zoho CRM field mappings
- Verify required fields are provided
- Ensure custom fields exist in Zoho CRM

## Environment Setup Verification

### 1. Check Environment Variables

```bash
# In backend directory
node -e "
const config = require('dotenv').config();
console.log('ZOHO_CLIENT_ID:', process.env.ZOHO_CLIENT_ID ? 'SET' : 'MISSING');
console.log('ZOHO_CLIENT_SECRET:', process.env.ZOHO_CLIENT_SECRET ? 'SET' : 'MISSING');
console.log('ZOHO_REFRESH_TOKEN:', process.env.ZOHO_REFRESH_TOKEN ? 'SET' : 'MISSING');
"
```

### 2. Verify Zoho Developer Console

1. Go to [Zoho Developer Console](https://api-console.zoho.com/)
2. Check your app configuration
3. Verify OAuth2 scopes include CRM permissions
4. Ensure refresh token is valid

### 3. Test Zoho API Directly

```bash
curl -X POST https://accounts.zoho.com/oauth/v2/token \
  -d "refresh_token=YOUR_REFRESH_TOKEN" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "grant_type=refresh_token"
```

## Production Readiness Checklist

Before deploying to production, ensure:

- [ ] All health checks pass
- [ ] Comprehensive tests pass
- [ ] Error handling works correctly
- [ ] Rate limiting is configured
- [ ] Logging is properly set up
- [ ] Webhook endpoints are secured
- [ ] Environment variables are properly set in production
- [ ] Zoho CRM field mappings are verified
- [ ] Real-time updates are working
- [ ] Test data is cleaned up

## Monitoring and Alerts

Set up monitoring for:

1. **Authentication Failures**: Monitor token refresh errors
2. **API Response Times**: Track Zoho API performance
3. **Webhook Failures**: Monitor webhook processing errors
4. **Lead Creation Success Rate**: Track lead submission success
5. **Real-time Connection Status**: Monitor Socket.IO connections

## Support and Debugging

If tests fail:

1. **Check Logs**: Review server logs for detailed error messages
2. **Verify Credentials**: Ensure all Zoho credentials are correct
3. **Test API Directly**: Use curl or Postman to test Zoho API directly
4. **Check Network**: Verify network connectivity to Zoho APIs
5. **Review Permissions**: Ensure proper API permissions are granted

For additional support, refer to:
- [Zoho CRM API Documentation](https://www.zoho.com/crm/developer/docs/api/)
- [Zoho Developer Console](https://api-console.zoho.com/)
- [Project Memory Bank](./memory-bank/) for technical context 