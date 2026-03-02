/**
 * Manually sync Sibert Ventures LLC leads and deals from Zoho CRM
 * 
 * This script bypasses the API and directly syncs data for Sibert Ventures
 * to fix the issue where the sync button isn't working properly.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');
const { zohoService } = require('../dist/services/zohoService');

const SIBERT_PARTNER_ID = '46d1ba03-5da3-4cf8-92c1-2f4f7c83d8ec';
const SIBERT_ZOHO_PARTNER_ID = '5577028000014101165';
const SIBERT_USER_ID = '20efa01e-bd85-46f7-8f37-9f9670ffcdcf';

async function syncSibertVentures() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('🔄 Starting manual sync for Sibert Ventures LLC...\n');

  // ===== SYNC LEADS =====
  console.log('📋 Syncing LEADS from Zoho CRM...');
  try {
    const leadsResponse = await zohoService.getLeadsByVendor(SIBERT_ZOHO_PARTNER_ID);
    
    if (!leadsResponse.data || leadsResponse.data.length === 0) {
      console.log('   ℹ️  No leads found in Zoho CRM\n');
    } else {
      console.log(`   ✓ Found ${leadsResponse.data.length} leads in Zoho CRM`);
      
      let created = 0;
      let updated = 0;
      let skipped = 0;

      for (const zohoLead of leadsResponse.data) {
        try {
          const email = zohoLead.Email?.toLowerCase();
          if (!email || !zohoLead.First_Name || !zohoLead.Last_Name) {
            skipped++;
            continue;
          }

          // Map Zoho status to local status
          const statusMap = {
            'New': 'new',
            'Contacted': 'contacted',
            'Qualified': 'qualified',
            'Proposal': 'proposal',
            'Negotiation': 'negotiation',
            'Closed Won': 'closed_won',
            'Closed Lost': 'closed_lost',
            'Nurture': 'nurture',
            'Unqualified': 'unqualified'
          };
          const localStatus = statusMap[zohoLead.Lead_Status] || 'new';

          // Check if lead exists
          const { data: existingLead } = await supabase
            .from('leads')
            .select('id')
            .eq('zoho_lead_id', zohoLead.id)
            .single();

          if (existingLead) {
            // Update existing lead
            await supabase
              .from('leads')
              .update({
                first_name: zohoLead.First_Name,
                last_name: zohoLead.Last_Name,
                email: email,
                phone: zohoLead.Phone || null,
                company: zohoLead.Company || null,
                status: localStatus,
                lead_source: zohoLead.Lead_Source || 'zoho_sync',
                zoho_sync_status: 'synced',
                last_sync_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', existingLead.id);
            updated++;
          } else {
            // Create new lead
            await supabase
              .from('leads')
              .insert({
                partner_id: SIBERT_PARTNER_ID,
                zoho_lead_id: zohoLead.id,
                first_name: zohoLead.First_Name,
                last_name: zohoLead.Last_Name,
                email: email,
                phone: zohoLead.Phone || null,
                company: zohoLead.Company || null,
                status: localStatus,
                lead_source: zohoLead.Lead_Source || 'zoho_sync',
                priority: 'medium',
                score: 0,
                zoho_sync_status: 'synced',
                last_sync_at: new Date().toISOString(),
                created_by: SIBERT_USER_ID
              });
            created++;
          }
        } catch (error) {
          console.error(`   ⚠️  Error processing lead ${zohoLead.id}:`, error.message);
          skipped++;
        }
      }

      console.log(`   ✅ Leads synced: ${created} created, ${updated} updated, ${skipped} skipped\n`);
    }
  } catch (error) {
    console.error('   ❌ Error syncing leads:', error.message);
  }

  // ===== SYNC DEALS =====
  console.log('💼 Syncing DEALS from Zoho CRM...');
  try {
    const dealsResponse = await zohoService.getDealsByVendor(SIBERT_ZOHO_PARTNER_ID);
    
    if (!dealsResponse.data || dealsResponse.data.length === 0) {
      console.log('   ℹ️  No deals found in Zoho CRM\n');
    } else {
      console.log(`   ✓ Found ${dealsResponse.data.length} deals in Zoho CRM`);
      
      let created = 0;
      let updated = 0;
      let skipped = 0;

      for (const zohoDeal of dealsResponse.data) {
        try {
          if (!zohoDeal.Deal_Name) {
            skipped++;
            continue;
          }

          // Map Zoho stage to local stage
          const stageMap = {
            'New Deal': 'New Deal',
            'Pre-Vet': 'Pre-Vet',
            'Sent for Signature': 'Sent for Signature',
            'Signed Application': 'Signed Application',
            'Sent to Underwriting': 'Sent to Underwriting',
            'App Pended': 'App Pended',
            'Approved': 'Approved',
            'Declined': 'Declined',
            'Dead / Do Not Contact': 'Dead / Do Not Contact',
            'Merchant Unresponsive': 'Merchant Unresponsive',
            'App Withdrawn': 'App Withdrawn',
            'Approved - Closed': 'Approved - Closed',
            'Conditionally Approved': 'Conditionally Approved'
          };
          const localStage = stageMap[zohoDeal.Stage] || 'New Deal';

          // Check if deal exists
          const { data: existingDeal } = await supabase
            .from('deals')
            .select('id')
            .eq('zoho_deal_id', zohoDeal.id)
            .single();

          // Handle Contact_Name which might be a string or object
          const contactName = typeof zohoDeal.Contact_Name === 'string' 
            ? zohoDeal.Contact_Name 
            : zohoDeal.Contact_Name?.name || '';
          const nameParts = contactName.split(' ');
          
          const dealData = {
            deal_name: zohoDeal.Deal_Name,
            first_name: nameParts[0] || zohoDeal.Contact_First_Name || null,
            last_name: nameParts.slice(1).join(' ') || null,
            email: null,
            phone: null,
            company: zohoDeal.Business_Name || zohoDeal.Deal_Name,
            amount: 0,
            stage: localStage,
            approval_date: zohoDeal.Approval_Time_Stamp || null,
            lead_source: zohoDeal.Lead_Source || 'zoho_sync',
            zoho_sync_status: 'synced',
            last_sync_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          if (existingDeal) {
            // Update existing deal
            await supabase
              .from('deals')
              .update(dealData)
              .eq('id', existingDeal.id);
            updated++;
          } else {
            // Create new deal
            await supabase
              .from('deals')
              .insert({
                ...dealData,
                partner_id: SIBERT_PARTNER_ID,
                zoho_deal_id: zohoDeal.id,
                created_by: SIBERT_USER_ID
              });
            created++;
          }
        } catch (error) {
          console.error(`   ⚠️  Error processing deal ${zohoDeal.id}:`, error.message);
          skipped++;
        }
      }

      console.log(`   ✅ Deals synced: ${created} created, ${updated} updated, ${skipped} skipped\n`);
    }
  } catch (error) {
    console.error('   ❌ Error syncing deals:', error.message);
  }

  console.log('🎉 Sync complete for Sibert Ventures LLC!');
}

syncSibertVentures()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Script failed:', err);
    process.exit(1);
  });
