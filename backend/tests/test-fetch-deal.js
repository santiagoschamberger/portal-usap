require('dotenv').config();
const { zohoService } = require('./dist/services/zohoService');

/**
 * Test script to fetch a sample deal from Zoho CRM
 * This helps us understand the deal structure for database design
 */
async function fetchSampleDeal() {
  console.log('🔍 Fetching Sample Deal from Zoho CRM\n');
  console.log('='.repeat(60));

  try {
    // Test 1: Get access token
    console.log('\n📝 Step 1: Getting Zoho access token...');
    const token = await zohoService.getAccessToken();
    console.log('✅ Access token obtained');

    // Test 2: Fetch all deals (just first one)
    console.log('\n📝 Step 2: Fetching deals from Zoho...');
    const axios = require('axios');
    
    const response = await axios.get('https://www.zohoapis.com/crm/v2/Deals', {
      headers: {
        'Authorization': `Zoho-oauthtoken ${token}`,
        'Content-Type': 'application/json'
      },
      params: {
        per_page: 1 // Get just 1 deal to see structure
      }
    });

    if (response.data && response.data.data && response.data.data.length > 0) {
      const deal = response.data.data[0];
      
      console.log('\n✅ Sample Deal Found!');
      console.log('='.repeat(60));
      console.log(JSON.stringify(deal, null, 2));
      console.log('='.repeat(60));
      
      console.log('\n📊 Deal Fields Summary:');
      console.log('-'.repeat(60));
      Object.keys(deal).forEach(key => {
        const value = deal[key];
        const type = Array.isArray(value) ? 'array' : typeof value;
        console.log(`  ${key}: ${type}`);
      });
      
    } else {
      console.log('⚠️  No deals found in Zoho CRM');
      console.log('💡 Please convert a lead to a deal in Zoho first');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
fetchSampleDeal().catch(console.error);

