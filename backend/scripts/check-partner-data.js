/**
 * Quick script to check partner and user data for webhook testing
 */

const { supabaseAdmin } = require('../dist/config/database');

async function checkData() {
  console.log('🔍 Checking Partner & User Data for Webhook Testing\n');
  
  try {
    // Check partners
    console.log('📊 PARTNERS:');
    const { data: partners, error: partnerError } = await supabaseAdmin
      .from('partners')
      .select('id, name, email, zoho_partner_id, approved')
      .eq('approved', true)
      .limit(5);
      
    if (partnerError) {
      console.error('Error fetching partners:', partnerError);
      return;
    }
    
    if (partners.length === 0) {
      console.log('❌ No approved partners found');
      return;
    }
    
    partners.forEach(partner => {
      console.log(`  Partner: ${partner.name}`);
      console.log(`  Email: ${partner.email}`);
      console.log(`  Zoho ID: ${partner.zoho_partner_id}`);
      console.log(`  Portal ID: ${partner.id}`);
      console.log('  ---');
    });
    
    // Check users for first partner
    const firstPartner = partners[0];
    console.log(`\n👥 USERS for partner "${firstPartner.name}":`);
    
    const { data: users, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, role, first_name, last_name')
      .eq('partner_id', firstPartner.id);
      
    if (userError) {
      console.error('Error fetching users:', userError);
      return;
    }
    
    users.forEach(user => {
      console.log(`  ${user.role.toUpperCase()}: ${user.first_name} ${user.last_name}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  User ID: ${user.id}`);
      console.log('  ---');
    });
    
    // Check recent leads
    console.log(`\n📋 RECENT LEADS for partner "${firstPartner.name}":`);
    
    const { data: leads, error: leadError } = await supabaseAdmin
      .from('leads')
      .select(`
        id, 
        first_name, 
        last_name, 
        company, 
        status, 
        created_by,
        zoho_lead_id,
        users!created_by(email, role)
      `)
      .eq('partner_id', firstPartner.id)
      .order('created_at', { ascending: false })
      .limit(3);
      
    if (leadError) {
      console.error('Error fetching leads:', leadError);
      return;
    }
    
    if (leads.length === 0) {
      console.log('  No leads found for this partner');
    } else {
      leads.forEach(lead => {
        console.log(`  Lead: ${lead.first_name} ${lead.last_name} (${lead.company})`);
        console.log(`  Status: ${lead.status}`);
        console.log(`  Zoho Lead ID: ${lead.zoho_lead_id}`);
        console.log(`  Created by: ${lead.users?.email} (${lead.users?.role})`);
        console.log(`  User ID: ${lead.created_by}`);
        console.log('  ---');
      });
    }
    
    console.log(`
💡 FOR WEBHOOK TESTING:

1. Use this Zoho Partner ID in your test: ${firstPartner.zoho_partner_id}

2. Main partner user ID: ${users.find(u => u.role === 'admin')?.id || 'Not found'}

3. Sub-account user IDs: ${users.filter(u => u.role === 'sub_account').map(u => u.id).join(', ') || 'None found'}

🚨 THE PROBLEM:
When a sub-account creates a lead and it converts to a deal, we need Zoho to tell us 
which specific user created it. Currently we only get the partner ID, so all deals 
get attributed to the main partner account.

💡 SOLUTION NEEDED:
Add a custom field in Zoho Deals that contains the portal user ID of whoever 
created the original lead.
`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkData();
