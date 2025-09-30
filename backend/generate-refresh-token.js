#!/usr/bin/env node
/**
 * Generate Zoho Refresh Token
 * Run this script with your authorization code to get a refresh token
 */

require('dotenv').config();
const axios = require('axios');

// Get values from .env or arguments
const CLIENT_ID = process.env.ZOHO_CLIENT_ID || process.argv[2];
const CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET || process.argv[3];
const AUTHORIZATION_CODE = process.argv[2] || process.argv[4];

if (!CLIENT_ID || !CLIENT_SECRET || !AUTHORIZATION_CODE) {
  console.log('❌ Missing required parameters');
  console.log('\nUsage:');
  console.log('  node generate-refresh-token.js <client_id> <client_secret> <authorization_code>');
  console.log('\nOr with .env:');
  console.log('  node generate-refresh-token.js <authorization_code>');
  console.log('\nExample:');
  console.log('  node generate-refresh-token.js 1000.abc123 def456 1000.xyz789');
  process.exit(1);
}

console.log('🔄 Generating Zoho Refresh Token...\n');

axios.post('https://accounts.zoho.com/oauth/v2/token', null, {
  params: {
    code: AUTHORIZATION_CODE,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: 'authorization_code',
    redirect_uri: 'http://localhost:3000/auth/callback'
  }
})
.then(response => {
  console.log('✅ Success! Here are your tokens:\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Access Token (expires in 1 hour):');
  console.log(response.data.access_token);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Refresh Token (use this in .env):');
  console.log(response.data.refresh_token);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('📝 Update your backend/.env file with:');
  console.log(`ZOHO_REFRESH_TOKEN=${response.data.refresh_token}\n`);
  
  console.log('✅ Token expires in:', response.data.expires_in, 'seconds');
})
.catch(error => {
  console.error('❌ Error generating token:\n');
  if (error.response) {
    console.error('Status:', error.response.status);
    console.error('Error:', error.response.data);
    console.error('\n💡 Common issues:');
    console.error('   - Authorization code already used (generate a new one)');
    console.error('   - Authorization code expired (generate a new one)');
    console.error('   - Wrong client_id or client_secret');
  } else {
    console.error(error.message);
  }
  process.exit(1);
});

