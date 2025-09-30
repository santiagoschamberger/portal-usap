require('dotenv').config();
const axios = require('axios');

// Simple Zoho CRM test without server dependencies
async function testZohoDirect() {
  console.log('🔍 Direct Zoho CRM Test\n');
  console.log('=' .repeat(40));

  const tests = [
    {
      name: 'Environment Variables',
      test: () => {
        const required = ['ZOHO_CLIENT_ID', 'ZOHO_CLIENT_SECRET', 'ZOHO_REFRESH_TOKEN'];
        const missing = required.filter(key => !process.env[key]);
        
        if (missing.length > 0) {
          return { status: 'FAIL', message: `Missing: ${missing.join(', ')}` };
        }
        return { status: 'PASS', message: 'All environment variables set' };
      }
    },
    {
      name: 'Zoho API Connectivity',
      test: async () => {
        try {
          // Test basic Zoho API connectivity
          const response = await axios.get('https://accounts.zoho.com/oauth/user/info', {
            headers: {
              'Authorization': `Bearer ${process.env.ZOHO_REFRESH_TOKEN}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          });
          
          if (response.status === 200) {
            return { status: 'PASS', message: 'Zoho API accessible' };
          } else {
            return { status: 'FAIL', message: `API returned status ${response.status}` };
          }
        } catch (error) {
          return { 
            status: 'FAIL', 
            message: `API connection failed: ${error.message}`,
            details: error.response?.data || error.message
          };
        }
      }
    },
    {
      name: 'Zoho CRM Endpoint',
      test: async () => {
        try {
          // Test Zoho CRM specific endpoint
          const response = await axios.get('https://www.zohoapis.com/crm/v3/settings/modules', {
            headers: {
              'Authorization': `Zoho-oauthtoken ${process.env.ZOHO_REFRESH_TOKEN}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          });
          
          if (response.status === 200) {
            return { status: 'PASS', message: 'Zoho CRM API accessible' };
          } else {
            return { status: 'FAIL', message: `CRM API returned status ${response.status}` };
          }
        } catch (error) {
          return { 
            status: 'FAIL', 
            message: `CRM API connection failed: ${error.message}`,
            details: error.response?.data || error.message
          };
        }
      }
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    console.log(`\n📋 ${test.name}`);
    console.log('─'.repeat(40));
    
    try {
      const result = await test.test();
      console.log(`Status: ${result.status === 'PASS' ? '✅' : '❌'} ${result.status}`);
      console.log(`Message: ${result.message}`);
      
      if (result.details) {
        console.log(`Details: ${JSON.stringify(result.details, null, 2)}`);
      }
      
      if (result.status === 'PASS') {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log(`Status: ❌ ERROR`);
      console.log(`Message: Test execution failed: ${error.message}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(40));
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed! Zoho CRM integration is working.');
  } else {
    console.log('⚠️  Some tests failed. Check the details above.');
  }
}

// Run the test
testZohoDirect().catch(console.error); 