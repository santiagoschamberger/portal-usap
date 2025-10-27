/**
 * Setup Script: Create Custom Fields in Zoho CRM Deals Module
 * 
 * IMPORTANT: Based on your Zoho CRM screenshot, you already have most fields needed!
 * 
 * This script will only create StrategicPartnerId if it doesn't exist.
 * Your existing fields that we'll use for the webhook:
 * - Partner (Lookup) - Already exists
 * - Deal Owner (User) - Already exists
 * - Stage (Option) - Already exists
 * - Deal Name - Already exists
 * - Amount (Currency) - Already exists
 * 
 * NOTE: If your ZOHO_REFRESH_TOKEN is expired, you'll get "invalid_code" error.
 * To fix: Go to https://api-console.zoho.com/ and generate a new refresh token.
 * 
 * Usage:
 *   npx ts-node backend/scripts/setup-zoho-deal-fields.ts
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from project root
const projectRoot = path.resolve(__dirname, '../..');
dotenv.config({ path: path.join(projectRoot, '.env') });

const ZOHO_AUTH_URL = 'https://accounts.zoho.com/oauth/v2/token';
const ZOHO_API_BASE = 'https://www.zohoapis.com/crm/v3';

interface ZohoTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface ZohoField {
  api_name: string;
  field_label: string;
  data_type: string;
  length?: number;
  tooltip?: string;
  lookup?: {
    module: string;
  };
}

/**
 * Get Zoho access token
 */
async function getAccessToken(): Promise<string> {
  try {
    const response = await axios.post<ZohoTokenResponse>(ZOHO_AUTH_URL, null, {
      params: {
        refresh_token: process.env.ZOHO_REFRESH_TOKEN,
        client_id: process.env.ZOHO_CLIENT_ID,
        client_secret: process.env.ZOHO_CLIENT_SECRET,
        grant_type: 'refresh_token',
      },
    });

    return response.data.access_token;
  } catch (error) {
    console.error('❌ Error getting Zoho access token:', error);
    throw new Error('Failed to get Zoho access token');
  }
}

/**
 * Get authorization headers
 */
function getAuthHeaders(token: string) {
  return {
    'Authorization': `Zoho-oauthtoken ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Get existing fields in Deals module
 */
async function getExistingFields(token: string): Promise<any[]> {
  try {
    const headers = getAuthHeaders(token);
    const response = await axios.get(`${ZOHO_API_BASE}/settings/fields?module=Deals`, {
      headers,
    });

    return response.data.fields || [];
  } catch (error) {
    console.error('❌ Error getting existing fields:', error);
    throw error;
  }
}

/**
 * Check if a field exists
 */
function fieldExists(fields: any[], apiName: string): boolean {
  return fields.some(field => field.api_name === apiName);
}

/**
 * Create a custom field in Deals module
 */
async function createCustomField(token: string, fieldData: ZohoField): Promise<void> {
  try {
    const headers = getAuthHeaders(token);
    const payload = {
      fields: [fieldData],
    };

    const response = await axios.post(
      `${ZOHO_API_BASE}/settings/fields?module=Deals`,
      payload,
      { headers }
    );

    if (response.data.fields && response.data.fields[0].status.code === 'SUCCESS') {
      console.log(`✅ Created field: ${fieldData.field_label} (${fieldData.api_name})`);
    } else {
      console.log(`⚠️  Field creation response:`, response.data);
    }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error(`❌ Error creating field ${fieldData.api_name}:`, error.response.data);
    } else {
      console.error(`❌ Error creating field ${fieldData.api_name}:`, error);
    }
    throw error;
  }
}

/**
 * Main setup function
 */
async function setupZohoDealFields() {
  console.log('🚀 Starting Zoho Deal Fields Setup...\n');

  // Validate environment variables
  const required = ['ZOHO_CLIENT_ID', 'ZOHO_CLIENT_SECRET', 'ZOHO_REFRESH_TOKEN'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  try {
    // Get access token
    console.log('🔑 Getting Zoho access token...');
    const token = await getAccessToken();
    console.log('✅ Access token obtained\n');

    // Get existing fields
    console.log('📋 Checking existing fields in Deals module...');
    const existingFields = await getExistingFields(token);
    console.log(`✅ Found ${existingFields.length} existing fields\n`);

    // Define custom fields to create
    const fieldsToCreate: ZohoField[] = [
      {
        api_name: 'StrategicPartnerId',
        field_label: 'Strategic Partner ID',
        data_type: 'text',
        length: 50,
        tooltip: 'Links deal to the portal user who created the original lead',
      },
    ];

    // Check for existing Partner field (shown in screenshot)
    console.log('🔍 Checking for required fields from your Zoho setup...');
    const requiredFields = ['Partner', 'Deal_Name', 'Stage', 'Amount', 'Owner'];
    const missingRequired = requiredFields.filter(field => !fieldExists(existingFields, field));
    
    if (missingRequired.length === 0) {
      console.log('✅ All required standard fields exist (Partner, Deal_Name, Stage, Amount, Owner)\n');
    } else {
      console.log('⚠️  Some required fields are missing:', missingRequired.join(', '));
      console.log('   These should exist in your Deals module based on standard Zoho setup.\n');
    }

    // Create custom fields
    console.log('🔨 Creating custom fields...\n');
    
    for (const field of fieldsToCreate) {
      if (fieldExists(existingFields, field.api_name)) {
        console.log(`⏭️  Field ${field.field_label} (${field.api_name}) already exists, skipping...`);
      } else {
        console.log(`📝 Creating field: ${field.field_label} (${field.api_name})...`);
        await createCustomField(token, field);
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('\n✅ Setup completed successfully!\n');
    console.log('📋 Next Steps:');
    console.log('   1. Go to Zoho CRM → Setup → Customization → Modules and Fields → Deals');
    console.log('   2. Verify the StrategicPartnerId field was created');
    console.log('   3. If Vendor field doesn\'t exist, create it as a Lookup to Vendors/Accounts');
    console.log('   4. Set up Lead Conversion Mapping to copy StrategicPartnerId from Leads to Deals');
    console.log('   5. Configure the webhook in Zoho Workflow Rules\n');

  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
setupZohoDealFields();

