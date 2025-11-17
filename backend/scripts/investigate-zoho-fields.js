/**
 * Zoho Field Investigation Script
 * 
 * This script investigates Zoho CRM fields to document:
 * - Partner Type field and values
 * - State field and values
 * - Lead Status field and values
 * - Deal Stage field and values
 * - Approval Time Stamp field
 * 
 * Run with: node backend/scripts/investigate-zoho-fields.js
 */

const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'https://www.zohoapis.com/crm/v2';
const AUTH_URL = 'https://accounts.zoho.com/oauth/v2/token';

let cachedToken = null;
let tokenExpiryTime = null;

async function getAccessToken() {
  // Return cached token if still valid
  if (cachedToken && tokenExpiryTime && tokenExpiryTime > Date.now()) {
    return cachedToken;
  }

  try {
    const response = await axios.post(AUTH_URL, null, {
      params: {
        refresh_token: process.env.ZOHO_REFRESH_TOKEN,
        client_id: process.env.ZOHO_CLIENT_ID,
        client_secret: process.env.ZOHO_CLIENT_SECRET,
        grant_type: 'refresh_token',
      },
    });

    cachedToken = response.data.access_token;
    // Set expiry time with 5 minute buffer
    tokenExpiryTime = Date.now() + (response.data.expires_in - 300) * 1000;
    
    console.log('✅ Zoho access token obtained successfully\n');
    return cachedToken;
  } catch (error) {
    console.error('❌ Error getting Zoho access token:', error.response?.data || error.message);
    throw new Error('Failed to get Zoho access token');
  }
}

async function getAuthHeaders() {
  const token = await getAccessToken();
  return {
    'Authorization': `Zoho-oauthtoken ${token}`,
    'Content-Type': 'application/json',
  };
}

