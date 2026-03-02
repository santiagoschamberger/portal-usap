/**
 * Fix Sibert Ventures LLC zoho_partner_id in production
 * 
 * This script updates the zoho_partner_id for Sibert Ventures LLC
 * to enable proper Zoho CRM sync functionality.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const SIBERT_EMAIL = 'matt@mattsibert.com';
const SIBERT_ZOHO_PARTNER_ID = '5577028000014101165';

async function fixSibertZohoId() {
  // Use production Supabase credentials
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env file');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('🔍 Checking Sibert Ventures LLC in production database...\n');

  // Find Sibert Ventures partner
  const { data: partner, error: findError } = await supabase
    .from('partners')
    .select('id, name, email, zoho_partner_id, approved, status')
    .eq('email', SIBERT_EMAIL)
    .single();

  if (findError) {
    console.error('❌ Error finding partner:', findError);
    process.exit(1);
  }

  if (!partner) {
    console.error('❌ Sibert Ventures LLC not found in database');
    process.exit(1);
  }

  console.log('✅ Found partner:');
  console.log(`   Name: ${partner.name}`);
  console.log(`   Email: ${partner.email}`);
  console.log(`   Current zoho_partner_id: ${partner.zoho_partner_id || 'NULL'}`);
  console.log(`   Status: ${partner.status}`);
  console.log('');

  if (partner.zoho_partner_id === SIBERT_ZOHO_PARTNER_ID) {
    console.log('✅ zoho_partner_id is already correct!');
    console.log('   No update needed.');
    process.exit(0);
  }

  console.log('🔧 Updating zoho_partner_id...\n');

  // Update the zoho_partner_id
  const { data: updated, error: updateError } = await supabase
    .from('partners')
    .update({ 
      zoho_partner_id: SIBERT_ZOHO_PARTNER_ID,
      updated_at: new Date().toISOString()
    })
    .eq('id', partner.id)
    .select()
    .single();

  if (updateError) {
    console.error('❌ Error updating partner:', updateError);
    process.exit(1);
  }

  console.log('✅ Successfully updated zoho_partner_id!');
  console.log(`   Old value: ${partner.zoho_partner_id || 'NULL'}`);
  console.log(`   New value: ${updated.zoho_partner_id}`);
  console.log('');
  console.log('🎉 Sibert Ventures LLC can now sync leads and deals from Zoho CRM!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Log in as Sibert Ventures LLC at https://partnerportal.usapayments.com');
  console.log('2. Go to Leads page and click "Sync from Zoho"');
  console.log('3. Go to Deals page and click "Sync from Zoho"');
}

fixSibertZohoId()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Script failed:', err);
    process.exit(1);
  });
