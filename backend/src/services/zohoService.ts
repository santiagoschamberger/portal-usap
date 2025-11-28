import axios from 'axios';

interface ZohoTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface ZohoLeadData {
  Last_Name: string;
  First_Name: string;
  Email: string;
  Company: string;
  Phone: string;
  State?: string; // US State or territory
  Lander_Message?: string; // Additional information
  StrategicPartnerId: string;
  Entity_Type: string | string[];
  Lead_Status: string;
  Lead_Source: string;
  Vendor: {
    name: string;
    id: string;
  };
}

interface ZohoNoteData {
  Note_Title: string;
  Note_Content: string;
  Parent_Id: string;
  se_module: string;
}

class ZohoService {
  private cachedToken: string | null = null;
  private tokenExpiryTime: number | null = null;
  private readonly baseUrl = 'https://www.zohoapis.com/crm/v2';
  private readonly authUrl = 'https://accounts.zoho.com/oauth/v2/token';

  /**
   * Get Zoho access token with automatic refresh and caching
   */
  async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.cachedToken && this.tokenExpiryTime && this.tokenExpiryTime > Date.now()) {
      return this.cachedToken;
    }

    try {
      const response = await axios.post<ZohoTokenResponse>(this.authUrl, null, {
        params: {
          refresh_token: process.env.ZOHO_REFRESH_TOKEN,
          client_id: process.env.ZOHO_CLIENT_ID,
          client_secret: process.env.ZOHO_CLIENT_SECRET,
          grant_type: 'refresh_token',
        },
      });

      this.cachedToken = response.data.access_token;
      // Set expiry time with 5 minute buffer
      this.tokenExpiryTime = Date.now() + (response.data.expires_in - 300) * 1000;
      
      return this.cachedToken;
    } catch (error) {
      console.error('Error getting Zoho access token:', error);
      throw new Error('Failed to get Zoho access token');
    }
  }

  /**
   * Get authorization headers for Zoho API requests
   */
  private async getAuthHeaders() {
    const token = await this.getAccessToken();
    return {
      'Authorization': `Zoho-oauthtoken ${token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Create a lead in Zoho CRM
   */
  async createLead(leadData: ZohoLeadData): Promise<any> {
    try {
      const headers = await this.getAuthHeaders();
      const payload = {
        data: [leadData],
      };

      const response = await axios.post(`${this.baseUrl}/Leads`, payload, { headers });
      return response.data;
    } catch (error) {
      console.error('Error creating lead in Zoho:', error);
      throw error;
    }
  }

  /**
   * Update a lead in Zoho CRM
   */
  async updateLead(leadId: string, updateData: Partial<ZohoLeadData>): Promise<any> {
    try {
      const headers = await this.getAuthHeaders();
      const payload = {
        data: [{
          id: leadId,
          ...updateData,
        }],
      };

      const response = await axios.put(`${this.baseUrl}/Leads`, payload, { headers });
      return response.data;
    } catch (error) {
      console.error('Error updating lead in Zoho:', error);
      throw error;
    }
  }

  /**
   * Add a note to a lead in Zoho CRM
   */
  async addNoteToLead(noteData: ZohoNoteData): Promise<any> {
    try {
      const headers = await this.getAuthHeaders();
      const payload = {
        data: [noteData],
      };

      const response = await axios.post(`${this.baseUrl}/Notes`, payload, { headers });
      return response.data;
    } catch (error) {
      console.error('Error adding note to lead in Zoho:', error);
      throw error;
    }
  }

  /**
   * Get leads by criteria (e.g., StrategicPartnerId)
   */
  async getLeadsByCriteria(criteria: string): Promise<any> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.get(`${this.baseUrl}/Leads/search`, {
        headers,
        params: { criteria },
      });
      return response.data;
    } catch (error) {
      console.error('Error getting leads from Zoho:', error);
      throw error;
    }
  }

  /**
   * Get all leads for a partner (by StrategicPartnerId)
   */
  async getPartnerLeads(partnerId: string): Promise<any> {
    const criteria = `(StrategicPartnerId:equals:${partnerId})`;
    return this.getLeadsByCriteria(criteria);
  }

  /**
   * Get all leads by Vendor ID (for syncing historical leads)
   */
  async getLeadsByVendor(vendorId: string): Promise<any> {
    try {
      const headers = await this.getAuthHeaders();
      
      // Try multiple criteria variations to be robust
      const searchVariations = [
        `(Vendor:equals:${vendorId})`,
        `(Vendor.id:equals:${vendorId})`,
        `(Vendor_Name:equals:${vendorId})`,
        `(Vendor_Name.id:equals:${vendorId})`
      ];

      for (const criteria of searchVariations) {
        try {
          const response = await axios.get(`${this.baseUrl}/Leads/search`, {
            headers,
            params: { 
              criteria,
              per_page: 200 
            },
          });

          if (response.data && response.data.data) {
            console.log(`✓ Leads found using criteria: ${criteria}`);
            return response.data;
          }
        } catch (err) {
          // Continue to next variation
        }
      }

      return { data: [] };
    } catch (error) {
      console.error('Error getting leads by vendor from Zoho:', error);
      throw error;
    }
  }

  /**
   * Get deals by vendor ID
   */
  async getDealsByVendor(vendorId: string): Promise<any> {
    try {
      const headers = await this.getAuthHeaders();
      const criteria = `(Vendor.id:equals:${vendorId})`;
      
      const response = await axios.get(`${this.baseUrl}/Deals/search`, {
        headers,
        params: { criteria },
      });
      return response.data;
    } catch (error) {
      console.error('Error getting deals from Zoho:', error);
      throw error;
    }
  }

  /**
   * Get contacts by vendor ID
   */
  /**
   * Get sample contact to discover field structure
   */
  async getSampleContact(): Promise<any> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.get(`${this.baseUrl}/Contacts`, {
        headers,
        params: { per_page: 1 }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting sample contact:', error);
      throw error;
    }
  }

  async getContactsByVendor(vendorId: string): Promise<any> {
    try {
      const headers = await this.getAuthHeaders();
      
      // Try different search criteria variations
      // Based on Zoho setup: Partner is a Lookup field
      const searchVariations = [
        `(Partner:equals:${vendorId})`,
        `(Partner.id:equals:${vendorId})`,
        `(Vendor:equals:${vendorId})`,
        `(Vendor.id:equals:${vendorId})`,
        `(Account_Name:equals:${vendorId})`,
        `(Account_Name.id:equals:${vendorId})`
      ];
      
      let lastError = null;
      
      for (const criteria of searchVariations) {
        try {
          const response = await axios.get(`${this.baseUrl}/Contacts/search`, {
            headers,
            params: { criteria }
          });
          
          // If we got results, return them
          if (response.data.data && response.data.data.length > 0) {
            console.log(`✓ Contacts found using criteria: ${criteria}`);
            return response.data;
          }
        } catch (err) {
          lastError = err;
          // Continue to next variation
        }
      }
      
      // If all variations failed, throw the last error
      if (lastError) {
        throw lastError;
      }
      
      // No contacts found with any criteria
      return { data: [] };
    } catch (error) {
      console.error('Error getting contacts from Zoho:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('Zoho API error details:', {
          status: error.response.status,
          message: error.response.data
        });
      }
      throw error;
    }
  }

  /**
   * Create a vendor/partner in Zoho CRM
   */
  async createVendor(vendorName: string, email: string): Promise<string> {
    try {
      const headers = await this.getAuthHeaders();
      const payload = {
        data: [{
          Lead_Status: 'New Prospect',
          Email_Opt_Out: false,
          Vendor_Name: vendorName,
          Email: email,
          Vendor_Type: 'Strategic Partner (Referral)',
          $zia_owner_assignment: 'owner_recommendation_unavailable',
        }],
        skip_mandatory: false,
      };

      const response = await axios.post(`${this.baseUrl}/Vendors`, payload, { headers });
      
      if (response.data.data && response.data.data.length > 0) {
        const vendorData = response.data.data[0];
        if (vendorData.code === 'SUCCESS') {
          return vendorData.details.id;
        } else {
          throw new Error(`Zoho CRM Error: ${vendorData.message}`);
        }
      }
      
      throw new Error('Failed to create vendor in Zoho CRM');
    } catch (error) {
      console.error('Error creating vendor in Zoho:', error);
      throw error;
    }
  }

  /**
   * Validate environment variables
   */
  validateConfig(): void {
    const required = ['ZOHO_CLIENT_ID', 'ZOHO_CLIENT_SECRET', 'ZOHO_REFRESH_TOKEN'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required Zoho environment variables: ${missing.join(', ')}`);
    }
  }
}

export const zohoService = new ZohoService();