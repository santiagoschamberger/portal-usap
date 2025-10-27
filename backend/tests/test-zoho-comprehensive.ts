import { zohoService } from './src/services/zohoService';
import { config } from 'dotenv';
import axios from 'axios';

// Load environment variables
config();

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  details?: any;
}

class ZohoTestSuite {
  private results: TestResult[] = [];
  private testVendorId: string | null = null;
  private testLeadId: string | null = null;

  async runAllTests() {
    console.log('🧪 Comprehensive Zoho CRM Integration Test Suite\n');
    console.log('=' .repeat(60));

    // Test 1: Environment Configuration
    await this.testEnvironmentConfig();

    // Test 2: Authentication
    await this.testAuthentication();

    // Test 3: API Connectivity
    await this.testAPIConnectivity();

    // Test 4: Vendor Creation
    await this.testVendorCreation();

    // Test 5: Lead Creation
    await this.testLeadCreation();

    // Test 6: Lead Update
    await this.testLeadUpdate();

    // Test 7: Lead Search
    await this.testLeadSearch();

    // Test 8: Note Creation
    await this.testNoteCreation();

    // Test 9: Error Handling
    await this.testErrorHandling();

    // Test 10: Cleanup (if in test mode)
    await this.testCleanup();

    // Print Results
    this.printResults();
  }

  private async testEnvironmentConfig() {
    try {
      zohoService.validateConfig();
      this.addResult('Environment Configuration', 'PASS', 'All required environment variables are set');
    } catch (error) {
      this.addResult('Environment Configuration', 'FAIL', `Missing environment variables: ${(error as Error).message}`);
    }
  }

  private async testAuthentication() {
    try {
      const token = await zohoService.getAccessToken();
      if (token && typeof token === 'string' && token.length > 0) {
        this.addResult('Authentication', 'PASS', 'Successfully obtained access token', { tokenLength: token.length });
      } else {
        this.addResult('Authentication', 'FAIL', 'Invalid token received');
      }
    } catch (error) {
      this.addResult('Authentication', 'FAIL', `Authentication failed: ${(error as Error).message}`);
    }
  }

