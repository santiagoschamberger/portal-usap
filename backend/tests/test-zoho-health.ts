import { zohoService } from './src/services/zohoService';
import { config } from 'dotenv';
import axios from 'axios';

// Load environment variables
config();

async function healthCheck() {
  console.log('🔍 Zoho CRM Health Check\n');
  console.log('=' .repeat(40));

  const checks = [
    {
      name: 'Environment Variables',
      test: () => {
        try {
          zohoService.validateConfig();
          return { status: 'PASS', message: 'All required environment variables are set' };
        } catch (error) {
          return { status: 'FAIL', message: `Missing variables: ${(error as Error).message}` };
        }
      }
    },
    {
      name: 'Authentication',
      test: async () => {
        try {
          const token = await zohoService.getAccessToken();
          if (token && typeof token === 'string' && token.length > 0) {
            return { status: 'PASS', message: 'Successfully obtained access token' };
          } else {
            return { status: 'FAIL', message: 'Invalid token received' };
          }
        } catch (error) {
          return { status: 'FAIL', message: `Authentication failed: ${(error as Error).message}` };
        }
      }
    },
    {
      name: 'API Connectivity',
      test: async () => {
        try {
          const token = await zohoService.getAccessToken();
          const response = await axios.get('https://www.zohoapis.com/crm/v2/org', {
            headers: {
              'Authorization': `Zoho-oauthtoken ${token}`,
              'Content-Type': 'application/json',
            },
            timeout: 10000 // 10 second timeout
          });
          
          if (response.status === 200) {
            return { status: 'PASS', message: 'Successfully connected to Zoho CRM API' };
          } else {
            return { status: 'FAIL', message: `Unexpected response status: ${response.status}` };
          }
        } catch (error) {
          if (axios.isAxiosError(error)) {
            if (error.code === 'ECONNABORTED') {
              return { status: 'FAIL', message: 'API request timed out' };
            } else if (error.response?.status === 401) {
              return { status: 'FAIL', message: 'Authentication failed - check credentials' };
            } else if (error.response?.status === 403) {
              return { status: 'FAIL', message: 'Access denied - check API permissions' };
            } else {
              return { status: 'FAIL', message: `API error: ${error.response?.status || error.message}` };
            }
          }
          return { status: 'FAIL', message: `Connection failed: ${(error as Error).message}` };
        }
      }
    }
  ];

  let allPassed = true;

  for (const check of checks) {
    const result = await check.test();
    const icon = result.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} ${check.name}: ${result.message}`);
    
    if (result.status === 'FAIL') {
      allPassed = false;
    }
  }

  console.log('\n' + '=' .repeat(40));
  
  if (allPassed) {
    console.log('🎉 All health checks passed! Zoho CRM is ready.');
  } else {
    console.log('⚠️  Some health checks failed. Please check the errors above.');
  }

  return allPassed;
}

// Run health check
healthCheck().catch(console.error); 