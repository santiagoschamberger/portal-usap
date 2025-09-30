require('dotenv').config();

// Test Zoho CRM configuration without importing TypeScript files
async function testZohoConfig() {
  console.log('🔍 Zoho CRM Configuration Test\n');
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
      name: 'Environment Variable Values',
      test: () => {
        const clientId = process.env.ZOHO_CLIENT_ID;
        const clientSecret = process.env.ZOHO_CLIENT_SECRET;
        const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
        
        const results = [];
        
        if (!clientId || clientId.length < 10) {
          results.push('ZOHO_CLIENT_ID appears invalid');
        }
        if (!clientSecret || clientSecret.length < 10) {
          results.push('ZOHO_CLIENT_SECRET appears invalid');
        }
        if (!refreshToken || refreshToken.length < 10) {
          results.push('ZOHO_REFRESH_TOKEN appears invalid');
        }
        
        if (results.length > 0) {
          return { status: 'FAIL', message: results.join(', ') };
        }
        
        return { status: 'PASS', message: 'All environment variables have valid values' };
      }
    },
    {
      name: 'Zoho Service File Exists',
      test: () => {
        const fs = require('fs');
        const path = require('path');
        
        const servicePath = path.join(__dirname, 'src', 'services', 'zohoService.ts');
        
        if (fs.existsSync(servicePath)) {
          return { status: 'PASS', message: 'Zoho service file exists' };
        } else {
          return { status: 'FAIL', message: 'Zoho service file not found' };
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
    console.log('🎉 Zoho configuration is valid!');
    console.log('\n📝 Next Steps:');
    console.log('1. Start the server: npm run dev');
    console.log('2. Test the health endpoint: curl http://localhost:5001/health');
    console.log('3. Test Zoho API calls through the server endpoints');
  } else {
    console.log('⚠️  Configuration issues found. Please fix the errors above.');
  }
}

// Run the test
testZohoConfig().catch(console.error); 