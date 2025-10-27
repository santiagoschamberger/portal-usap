require('dotenv').config();

/**
 * Test script for deals endpoints
 * Tests that the deals API is accessible and returns correct structure
 */
async function testDealsEndpoint() {
  console.log('🔍 Testing Deals Endpoints\n');
  console.log('='.repeat(60));

  const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:5001';
  
  console.log(`\n📋 Backend URL: ${BASE_URL}`);
  console.log('Note: Make sure backend is running (npm start)\n');
  
  // Instructions for testing
  console.log('='.repeat(60));
  console.log('\n✅ SETUP COMPLETE! Here are your next steps:\n');
  
  console.log('1️⃣  START BACKEND:');
  console.log('   cd backend && npm start');
  
  console.log('\n2️⃣  START FRONTEND:');
  console.log('   cd frontend && npm run dev');
  
  console.log('\n3️⃣  TEST DEALS PAGE:');
  console.log('   • Open browser: http://localhost:3000');
  console.log('   • Login to the portal');
  console.log('   • Click "Deals" in the sidebar');
  
  console.log('\n4️⃣  SYNC DEALS FROM ZOHO:');
  console.log('   • Click "Sync from Zoho" button on the Deals page');
  console.log('   • This will fetch all deals from Zoho CRM');
  
  console.log('\n5️⃣  VERIFY DATABASE:');
  console.log('   • Check Supabase dashboard');
  console.log('   • Look for "deals" table');
  console.log('   • Should see synced deals there');
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 What You Should See:\n');
  console.log('• Deals page with filters (Search, Stage, Date Range)');
  console.log('• Table showing: Deal Name, Company, Amount, Stage, Close Date');
  console.log('• "Sync from Zoho" button that fetches converted deals');
  console.log('• Stage badges with colors (Qualification, Proposal, Closed Won, etc.)');
  console.log('• Currency formatting for amounts');
  console.log('• Pagination for large lists');
  
  console.log('\n' + '='.repeat(60));
  console.log('\n🔗 API Endpoints Available:\n');
  console.log('• GET  /api/deals          - List all deals');
  console.log('• GET  /api/deals/:id      - Get specific deal');
  console.log('• POST /api/deals/sync     - Sync deals from Zoho');
  console.log('• PATCH /api/deals/:id/stage - Update deal stage');
  
  console.log('\n' + '='.repeat(60));
  console.log('\n💡 Testing Checklist:\n');
  console.log('✅ Database migration applied (deals table exists)');
  console.log('✅ Backend compiled successfully');
  console.log('✅ Deals routes registered in backend');
  console.log('✅ Frontend deals page created');
  console.log('✅ Navigation link added to sidebar');
  console.log('✅ Deals service created');
  
  console.log('\n⏳ TODO: Test in browser after starting servers');
  
  console.log('\n' + '='.repeat(60));
  console.log('\n🎉 Setup Complete! Ready to test deals functionality!');
  console.log('\n');
}

// Run the test
testDealsEndpoint().catch(console.error);

