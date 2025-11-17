/**
 * Zoho Field Investigation Script
 * 
 * This script investigates Zoho CRM fields to document:
 * - Partner Type field and values
 * - State field and values
 * - Lead Status field and values
 * - Deal Stage field and values
 * - Approval Time Stamp field
 * 
 * Run with: node backend/scripts/investigate-zoho-fields.js
 */

const ZOHOCRMSDK = require('@zohocrm/nodejs-sdk-8.0');
require('dotenv').config();

async function initializeZoho() {
  try {
    // Initialize SDK
    const environment = ZOHOCRMSDK.USDataCenter.PRODUCTION();
    const token = new ZOHOCRMSDK.OAuthBuilder()
      .clientId(process.env.ZOHO_CLIENT_ID)
      .clientSecret(process.env.ZOHO_CLIENT_SECRET)
      .refreshToken(process.env.ZOHO_REFRESH_TOKEN)
      .build();

    await new ZOHOCRMSDK.InitializeBuilder()
      .environment(environment)
      .token(token)
      .initialize();

    console.log('✅ Zoho SDK initialized successfully\n');
    return true;
  } catch (error) {
    console.error('❌ Error initializing Zoho SDK:', error);
    return false;
  }
}

async function getModuleFields(moduleName) {
  try {
    const fieldsOperations = new ZOHOCRMSDK.Fields.FieldsOperations(moduleName);
    const response = await fieldsOperations.getFields();

    if (response.getStatusCode() === 204) {
      console.log(`No fields found for module: ${moduleName}`);
      return [];
    }

    const responseObject = response.getObject();
    if (responseObject instanceof ZOHOCRMSDK.Fields.ResponseWrapper) {
      return responseObject.getFields();
    }

    return [];
  } catch (error) {
    console.error(`Error fetching fields for ${moduleName}:`, error);
    return [];
  }
}

function formatFieldInfo(field) {
  const info = {
    api_name: field.getAPIName(),
    field_label: field.getFieldLabel(),
    data_type: field.getDataType(),
    required: field.getRequired(),
    custom_field: field.getCustomField()
  };

  // Add picklist values if available
  const pickListValues = field.getPickListValues();
  if (pickListValues && pickListValues.length > 0) {
    info.pick_list_values = pickListValues.map(plv => ({
      display_value: plv.getDisplayValue(),
      actual_value: plv.getActualValue(),
      sequence_number: plv.getSequenceNumber()
    }));
  }

  return info;
}

async function investigatePartnerFields() {
  console.log('='.repeat(80));
  console.log('INVESTIGATING PARTNER/VENDOR FIELDS');
  console.log('='.repeat(80));

  const fields = await getModuleFields('Vendors');
  
  console.log(`\nTotal fields found: ${fields.length}\n`);

  // Look for partner type field
  console.log('--- PARTNER TYPE FIELD ---');
  const partnerTypeFields = fields.filter(f => {
    const apiName = f.getAPIName().toLowerCase();
    const label = f.getFieldLabel()?.toLowerCase() || '';
    return apiName.includes('type') || 
           apiName.includes('partner') || 
           label.includes('type') ||
           label.includes('partner');
  });

  if (partnerTypeFields.length > 0) {
    partnerTypeFields.forEach(field => {
      const info = formatFieldInfo(field);
      console.log('\nFound potential Partner Type field:');
      console.log(JSON.stringify(info, null, 2));
    });
  } else {
    console.log('❌ No Partner Type field found');
    console.log('💡 Listing all custom fields for manual review:');
    const customFields = fields.filter(f => f.getCustomField());
    customFields.forEach(field => {
      console.log(`  - ${field.getAPIName()} (${field.getFieldLabel()})`);
    });
  }

  console.log('\n');
}

async function investigateLeadFields() {
  console.log('='.repeat(80));
  console.log('INVESTIGATING LEAD FIELDS');
  console.log('='.repeat(80));

  const fields = await getModuleFields('Leads');
  
  console.log(`\nTotal fields found: ${fields.length}\n`);

  // Look for State field
  console.log('--- STATE FIELD ---');
  const stateField = fields.find(f => {
    const apiName = f.getAPIName().toLowerCase();
    const label = f.getFieldLabel()?.toLowerCase() || '';
    return apiName === 'state' || label === 'state';
  });

  if (stateField) {
    const info = formatFieldInfo(stateField);
    console.log('\n✅ State field found:');
    console.log(JSON.stringify(info, null, 2));
    
    if (info.pick_list_values && info.pick_list_values.length > 0) {
      console.log(`\n📋 State values (${info.pick_list_values.length} total):`);
      info.pick_list_values.forEach(plv => {
        console.log(`  - ${plv.display_value}`);
      });
    }
  } else {
    console.log('❌ No State field found');
  }

  // Look for Lead Status field
  console.log('\n--- LEAD STATUS FIELD ---');
  const statusField = fields.find(f => f.getAPIName() === 'Lead_Status');

  if (statusField) {
    const info = formatFieldInfo(statusField);
    console.log('\n✅ Lead Status field found:');
    console.log(JSON.stringify(info, null, 2));
    
    if (info.pick_list_values && info.pick_list_values.length > 0) {
      console.log(`\n📋 Lead Status values (${info.pick_list_values.length} total):`);
      info.pick_list_values.forEach(plv => {
        console.log(`  - ${plv.display_value}`);
      });
    }
  } else {
    console.log('❌ No Lead Status field found');
  }

  // Look for Lander Message field
  console.log('\n--- LANDER MESSAGE FIELD ---');
  const landerField = fields.find(f => {
    const apiName = f.getAPIName().toLowerCase();
    const label = f.getFieldLabel()?.toLowerCase() || '';
    return apiName.includes('lander') || label.includes('lander');
  });

  if (landerField) {
    const info = formatFieldInfo(landerField);
    console.log('\n✅ Lander Message field found:');
    console.log(JSON.stringify(info, null, 2));
  } else {
    console.log('❌ No Lander Message field found');
    console.log('💡 Searching for similar fields (message, notes, description):');
    const messageFields = fields.filter(f => {
      const apiName = f.getAPIName().toLowerCase();
      const label = f.getFieldLabel()?.toLowerCase() || '';
      return apiName.includes('message') || 
             apiName.includes('note') || 
             apiName.includes('description') ||
             label.includes('message') ||
             label.includes('note') ||
             label.includes('description');
    });
    messageFields.forEach(field => {
      console.log(`  - ${field.getAPIName()} (${field.getFieldLabel()})`);
    });
  }

  console.log('\n');
}

