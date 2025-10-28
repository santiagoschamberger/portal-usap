#!/usr/bin/env node

/**
 * Comprehensive Test Script for Lead/Deal Status Management & Conversion
 * 
 * Tests the new requirements:
 * 1. Only 1 record per lead/deal (delete previous status records)
 * 2. Remove lead from leads table when converted to deal
 * 
 * Usage: node scripts/test-lead-deal-conversion.js
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:5001';
const WEBHOOK_ENDPOINTS = {
  leadStatus: `${API_BASE_URL}/api/webhooks/zoho/lead-status`,
  deal: `${API_BASE_URL}/api/webhooks/zoho/deal`
};

// Test data
const TEST_PARTNER_ID = 'test-partner-123';
const TEST_LEAD_ID = 'test-lead-456';
const TEST_DEAL_ID = 'test-deal-789';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  log(`\n🧪 Testing: ${testName}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

/**
 * Test 1: Lead Status Updates (Single Record Requirement)
 */
async function testLeadStatusUpdates() {
  logTest('Lead Status Updates - Single Record Per Lead');
  
  try {
    // Test Case 1: Initial lead status
    logInfo('Step 1: Setting initial lead status to "new"');
    const response1 = await axios.post(WEBHOOK_ENDPOINTS.leadStatus, {
      id: TEST_LEAD_ID,
      Lead_Status: 'New',
      StrategicPartnerId: TEST_PARTNER_ID
    });
    
    if (response1.status === 200) {
      logSuccess('Initial lead status set successfully');
    } else {
      logError(`Unexpected response: ${response1.status}`);
    }

    // Test Case 2: Update lead status to "contacted"
    logInfo('Step 2: Updating lead status to "contacted"');
    const response2 = await axios.post(WEBHOOK_ENDPOINTS.leadStatus, {
      id: TEST_LEAD_ID,
      Lead_Status: 'Contacted',
      StrategicPartnerId: TEST_PARTNER_ID
    });
    
    if (response2.status === 200) {
      logSuccess('Lead status updated successfully');
      logInfo('✓ Previous status record should be deleted');
      logInfo('✓ Only 1 record should exist in lead_status_history');
    } else {
      logError(`Unexpected response: ${response2.status}`);
    }

    // Test Case 3: Update lead status to "qualified"
    logInfo('Step 3: Updating lead status to "qualified"');
    const response3 = await axios.post(WEBHOOK_ENDPOINTS.leadStatus, {
      id: TEST_LEAD_ID,
      Lead_Status: 'Qualified',
      StrategicPartnerId: TEST_PARTNER_ID
    });
    
    if (response3.status === 200) {
      logSuccess('Lead status updated again successfully');
      logInfo('✓ Previous status records should be deleted');
      logInfo('✓ Only 1 record should exist in lead_status_history');
    } else {
      logError(`Unexpected response: ${response3.status}`);
    }

  } catch (error) {
    logError(`Lead status test failed: ${error.message}`);
    if (error.response) {
      logError(`Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

/**
 * Test 2: Deal Creation and Stage Updates (Single Record Requirement)
 */
async function testDealStageUpdates() {
  logTest('Deal Stage Updates - Single Record Per Deal');
  
  try {
    // Test Case 1: Create new deal
    logInfo('Step 1: Creating new deal in "Qualification" stage');
    const response1 = await axios.post(WEBHOOK_ENDPOINTS.deal, {
      id: TEST_DEAL_ID,
      Deal_Name: 'Test Deal for Single Record',
      Stage: 'Qualification',
      Business_Name: 'Test Company',
      Contact_First_Name: 'John',
      Contact_Name: 'John Doe',
      Partners_Id: TEST_PARTNER_ID,
      StrategicPartnerId: 'test-user-123'
    });
    
    if (response1.status === 201) {
      logSuccess('Deal created successfully');
    } else {
      logError(`Unexpected response: ${response1.status}`);
    }

    // Test Case 2: Update deal stage to "Needs Analysis"
    logInfo('Step 2: Updating deal stage to "Needs Analysis"');
    const response2 = await axios.post(WEBHOOK_ENDPOINTS.deal, {
      id: TEST_DEAL_ID,
      Deal_Name: 'Test Deal for Single Record',
      Stage: 'Needs Analysis',
      Business_Name: 'Test Company',
      Contact_First_Name: 'John',
      Contact_Name: 'John Doe',
      Partners_Id: TEST_PARTNER_ID,
      StrategicPartnerId: 'test-user-123'
    });
    
    if (response2.status === 200) {
      logSuccess('Deal stage updated successfully');
      logInfo('✓ Previous stage record should be deleted');
      logInfo('✓ Only 1 record should exist in deal_stage_history');
    } else {
      logError(`Unexpected response: ${response2.status}`);
    }

    // Test Case 3: Update deal stage to "Closed Won"
    logInfo('Step 3: Updating deal stage to "Closed Won"');
    const response3 = await axios.post(WEBHOOK_ENDPOINTS.deal, {
      id: TEST_DEAL_ID,
      Deal_Name: 'Test Deal for Single Record',
      Stage: 'Closed Won',
      Business_Name: 'Test Company',
      Contact_First_Name: 'John',
      Contact_Name: 'John Doe',
      Partners_Id: TEST_PARTNER_ID,
      StrategicPartnerId: 'test-user-123'
    });
    
    if (response3.status === 200) {
      logSuccess('Deal stage updated to final stage successfully');
      logInfo('✓ Previous stage records should be deleted');
      logInfo('✓ Only 1 record should exist in deal_stage_history');
    } else {
      logError(`Unexpected response: ${response3.status}`);
    }

  } catch (error) {
    logError(`Deal stage test failed: ${error.message}`);
    if (error.response) {
      logError(`Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

/**
 * Test 3: Lead to Deal Conversion (Lead Deletion Requirement)
 */
async function testLeadToDealConversion() {
  logTest('Lead to Deal Conversion - Lead Deletion');
  
  try {
    const CONVERSION_LEAD_ID = 'conversion-lead-123';
    const CONVERSION_DEAL_ID = 'conversion-deal-456';
    
    // Step 1: Create a lead that will be converted
    logInfo('Step 1: Creating lead that will be converted to deal');
    const leadResponse = await axios.post(WEBHOOK_ENDPOINTS.leadStatus, {
      id: CONVERSION_LEAD_ID,
      Lead_Status: 'Qualified',
      StrategicPartnerId: TEST_PARTNER_ID
    });
    
    if (leadResponse.status === 200) {
      logSuccess('Lead created for conversion test');
    }

    // Step 2: Convert lead to deal (this should delete the lead)
    logInfo('Step 2: Converting lead to deal (should delete lead from leads table)');
    const dealResponse = await axios.post(WEBHOOK_ENDPOINTS.deal, {
      id: CONVERSION_DEAL_ID,
      Deal_Name: 'Converted Deal Test',
      Stage: 'Qualification',
      Business_Name: 'Conversion Test Company',
      Contact_First_Name: 'Jane',
      Contact_Name: 'Jane Smith',
      Partners_Id: TEST_PARTNER_ID,
      StrategicPartnerId: 'test-user-456'
    });
    
    if (dealResponse.status === 201) {
      logSuccess('Deal created from lead conversion');
      const responseData = dealResponse.data;
      
      if (responseData.data.converted_from_lead_id) {
        logSuccess(`✓ Lead conversion detected: ${responseData.data.converted_from_lead_id}`);
        logInfo('✓ Original lead should be deleted from leads table');
        logInfo('✓ Lead status history should be cleaned up');
      } else {
        logWarning('Lead conversion not detected (may be expected if no matching lead found)');
      }
    } else {
      logError(`Unexpected response: ${dealResponse.status}`);
    }

  } catch (error) {
    logError(`Lead conversion test failed: ${error.message}`);
    if (error.response) {
      logError(`Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

/**
 * Test 4: Edge Cases
 */
async function testEdgeCases() {
  logTest('Edge Cases');
  
  try {
    // Test Case 1: Non-existent lead status update
    logInfo('Step 1: Testing status update for non-existent lead');
    try {
      const response = await axios.post(WEBHOOK_ENDPOINTS.leadStatus, {
        id: 'non-existent-lead-999',
        Lead_Status: 'Contacted',
        StrategicPartnerId: TEST_PARTNER_ID
      });
      
      if (response.status === 404) {
        logSuccess('✓ Correctly handled non-existent lead');
      } else {
        logWarning(`Unexpected response for non-existent lead: ${response.status}`);
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        logSuccess('✓ Correctly handled non-existent lead with 404');
      } else {
        logError(`Unexpected error: ${error.message}`);
      }
    }

    // Test Case 2: Deal creation without matching lead
    logInfo('Step 2: Testing deal creation without matching lead');
    const response2 = await axios.post(WEBHOOK_ENDPOINTS.deal, {
      id: 'standalone-deal-999',
      Deal_Name: 'Standalone Deal',
      Stage: 'Qualification',
      Business_Name: 'No Lead Company',
      Contact_First_Name: 'Standalone',
      Contact_Name: 'Standalone Contact',
      Partners_Id: TEST_PARTNER_ID,
      StrategicPartnerId: 'test-user-789'
    });
    
    if (response2.status === 201) {
      logSuccess('✓ Correctly created standalone deal (no lead conversion)');
      const responseData = response2.data;
      if (!responseData.data.converted_from_lead_id) {
        logSuccess('✓ No lead conversion detected (expected)');
      }
    }

  } catch (error) {
    logError(`Edge case test failed: ${error.message}`);
    if (error.response) {
      logError(`Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

/**
 * Main test runner
 */
async function runTests() {
  log('🚀 Starting Lead/Deal Status Management & Conversion Tests', 'magenta');
  log('=' .repeat(60), 'magenta');
  
  logInfo(`Testing against: ${API_BASE_URL}`);
  logInfo('Requirements being tested:');
  logInfo('1. Only 1 record per lead/deal (delete previous status records)');
  logInfo('2. Remove lead from leads table when converted to deal');
  
  // Run all tests
  await testLeadStatusUpdates();
  await testDealStageUpdates();
  await testLeadToDealConversion();
  await testEdgeCases();
  
  log('\n' + '=' .repeat(60), 'magenta');
  log('🏁 Test Suite Completed', 'magenta');
  log('\nNext Steps:', 'yellow');
  log('1. Check database to verify only 1 record exists per lead/deal in history tables');
  log('2. Verify leads are deleted when converted to deals');
  log('3. Check activity logs for proper conversion tracking');
  log('\nDatabase Queries to Verify:', 'cyan');
  log('-- Check lead status history (should have max 1 record per lead)');
  log('SELECT lead_id, COUNT(*) FROM lead_status_history GROUP BY lead_id HAVING COUNT(*) > 1;');
  log('');
  log('-- Check deal stage history (should have max 1 record per deal)');
  log('SELECT deal_id, COUNT(*) FROM deal_stage_history GROUP BY deal_id HAVING COUNT(*) > 1;');
  log('');
  log('-- Check for converted leads (should be empty if conversion worked)');
  log('SELECT * FROM leads WHERE first_name IN (\'Jane\') AND last_name IN (\'Smith\');');
}

// Run the tests
if (require.main === module) {
  runTests().catch(error => {
    logError(`Test suite failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  runTests,
  testLeadStatusUpdates,
  testDealStageUpdates,
  testLeadToDealConversion,
  testEdgeCases
};
