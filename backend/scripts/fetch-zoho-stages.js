const axios = require('axios');
require('dotenv').config();

const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID;
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET;
const ZOHO_REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN;
const ZOHO_ENVIRONMENT = process.env.ZOHO_ENVIRONMENT || 'production';

// Zoho API endpoints
const ZOHO_BASE_URL = ZOHO_ENVIRONMENT === 'sandbox' 
  ? 'https://crmsandbox.zoho.com/crm/v2' 
  : 'https://www.zohoapis.com/crm/v2';

const ZOHO_TOKEN_URL = 'https://accounts.zoho.com/oauth/v2/token';

class ZohoStagesFetcher {
  constructor() {
    this.accessToken = null;
  }

  async getAccessToken() {
    try {
      const response = await axios.post(ZOHO_TOKEN_URL, null, {
        params: {
          refresh_token: ZOHO_REFRESH_TOKEN,
          client_id: ZOHO_CLIENT_ID,
          client_secret: ZOHO_CLIENT_SECRET,
          grant_type: 'refresh_token'
        }
      });

      this.accessToken = response.data.access_token;
      console.log('✅ Successfully obtained Zoho access token');
      return this.accessToken;
    } catch (error) {
      console.error('❌ Error getting Zoho access token:', error.response?.data || error.message);
      throw error;
    }
  }

  async fetchDealStages() {
    try {
      if (!this.accessToken) {
        await this.getAccessToken();
      }

      console.log('🔍 Fetching deal stages from Zoho CRM...');
      
      // Fetch the Deals module metadata to get stage information
      const response = await axios.get(`${ZOHO_BASE_URL}/settings/modules/Deals`, {
        headers: {
          'Authorization': `Zoho-oauthtoken ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const moduleData = response.data;
      console.log('📊 Module data structure:', JSON.stringify(moduleData, null, 2));
      
      // Find the Stage field in the module fields
      const modules = moduleData.modules || [];
      if (modules.length === 0) {
        console.error('❌ No modules found in response');
        return null;
      }
      
      const fields = modules[0].fields || [];
      const stageField = fields.find(field => field.api_name === 'Stage');
      
      if (!stageField) {
        console.error('❌ Stage field not found in Deals module');
        return null;
      }

      console.log('📋 Deal Stages found in Zoho CRM:');
      console.log('=====================================');
      
      const stages = stageField.pick_list_values || [];
      stages.forEach((stage, index) => {
        console.log(`${index + 1}. ${stage.display_value} (API: ${stage.actual_value})`);
      });

      console.log('=====================================');
      console.log(`Total stages: ${stages.length}`);
      
      return stages;

    } catch (error) {
      console.error('❌ Error fetching deal stages:', error.response?.data || error.message);
      throw error;
    }
  }

  async fetchDealFields() {
    try {
      if (!this.accessToken) {
        await this.getAccessToken();
      }

      console.log('🔍 Fetching all deal fields from Zoho CRM...');
      
      const response = await axios.get(`${ZOHO_BASE_URL}/settings/fields?module=Deals`, {
        headers: {
          'Authorization': `Zoho-oauthtoken ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const fields = response.data.fields || [];
      
      console.log('\n📋 Key Deal Fields in Zoho CRM:');
      console.log('=====================================');
      
      // Filter for relevant fields
      const relevantFields = fields.filter(field => 
        field.api_name.toLowerCase().includes('stage') ||
        field.api_name.toLowerCase().includes('date') ||
        field.api_name.toLowerCase().includes('approval') ||
        field.api_name.toLowerCase().includes('close') ||
        field.api_name.toLowerCase().includes('closing')
      );

      relevantFields.forEach(field => {
        console.log(`• ${field.display_label} (API: ${field.api_name})`);
        if (field.data_type) console.log(`  Type: ${field.data_type}`);
        if (field.pick_list_values && field.pick_list_values.length > 0) {
          console.log(`  Options: ${field.pick_list_values.map(v => v.display_value).join(', ')}`);
        }
        console.log('');
      });

      return { stages: null, fields: relevantFields };

    } catch (error) {
      console.error('❌ Error fetching deal fields:', error.response?.data || error.message);
      throw error;
    }
  }

  async generateStageMapping(stages) {
    console.log('\n🔧 Generating Stage Mapping for Portal:');
    console.log('=====================================');
    
    const stageMap = {};
    stages.forEach(stage => {
      const zohoStage = stage.actual_value || stage.display_value;
      const portalStage = zohoStage; // Use the same name for now
      stageMap[zohoStage] = portalStage;
    });

    console.log('JavaScript/TypeScript mapping:');
    console.log('```javascript');
    console.log('const stageMap: { [key: string]: string } = {');
    Object.entries(stageMap).forEach(([zoho, portal]) => {
      console.log(`  '${zoho}': '${portal}',`);
    });
    console.log('};');
    console.log('```');

    console.log('\nSQL CHECK constraint:');
    console.log('```sql');
    const stageValues = Object.values(stageMap).map(stage => `'${stage}'`).join(',\n    ');
    console.log(`stage VARCHAR(100) CHECK (stage IN (\n    ${stageValues}\n))`);
    console.log('```');

    return stageMap;
  }
}

async function main() {
  try {
    console.log('🚀 Zoho CRM Stages Fetcher');
    console.log('==========================');
    
    if (!ZOHO_CLIENT_ID || !ZOHO_CLIENT_SECRET || !ZOHO_REFRESH_TOKEN) {
      console.error('❌ Missing required Zoho environment variables:');
      console.error('   - ZOHO_CLIENT_ID');
      console.error('   - ZOHO_CLIENT_SECRET');
      console.error('   - ZOHO_REFRESH_TOKEN');
      process.exit(1);
    }

    console.log(`🌍 Environment: ${ZOHO_ENVIRONMENT}`);
    console.log(`🔗 API Base URL: ${ZOHO_BASE_URL}`);
    console.log('');

    const fetcher = new ZohoStagesFetcher();
    
    // Fetch deal stages
    const stages = await fetcher.fetchDealStages();
    
    if (stages && stages.length > 0) {
      // Generate mapping
      await fetcher.generateStageMapping(stages);
    }

    // Also fetch relevant fields to check for Approval_Time_Stamp
    console.log('\n' + '='.repeat(50));
    await fetcher.fetchDealFields();

  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