async function investigateDealFields() {
  console.log('='.repeat(80));
  console.log('INVESTIGATING DEAL FIELDS');
  console.log('='.repeat(80));

  const fields = await getModuleFields('Deals');
  
  console.log(`\nTotal fields found: ${fields.length}\n`);

  // Look for Stage field
  console.log('--- DEAL STAGE FIELD ---');
  const stageField = fields.find(f => f.getAPIName() === 'Stage');

  if (stageField) {
    const info = formatFieldInfo(stageField);
    console.log('\n✅ Deal Stage field found:');
    console.log(JSON.stringify(info, null, 2));
    
    if (info.pick_list_values && info.pick_list_values.length > 0) {
      console.log(`\n📋 Deal Stage values (${info.pick_list_values.length} total):`);
      info.pick_list_values.forEach(plv => {
        console.log(`  - ${plv.display_value}`);
      });
      
      // Check for "Send to Motion" stage
      const sendToMotion = info.pick_list_values.find(plv => 
        plv.display_value === 'Send to Motion'
      );
      console.log(`\n🔍 "Send to Motion" stage exists? ${sendToMotion ? '✅ YES' : '❌ NO'}`);
    }
  } else {
    console.log('❌ No Deal Stage field found');
  }

  // Look for Approval Time Stamp field
  console.log('\n--- APPROVAL TIME STAMP FIELD ---');
  const approvalField = fields.find(f => f.getAPIName() === 'Approval_Time_Stamp');

  if (approvalField) {
    const info = formatFieldInfo(approvalField);
    console.log('\n✅ Approval Time Stamp field found:');
    console.log(JSON.stringify(info, null, 2));
  } else {
    console.log('❌ No Approval_Time_Stamp field found');
    console.log('💡 Searching for similar fields (approval, date, timestamp):');
    const approvalFields = fields.filter(f => {
      const apiName = f.getAPIName().toLowerCase();
      const label = f.getFieldLabel()?.toLowerCase() || '';
      return apiName.includes('approval') || 
             apiName.includes('approved') ||
             label.includes('approval') ||
             label.includes('approved');
    });
    approvalFields.forEach(field => {
      console.log(`  - ${field.getAPIName()} (${field.getFieldLabel()}) - ${field.getDataType()}`);
    });
  }

  // Look for Partners_Id field
  console.log('\n--- PARTNERS ID FIELD ---');
  const partnersIdField = fields.find(f => f.getAPIName() === 'Partners_Id');

  if (partnersIdField) {
    const info = formatFieldInfo(partnersIdField);
    console.log('\n✅ Partners_Id field found:');
    console.log(JSON.stringify(info, null, 2));
  } else {
    console.log('❌ No Partners_Id field found');
  }

  console.log('\n');
}

async function investigateAllFields() {
  console.log('\n');
  console.log('╔' + '═'.repeat(78) + '╗');
  console.log('║' + ' '.repeat(20) + 'ZOHO CRM FIELD INVESTIGATION' + ' '.repeat(30) + '║');
  console.log('╚' + '═'.repeat(78) + '╝');
  console.log('\n');

  const initialized = await initializeZoho();
  if (!initialized) {
    console.error('Failed to initialize Zoho SDK. Please check your credentials.');
    process.exit(1);
  }

  try {
    await investigatePartnerFields();
    await investigateLeadFields();
    await investigateDealFields();

    console.log('='.repeat(80));
    console.log('INVESTIGATION COMPLETE');
    console.log('='.repeat(80));
    console.log('\n✅ All field investigations completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('  1. Review the output above');
    console.log('  2. Document field names in PHASE_1_VERIFICATION_REPORT.md');
    console.log('  3. Update webhook implementations with correct field names');
    console.log('  4. Update planning documents with actual values');
    console.log('\n');

  } catch (error) {
    console.error('Error during investigation:', error);
    process.exit(1);
  }
}

// Run the investigation
investigateAllFields();