async function getModuleFields(moduleName) {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${BASE_URL}/settings/fields?module=${moduleName}`, { headers });

    if (response.data && response.data.fields) {
      return response.data.fields;
    }

    return [];
  } catch (error) {
    console.error(`Error fetching fields for ${moduleName}:`, error.response?.data || error.message);
    return [];
  }
}

function formatFieldInfo(field) {
  const info = {
    api_name: field.api_name,
    field_label: field.field_label,
    data_type: field.data_type,
    required: field.required,
    custom_field: field.custom_field
  };

  // Add picklist values if available
  if (field.pick_list_values && field.pick_list_values.length > 0) {
    info.pick_list_values = field.pick_list_values.map(plv => ({
      display_value: plv.display_value,
      actual_value: plv.actual_value,
      sequence_number: plv.sequence_number
    }));
  }

  return info;
}

async function investigatePartnerFields() {
  console.log('='.repeat(80));
  console.log('INVESTIGATING PARTNER/VENDOR FIELDS');
  console.log('='.repeat(80));

  const fields = await getModuleFields('Vendors');
  
  console.log(`\nTotal fields found: ${fields.length}\n`);

  // Look for partner type field
  console.log('--- PARTNER TYPE FIELD ---');
  const partnerTypeFields = fields.filter(f => {
    const apiName = f.api_name?.toLowerCase() || '';
    const label = f.field_label?.toLowerCase() || '';
    return apiName.includes('type') || 
           apiName.includes('partner') || 
           label.includes('type') ||
           label.includes('partner');
  });

  if (partnerTypeFields.length > 0) {
    partnerTypeFields.forEach(field => {
      const info = formatFieldInfo(field);
      console.log('\nFound potential Partner Type field:');
      console.log(JSON.stringify(info, null, 2));
    });
  } else {
    console.log('❌ No Partner Type field found');
    console.log('💡 Listing all custom fields for manual review:');
    const customFields = fields.filter(f => f.custom_field);
    customFields.forEach(field => {
      console.log(`  - ${field.api_name} (${field.field_label})`);
    });
  }

  console.log('\n');
}

async function investigateLeadFields() {
  console.log('='.repeat(80));
  console.log('INVESTIGATING LEAD FIELDS');
  console.log('='.repeat(80));

  const fields = await getModuleFields('Leads');
  
  console.log(`\nTotal fields found: ${fields.length}\n`);

  // Look for State field
  console.log('--- STATE FIELD ---');
  const stateField = fields.find(f => {
    const apiName = f.api_name?.toLowerCase() || '';
    const label = f.field_label?.toLowerCase() || '';
    return apiName === 'state' || label === 'state';
  });

  if (stateField) {
    const info = formatFieldInfo(stateField);
    console.log('\n✅ State field found:');
    console.log(JSON.stringify(info, null, 2));
    
    if (info.pick_list_values && info.pick_list_values.length > 0) {
      console.log(`\n📋 State values (${info.pick_list_values.length} total):`);
      info.pick_list_values.forEach(plv => {
        console.log(`  - ${plv.display_value}`);
      });
    }
  } else {
    console.log('❌ No State field found');
  }

  // Look for Lead Status field
  console.log('\n--- LEAD STATUS FIELD ---');
  const statusField = fields.find(f => f.api_name === 'Lead_Status');

  if (statusField) {
    const info = formatFieldInfo(statusField);
    console.log('\n✅ Lead Status field found:');
    console.log(JSON.stringify(info, null, 2));
    
    if (info.pick_list_values && info.pick_list_values.length > 0) {
      console.log(`\n📋 Lead Status values (${info.pick_list_values.length} total):`);
      info.pick_list_values.forEach(plv => {
        console.log(`  - ${plv.display_value}`);
      });
    }
  } else {
    console.log('❌ No Lead Status field found');
  }

  // Look for Lander Message field
  console.log('\n--- LANDER MESSAGE FIELD ---');
  const landerField = fields.find(f => {
    const apiName = f.api_name?.toLowerCase() || '';
    const label = f.field_label?.toLowerCase() || '';
    return apiName.includes('lander') || label.includes('lander');
  });

  if (landerField) {
    const info = formatFieldInfo(landerField);
    console.log('\n✅ Lander Message field found:');
    console.log(JSON.stringify(info, null, 2));
  } else {
    console.log('❌ No Lander Message field found');
    console.log('💡 Searching for similar fields (message, notes, description):');
    const messageFields = fields.filter(f => {
      const apiName = f.api_name?.toLowerCase() || '';
      const label = f.field_label?.toLowerCase() || '';
      return apiName.includes('message') || 
             apiName.includes('note') || 
             apiName.includes('description') ||
             label.includes('message') ||
             label.includes('note') ||
             label.includes('description');
    });
    messageFields.forEach(field => {
      console.log(`  - ${field.api_name} (${field.field_label})`);
    });
  }

  console.log('\n');
}

async function investigateDealFields() {
  console.log('='.repeat(80));
  console.log('INVESTIGATING DEAL FIELDS');
  console.log('='.repeat(80));

  const fields = await getModuleFields('Deals');
  
  console.log(`\nTotal fields found: ${fields.length}\n`);

  // Look for Stage field
  console.log('--- DEAL STAGE FIELD ---');
  const stageField = fields.find(f => f.api_name === 'Stage');

  if (stageField) {
    const info = formatFieldInfo(stageField);
    console.log('\n✅ Deal Stage field found:');
    console.log(JSON.stringify(info, null, 2));
    
    if (info.pick_list_values && info.pick_list_values.length > 0) {
      console.log(`\n📋 Deal Stage values (${info.pick_list_values.length} total):`);
      info.pick_list_values.forEach(plv => {
        console.log(`  - ${plv.display_value}`);
      });
      
      // Check for "Send to Motion" stage
      const sendToMotion = info.pick_list_values.find(plv => 
        plv.display_value === 'Send to Motion'
      );
      console.log(`\n🔍 "Send to Motion" stage exists? ${sendToMotion ? '✅ YES' : '❌ NO'}`);
    }
  } else {
    console.log('❌ No Deal Stage field found');
  }

  // Look for Approval Time Stamp field
  console.log('\n--- APPROVAL TIME STAMP FIELD ---');
  const approvalField = fields.find(f => f.api_name === 'Approval_Time_Stamp');

  if (approvalField) {
    const info = formatFieldInfo(approvalField);
    console.log('\n✅ Approval Time Stamp field found:');
    console.log(JSON.stringify(info, null, 2));
  } else {
    console.log('❌ No Approval_Time_Stamp field found');
    console.log('💡 Searching for similar fields (approval, date, timestamp):');
    const approvalFields = fields.filter(f => {
      const apiName = f.api_name?.toLowerCase() || '';
      const label = f.field_label?.toLowerCase() || '';
      return apiName.includes('approval') || 
             apiName.includes('approved') ||
             label.includes('approval') ||
             label.includes('approved');
    });
    approvalFields.forEach(field => {
      console.log(`  - ${field.api_name} (${field.field_label}) - ${field.data_type}`);
    });
  }

  // Look for Partners_Id field
  console.log('\n--- PARTNERS ID FIELD ---');
  const partnersIdField = fields.find(f => f.api_name === 'Partners_Id');

  if (partnersIdField) {
    const info = formatFieldInfo(partnersIdField);
    console.log('\n✅ Partners_Id field found:');
    console.log(JSON.stringify(info, null, 2));
  } else {
    console.log('❌ No Partners_Id field found');
  }

  console.log('\n');
}

async function investigateAllFields() {
  console.log('\n');
  console.log('╔' + '═'.repeat(78) + '╗');
  console.log('║' + ' '.repeat(20) + 'ZOHO CRM FIELD INVESTIGATION' + ' '.repeat(30) + '║');
  console.log('╚' + '═'.repeat(78) + '╝');
  console.log('\n');

  try {
    // Get access token first
    await getAccessToken();

    await investigatePartnerFields();
    await investigateLeadFields();
    await investigateDealFields();

    console.log('='.repeat(80));
    console.log('INVESTIGATION COMPLETE');
    console.log('='.repeat(80));
    console.log('\n✅ All field investigations completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('  1. Review the output above');
    console.log('  2. Document field names in PHASE_1_VERIFICATION_REPORT.md');
    console.log('  3. Update webhook implementations with correct field names');
    console.log('  4. Update planning documents with actual values');
    console.log('\n');

  } catch (error) {
    console.error('Error during investigation:', error);
    process.exit(1);
  }
}

// Run the investigation
investigateAllFields();

