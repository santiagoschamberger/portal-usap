import { zohoService } from '../src/services/zohoService';
import dotenv from 'dotenv';
import path from 'path';
import axios from 'axios';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function debugZohoLead() {
  try {
    console.log('🔍 Debugging Zoho Lead Structure...');
    
    // 1. Get Access Token
    const token = await zohoService.getAccessToken();
    console.log('✅ Access Token acquired');

    // 2. Fetch a known Lead ID to inspect its fields
    // Using the lead ID from your previous logs: 5577028000047219001 (Santiago Schamberger)
    const leadId = '5577028000047219001'; 
    console.log(`\nFetching Lead ID: ${leadId} to inspect field names...`);
    
    const response = await axios.get(`https://www.zohoapis.com/crm/v2/Leads/${leadId}`, {
      headers: {
        'Authorization': `Zoho-oauthtoken ${token}`
      }
    });
    
    if (response.data.data) {
      const lead = response.data.data[0];
      console.log('\n✅ RAW LEAD DATA (Partial):');
      console.log('------------------------------------------------');
      
      // Print keys that might be related to Partner/Vendor
      const keys = Object.keys(lead);
      const partnerKeys = keys.filter(k => 
        k.toLowerCase().includes('partner') || 
        k.toLowerCase().includes('vendor') || 
        k.toLowerCase().includes('source')
      );
      
      console.log('Potential Partner Fields found:', partnerKeys);
      
      partnerKeys.forEach(key => {
        console.log(`${key}:`, JSON.stringify(lead[key], null, 2));
      });

      // Specifically check "Vendor" and "StrategicPartnerId"
      console.log('\n--- Specific Checks ---');
      console.log('Vendor:', lead.Vendor);
      console.log('StrategicPartnerId:', lead.StrategicPartnerId);
      console.log('Layout:', lead.Layout);
      
      // 3. Test Search based on findings
      // We want to search by the ID found in the partner field
      let searchId = '';
      if (lead.Vendor && lead.Vendor.id) searchId = lead.Vendor.id;
      else if (lead.StrategicPartnerId) searchId = lead.StrategicPartnerId;
      
      if (searchId) {
        console.log(`\nTesting Search with ID: ${searchId}`);
        
        // Test 1: Vendor.id
        try {
           const criteria = `(Vendor.id:equals:${searchId})`;
           console.log(`Trying: ${criteria}`);
           const res1 = await axios.get(`https://www.zohoapis.com/crm/v2/Leads/search?criteria=${criteria}`, { headers: { 'Authorization': `Zoho-oauthtoken ${token}` } });
           console.log(`Result: ${res1.data.data ? res1.data.data.length : 0} leads`);
        } catch (e: any) { console.log('Failed:', e.response?.data || e.message); }

        // Test 2: StrategicPartnerId
        try {
           const criteria = `(StrategicPartnerId:equals:${searchId})`;
           console.log(`Trying: ${criteria}`);
           const res2 = await axios.get(`https://www.zohoapis.com/crm/v2/Leads/search?criteria=${criteria}`, { headers: { 'Authorization': `Zoho-oauthtoken ${token}` } });
           console.log(`Result: ${res2.data.data ? res2.data.data.length : 0} leads`);
        } catch (e: any) { console.log('Failed:', e.response?.data || e.message); }

         // Test 3: Vendor (Direct)
        try {
           const criteria = `(Vendor:equals:${searchId})`;
           console.log(`Trying: ${criteria}`);
           const res3 = await axios.get(`https://www.zohoapis.com/crm/v2/Leads/search?criteria=${criteria}`, { headers: { 'Authorization': `Zoho-oauthtoken ${token}` } });
           console.log(`Result: ${res3.data.data ? res3.data.data.length : 0} leads`);
        } catch (e: any) { console.log('Failed:', e.response?.data || e.message); }

      } else {
        console.log('Could not determine Partner ID from lead data to test search.');
      }

    } else {
      console.log('❌ Lead not found');
    }

  } catch (error: any) {
    console.error('❌ Error:', error.response ? error.response.data : error.message);
  }
}

debugZohoLead();
