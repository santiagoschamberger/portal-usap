require('dotenv').config();

// Manual Zoho CRM test using fetch instead of axios
async function testZohoManual() {
  console.log('🔍 Manual Zoho CRM Test\n');
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
      name: 'Zoho Token Refresh',
      test: async () => {
        try {
          const response = await fetch('https://accounts.zoho.com/oauth/v2/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              refresh_token: process.env.ZOHO_REFRESH_TOKEN,
              client_id: process.env.ZOHO_CLIENT_ID,
              client_secret: process.env.ZOHO_CLIENT_SECRET,
              grant_type: 'refresh_token',
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            return { 
              status: 'FAIL', 
              message: `Token refresh failed: ${response.status} ${response.statusText}`,
              details: errorText
            };
          }

          const data = await response.json();
          
          if (data.access_token) {
            return { 
              status: 'PASS', 
              message: 'Successfully obtained access token',
              details: `Token expires in ${data.expires_in} seconds`
            };
          } else {
            return { 
              status: 'FAIL', 
              message: 'No access token in response',
              details: data
            };
          }
        } catch (error) {
          return { 
            status: 'FAIL', 
            message: `Token refresh error: ${error.message}`,
            details: error.toString()
          };
        }
      }
    },
    {
      name: 'Zoho CRM API Access',
      test: async () => {
        try {
          // First get a token
          const tokenResponse = await fetch('https://accounts.zoho.com/oauth/v2/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              refresh_token: process.env.ZOHO_REFRESH_TOKEN,
              client_id: process.env.ZOHO_CLIENT_ID,
              client_secret: process.env.ZOHO_CLIENT_SECRET,
              grant_type: 'refresh_token',
            }),
          });

          if (!tokenResponse.ok) {
            return { 
              status: 'FAIL', 
              message: 'Failed to get access token for API test'
            };
          }

          const tokenData = await tokenResponse.json();
          const accessToken = tokenData.access_token;

          // Test CRM API access
          const crmResponse = await fetch('https://www.zohoapis.com/crm/v3/settings/modules', {
            headers: {
              'Authorization': `Zoho-oauthtoken ${accessToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (crmResponse.ok) {
            return { 
              status: 'PASS', 
              message: 'Zoho CRM API accessible'
            };
          } else {
            const errorText = await crmResponse.text();
            return { 
              status: 'FAIL', 
              message: `CRM API access failed: ${crmResponse.status} ${crmResponse.statusText}`,
              details: errorText
            };
          }
        } catch (error) {
          return { 
            status: 'FAIL', 
            message: `CRM API test error: ${error.message}`,
            details: error.toString()
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
    console.log('🎉 Zoho CRM integration is working perfectly!');
    console.log('\n📝 What this means:');
    console.log('✅ Your Zoho credentials are valid');
    console.log('✅ You can authenticate with Zoho CRM');
    console.log('✅ You can access the Zoho CRM API');
    console.log('✅ The integration is ready for use');
  } else {
    console.log('⚠️  Some tests failed. Check the details above.');
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Verify your Zoho credentials are correct');
    console.log('2. Check if your Zoho account has API access');
    console.log('3. Ensure your refresh token is valid');
  }
}

// Run the test
testZohoManual().catch(console.error); 