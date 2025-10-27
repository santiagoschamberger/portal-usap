require('dotenv').config();

// Simple Zoho CRM test without external dependencies
async function testZohoSimple() {
  console.log('🔍 Simple Zoho CRM Test\n');
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
      name: 'Zoho Service Import',
      test: () => {
        try {
          // Test if we can import the Zoho service
          const { zohoService } = require('./src/services/zohoService');
          return { status: 'PASS', message: 'Zoho service can be imported' };
        } catch (error) {
          return { status: 'FAIL', message: `Import failed: ${error.message}` };
        }
      }
    },
    {
      name: 'Zoho Service Configuration',
      test: () => {
        try {
          const { zohoService } = require('./src/services/zohoService');
          zohoService.validateConfig();
          return { status: 'PASS', message: 'Zoho service configuration is valid' };
        } catch (error) {
          return { status: 'FAIL', message: `Configuration error: ${error.message}` };
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
      const result = test.test();
      console.log(`Status: ${result.status === 'PASS' ? '✅' : '❌'} ${result.status}`);
      console.log(`Message: ${result.message}`);
      
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
    console.log('🎉 Basic Zoho setup is working!');
    console.log('\n📝 Next Steps:');
    console.log('1. Test authentication with: npm run test:zoho:basic');
    console.log('2. Test full integration when server is running');
    console.log('3. Check Zoho CRM API connectivity manually');
  } else {
    console.log('⚠️  Some tests failed. Check the details above.');
  }
}

// Run the test
testZohoSimple().catch(console.error); 