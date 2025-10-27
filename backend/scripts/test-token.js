const axios = require('axios');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

async function testToken() {
  console.log('Testing Zoho Token...\n');
  
  console.log('Environment variables:');
  console.log('- ZOHO_CLIENT_ID:', process.env.ZOHO_CLIENT_ID ? 'Set (length: ' + process.env.ZOHO_CLIENT_ID.length + ')' : 'Missing');
  console.log('- ZOHO_CLIENT_SECRET:', process.env.ZOHO_CLIENT_SECRET ? 'Set (length: ' + process.env.ZOHO_CLIENT_SECRET.length + ')' : 'Missing');
  console.log('- ZOHO_REFRESH_TOKEN:', process.env.ZOHO_REFRESH_TOKEN ? 'Set (length: ' + process.env.ZOHO_REFRESH_TOKEN.length + ')' : 'Missing');
  console.log();

  try {
    console.log('Attempting to get access token...');
    const response = await axios.post('https://accounts.zoho.com/oauth/v2/token', null, {
      params: {
        refresh_token: process.env.ZOHO_REFRESH_TOKEN,
        client_id: process.env.ZOHO_CLIENT_ID,
        client_secret: process.env.ZOHO_CLIENT_SECRET,
        grant_type: 'refresh_token',
      },
    });

    console.log('✅ Success! Access token obtained');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.response ? error.response.data : error.message);
  }
}

testToken();


