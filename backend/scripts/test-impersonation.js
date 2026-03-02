/**
 * Test Impersonation Flow
 * 
 * This script simulates the impersonation flow to verify that:
 * 1. The impersonated user's partner_id is correctly retrieved
 * 2. The partner's zoho_partner_id is correctly retrieved
 * 3. All data needed for sync is available
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testImpersonation() {
  console.log('=== Testing Impersonation Flow ===\n');

  // Step 1: Find Sibert Ventures LLC partner
  console.log('Step 1: Finding Sibert Ventures LLC partner...');
  const { data: partner, error: partnerError } = await supabase
    .from('partners')
    .select('id, name, zoho_partner_id')
    .eq('name', 'Sibert Ventures LLC')
    .single();

  if (partnerError || !partner) {
    console.error('❌ Partner not found:', partnerError);
    return;
  }

  console.log('✅ Partner found:', {
    id: partner.id,
    name: partner.name,
    zoho_partner_id: partner.zoho_partner_id
  });

  // Step 2: Find a user associated with this partner
  console.log('\nStep 2: Finding users for this partner...');
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, partner_id, role, first_name, last_name, is_active')
    .eq('partner_id', partner.id)
    .eq('is_active', true);

  if (usersError || !users || users.length === 0) {
    console.error('❌ No users found for this partner:', usersError);
    return;
  }

  console.log(`✅ Found ${users.length} active user(s):`);
  users.forEach(user => {
    console.log(`   - ${user.email} (${user.id}) - Role: ${user.role}`);
  });

  // Step 3: Simulate impersonation for the first user
  const targetUser = users[0];
  console.log('\nStep 3: Simulating impersonation for:', targetUser.email);

  // This is what happens in the auth middleware when X-Impersonate-User-Id is set
  console.log('   Impersonated user context:', {
    id: targetUser.id,
    email: targetUser.email,
    partner_id: targetUser.partner_id,
    role: targetUser.role,
    first_name: targetUser.first_name,
    last_name: targetUser.last_name
  });

  // Step 4: Verify partner lookup using impersonated user's partner_id
  console.log('\nStep 4: Verifying partner lookup using impersonated partner_id...');
  const { data: verifyPartner, error: verifyError } = await supabase
    .from('partners')
    .select('id, name, zoho_partner_id')
    .eq('id', targetUser.partner_id)
    .single();

  if (verifyError || !verifyPartner) {
    console.error('❌ Partner lookup failed:', verifyError);
    return;
  }

  console.log('✅ Partner lookup successful:', {
    id: verifyPartner.id,
    name: verifyPartner.name,
    zoho_partner_id: verifyPartner.zoho_partner_id
  });

  // Step 5: Verify zoho_partner_id is not null
  console.log('\nStep 5: Verifying Zoho partner ID...');
  if (!verifyPartner.zoho_partner_id) {
    console.error('❌ zoho_partner_id is NULL - this would cause the sync to fail!');
    return;
  }

  console.log('✅ zoho_partner_id is valid:', verifyPartner.zoho_partner_id);

  // Summary
  console.log('\n=== Impersonation Test Summary ===');
  console.log('✅ Partner exists and has valid zoho_partner_id');
  console.log('✅ User exists and is linked to partner');
  console.log('✅ Partner lookup via user.partner_id works correctly');
  console.log('\n🎯 Expected behavior:');
  console.log('   When admin impersonates this user, the backend should:');
  console.log('   1. Set req.user to the impersonated user');
  console.log('   2. Use req.user.partner_id to lookup partner');
  console.log('   3. Find partner.zoho_partner_id:', verifyPartner.zoho_partner_id);
  console.log('   4. Call Zoho API with this ID');
  console.log('\n📋 Next steps:');
  console.log('   1. Deploy the debug logging changes');
  console.log('   2. Impersonate Sibert Ventures user in production');
  console.log('   3. Click "Sync from Zoho" button');
  console.log('   4. Check Railway logs for debug output');
  console.log('   5. Verify the partner_id and zoho_partner_id in logs');
}

testImpersonation()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Test failed:', err);
    process.exit(1);
  });