  private async testAPIConnectivity() {
    try {
      // Test basic API connectivity by making a simple request
      const token = await zohoService.getAccessToken();
      const response = await axios.get('https://www.zohoapis.com/crm/v2/org', {
        headers: {
          'Authorization': `Zoho-oauthtoken ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (response.status === 200) {
        this.addResult('API Connectivity', 'PASS', 'Successfully connected to Zoho CRM API');
      } else {
        this.addResult('API Connectivity', 'FAIL', `Unexpected response status: ${response.status}`);
      }
    } catch (error) {
      this.addResult('API Connectivity', 'FAIL', `API connectivity failed: ${(error as Error).message}`);
    }
  }

  private async testVendorCreation() {
    try {
      const testVendorName = `Test Vendor ${Date.now()}`;
      const testEmail = `test-vendor-${Date.now()}@example.com`;
      
      const vendorId = await zohoService.createVendor(testVendorName, testEmail);
      
      if (vendorId && typeof vendorId === 'string') {
        this.testVendorId = vendorId;
        this.addResult('Vendor Creation', 'PASS', 'Successfully created test vendor', { vendorId, vendorName: testVendorName });
      } else {
        this.addResult('Vendor Creation', 'FAIL', 'Invalid vendor ID received');
      }
    } catch (error) {
      this.addResult('Vendor Creation', 'FAIL', `Vendor creation failed: ${(error as Error).message}`);
    }
  }

  private async testLeadCreation() {
    try {
      if (!this.testVendorId) {
        this.addResult('Lead Creation', 'SKIP', 'Skipped - no test vendor available');
        return;
      }

      const testLeadData = {
        Last_Name: `Test Lead ${Date.now()}`,
        First_Name: 'John',
        Email: `test-lead-${Date.now()}@example.com`,
        Company: 'Test Company',
        Phone: '+1234567890',
        StrategicPartnerId: this.testVendorId,
        Entity_Type: 'Business',
        Lead_Status: 'New',
        Lead_Source: 'Partner Portal',
        Vendor: {
          name: 'Test Vendor',
          id: this.testVendorId
        }
      };

      const result = await zohoService.createLead(testLeadData);
      
      if (result.data && result.data.length > 0 && result.data[0].code === 'SUCCESS') {
        this.testLeadId = result.data[0].details.id;
        this.addResult('Lead Creation', 'PASS', 'Successfully created test lead', { leadId: this.testLeadId });
      } else {
        this.addResult('Lead Creation', 'FAIL', 'Lead creation response invalid', { result });
      }
    } catch (error) {
      this.addResult('Lead Creation', 'FAIL', `Lead creation failed: ${(error as Error).message}`);
    }
  }

  private async testLeadUpdate() {
    try {
      if (!this.testLeadId) {
        this.addResult('Lead Update', 'SKIP', 'Skipped - no test lead available');
        return;
      }

      const updateData = {
        Lead_Status: 'Contacted',
        Phone: '+1987654321'
      };

      const result = await zohoService.updateLead(this.testLeadId, updateData);
      
      if (result.data && result.data.length > 0 && result.data[0].code === 'SUCCESS') {
        this.addResult('Lead Update', 'PASS', 'Successfully updated test lead');
      } else {
        this.addResult('Lead Update', 'FAIL', 'Lead update response invalid', { result });
      }
    } catch (error) {
      this.addResult('Lead Update', 'FAIL', `Lead update failed: ${(error as Error).message}`);
    }
  }

  private async testLeadSearch() {
    try {
      if (!this.testVendorId) {
        this.addResult('Lead Search', 'SKIP', 'Skipped - no test vendor available');
        return;
      }

      const leads = await zohoService.getPartnerLeads(this.testVendorId);
      
      if (leads && typeof leads === 'object') {
        this.addResult('Lead Search', 'PASS', 'Successfully searched for partner leads', { 
          leadCount: leads.data?.length || 0 
        });
      } else {
        this.addResult('Lead Search', 'FAIL', 'Invalid search response');
      }
    } catch (error) {
      this.addResult('Lead Search', 'FAIL', `Lead search failed: ${(error as Error).message}`);
    }
  }

  private async testNoteCreation() {
    try {
      if (!this.testLeadId) {
        this.addResult('Note Creation', 'SKIP', 'Skipped - no test lead available');
        return;
      }

      const noteData = {
        Note_Title: 'Test Note',
        Note_Content: 'This is a test note from the partner portal',
        Parent_Id: this.testLeadId,
        se_module: 'Leads'
      };

      const result = await zohoService.addNoteToLead(noteData);
      
      if (result.data && result.data.length > 0 && result.data[0].code === 'SUCCESS') {
        this.addResult('Note Creation', 'PASS', 'Successfully created test note');
      } else {
        this.addResult('Note Creation', 'FAIL', 'Note creation response invalid', { result });
      }
    } catch (error) {
      this.addResult('Note Creation', 'FAIL', `Note creation failed: ${(error as Error).message}`);
    }
  }

  private async testErrorHandling() {
    try {
      // Test with invalid lead ID
      await zohoService.updateLead('invalid-lead-id', { Lead_Status: 'Test' });
      this.addResult('Error Handling', 'FAIL', 'Should have thrown error for invalid lead ID');
    } catch (error) {
      this.addResult('Error Handling', 'PASS', 'Properly handled invalid lead ID error');
    }
  }

  private async testCleanup() {
    // Note: In a real test environment, you might want to clean up test data
    // For now, we'll just log that cleanup would happen
    this.addResult('Test Cleanup', 'SKIP', 'Cleanup skipped - test data preserved for manual verification');
  }

  private addResult(test: string, status: 'PASS' | 'FAIL' | 'SKIP', message: string, details?: any) {
    this.results.push({ test, status, message, details });
    
    const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️';
    console.log(`${statusIcon} ${test}: ${message}`);
    
    if (details) {
      console.log(`   Details:`, details);
    }
    console.log();
  }

  private printResults() {
    console.log('=' .repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('=' .repeat(60));
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const skipped = this.results.filter(r => r.status === 'SKIP').length;
    const total = this.results.length;

    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    console.log();

    if (failed > 0) {
      console.log('❌ FAILED TESTS:');
      this.results.filter(r => r.status === 'FAIL').forEach(result => {
        console.log(`   - ${result.test}: ${result.message}`);
      });
      console.log();
    }

    if (passed === total) {
      console.log('🎉 All tests passed! Zoho CRM integration is working correctly.');
    } else if (failed === 0) {
      console.log('✅ All critical tests passed! Some tests were skipped due to missing prerequisites.');
    } else {
      console.log('⚠️  Some tests failed. Please check the error messages above.');
    }
  }
}

// Run the test suite
async function main() {
  const testSuite = new ZohoTestSuite();
  await testSuite.runAllTests();
}

main().catch(console.error); 