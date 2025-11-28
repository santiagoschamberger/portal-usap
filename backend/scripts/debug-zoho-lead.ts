import { zohoService } from '../src/services/zohoService';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function debugZohoLead() {
  try {
    console.log('🔍 Debugging Zoho Lead...');
    
    // 1. Validate config
    zohoService.validateConfig();
    
    // 2. Get specific lead to check its fields
    const leadId = '5577028000047219001';
    console.log(`\nFetching Lead ID: ${leadId}`);
    
    // We need to expose a method to get lead by ID or use axios directly
    // Since zohoService doesn't expose getLeadById, we'll use a raw request using the token
    const token = await zohoService.getAccessToken();
    const axios = require('axios');
    
    const response = await axios.get(`https://www.zohoapis.com/crm/v2/Leads/${leadId}`, {
      headers: {
        'Authorization': `Zoho-oauthtoken ${token}`
      }
    });
    
    if (response.data.data) {
      const lead = response.data.data[0];
      console.log('✅ Lead Found:');
      console.log('- ID:', lead.id);
      console.log('- Name:', lead.Full_Name || `${lead.First_Name} ${lead.Last_Name}`);
      console.log('- Status:', lead.Lead_Status);
      console.log('- Vendor:', lead.Vendor); // Check exact field name and structure
      console.log('- Vendor_Name:', lead.Vendor_Name);
      console.log('- Partner:', lead.Partner);
      console.log('- StrategicPartnerId:', lead.StrategicPartnerId);
      
      // 3. Test search by Vendor ID
      if (lead.Vendor && lead.Vendor.id) {
        const vendorId = lead.Vendor.id;
        console.log(`\nTesting search by Vendor ID: ${vendorId}`);
        const searchRes = await zohoService.getLeadsByVendor(vendorId);
        console.log(`- Found ${searchRes.data ? searchRes.data.length : 0} leads via search.`);
      } else {
        console.log('\n⚠️ Lead does not have a Vendor linked!');
      }
    } else {
      console.log('❌ Lead not found');
    }

  } catch (error: any) {
    console.error('❌ Error:', error.response ? error.response.data : error.message);
  }
}

debugZohoLead();

