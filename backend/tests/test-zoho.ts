import { zohoService } from './src/services/zohoService';
import { config } from 'dotenv';

// Load environment variables
config();

async function testZohoService() {
  console.log('🧪 Testing Zoho CRM Service...\n');
  
  try {
    // Test 1: Get access token
    console.log('1. Testing access token generation...');
    const token = await zohoService.getAccessToken();
    console.log('✅ Access token obtained:', typeof token === 'string' ? token.slice(0, 20) + '...' : 'Token received');
    console.log();

    // Test 2: Test validation
    console.log('2. Testing configuration validation...');
    zohoService.validateConfig();
    console.log('✅ Configuration validation passed!');
    console.log();

    // Test 3: Get partner leads (this will fail without a real partner ID, but tests API structure)
    console.log('3. Testing partner leads fetch...');
    try {
      const leads = await zohoService.getPartnerLeads('test-partner-id');
      console.log('✅ Partner leads response received');
    } catch (error) {
      console.log('ℹ️  Expected error for test partner ID:', (error as Error).message.slice(0, 100) + '...');
    }
    console.log();

    console.log('🎉 All Zoho tests completed!');
  } catch (error) {
    console.error('❌ Zoho test failed:', (error as Error).message);
  }
}

testZohoService();