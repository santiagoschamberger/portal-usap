"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.zohoService = void 0;
const axios_1 = __importDefault(require("axios"));
class ZohoService {
    constructor() {
        this.cachedToken = null;
        this.tokenExpiryTime = null;
        this.baseUrl = 'https://www.zohoapis.com/crm/v2';
        this.authUrl = 'https://accounts.zoho.com/oauth/v2/token';
    }
    async getAccessToken() {
        if (this.cachedToken && this.tokenExpiryTime && this.tokenExpiryTime > Date.now()) {
            return this.cachedToken;
        }
        try {
            const response = await axios_1.default.post(this.authUrl, null, {
                params: {
                    refresh_token: process.env.ZOHO_REFRESH_TOKEN,
                    client_id: process.env.ZOHO_CLIENT_ID,
                    client_secret: process.env.ZOHO_CLIENT_SECRET,
                    grant_type: 'refresh_token',
                },
            });
            this.cachedToken = response.data.access_token;
            this.tokenExpiryTime = Date.now() + (response.data.expires_in - 300) * 1000;
            return this.cachedToken;
        }
        catch (error) {
            console.error('Error getting Zoho access token:', error);
            throw new Error('Failed to get Zoho access token');
        }
    }
    async getAuthHeaders() {
        const token = await this.getAccessToken();
        return {
            'Authorization': `Zoho-oauthtoken ${token}`,
            'Content-Type': 'application/json',
        };
    }
    async createLead(leadData) {
        try {
            const headers = await this.getAuthHeaders();
            const payload = {
                data: [leadData],
            };
            const response = await axios_1.default.post(`${this.baseUrl}/Leads`, payload, { headers });
            return response.data;
        }
        catch (error) {
            console.error('Error creating lead in Zoho:', error);
            throw error;
        }
    }
    async updateLead(leadId, updateData) {
        try {
            const headers = await this.getAuthHeaders();
            const payload = {
                data: [{
                        id: leadId,
                        ...updateData,
                    }],
            };
            const response = await axios_1.default.put(`${this.baseUrl}/Leads`, payload, { headers });
            return response.data;
        }
        catch (error) {
            console.error('Error updating lead in Zoho:', error);
            throw error;
        }
    }
    async addNoteToLead(noteData) {
        try {
            const headers = await this.getAuthHeaders();
            const payload = {
                data: [noteData],
            };
            const response = await axios_1.default.post(`${this.baseUrl}/Notes`, payload, { headers });
            return response.data;
        }
        catch (error) {
            console.error('Error adding note to lead in Zoho:', error);
            throw error;
        }
    }
    async getLeadsByCriteria(criteria) {
        try {
            const headers = await this.getAuthHeaders();
            const response = await axios_1.default.get(`${this.baseUrl}/Leads/search`, {
                headers,
                params: { criteria },
            });
            return response.data;
        }
        catch (error) {
            console.error('Error getting leads from Zoho:', error);
            throw error;
        }
    }
    async getPartnerLeads(partnerId) {
        const criteria = `(StrategicPartnerId:equals:${partnerId})`;
        return this.getLeadsByCriteria(criteria);
    }
    async getDealsByVendor(vendorId) {
        try {
            const headers = await this.getAuthHeaders();
            const criteria = `(Vendor.id:equals:${vendorId})`;
            const response = await axios_1.default.get(`${this.baseUrl}/Deals/search`, {
                headers,
                params: { criteria },
            });
            return response.data;
        }
        catch (error) {
            console.error('Error getting deals from Zoho:', error);
            throw error;
        }
    }
    async getSampleContact() {
        try {
            const headers = await this.getAuthHeaders();
            const response = await axios_1.default.get(`${this.baseUrl}/Contacts`, {
                headers,
                params: { per_page: 1 }
            });
            return response.data;
        }
        catch (error) {
            console.error('Error getting sample contact:', error);
            throw error;
        }
    }
    async getContactsByVendor(vendorId) {
        try {
            const headers = await this.getAuthHeaders();
            const searchVariations = [
                `(Vendor:equals:${vendorId})`,
                `(Account_Name:equals:${vendorId})`,
                `(Vendor.id:equals:${vendorId})`,
                `(Account_Name.id:equals:${vendorId})`
            ];
            let lastError = null;
            for (const criteria of searchVariations) {
                try {
                    const response = await axios_1.default.get(`${this.baseUrl}/Contacts/search`, {
                        headers,
                        params: { criteria }
                    });
                    if (response.data.data && response.data.data.length > 0) {
                        console.log(`✓ Contacts found using criteria: ${criteria}`);
                        return response.data;
                    }
                }
                catch (err) {
                    lastError = err;
                }
            }
            if (lastError) {
                throw lastError;
            }
            return { data: [] };
        }
        catch (error) {
            console.error('Error getting contacts from Zoho:', error);
            if (axios_1.default.isAxiosError(error) && error.response) {
                console.error('Zoho API error details:', {
                    status: error.response.status,
                    message: error.response.data
                });
            }
            throw error;
        }
    }
    async createVendor(vendorName, email) {
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
            const response = await axios_1.default.post(`${this.baseUrl}/Vendors`, payload, { headers });
            if (response.data.data && response.data.data.length > 0) {
                const vendorData = response.data.data[0];
                if (vendorData.code === 'SUCCESS') {
                    return vendorData.details.id;
                }
                else {
                    throw new Error(`Zoho CRM Error: ${vendorData.message}`);
                }
            }
            throw new Error('Failed to create vendor in Zoho CRM');
        }
        catch (error) {
            console.error('Error creating vendor in Zoho:', error);
            throw error;
        }
    }
    validateConfig() {
        const required = ['ZOHO_CLIENT_ID', 'ZOHO_CLIENT_SECRET', 'ZOHO_REFRESH_TOKEN'];
        const missing = required.filter(key => !process.env[key]);
        if (missing.length > 0) {
            throw new Error(`Missing required Zoho environment variables: ${missing.join(', ')}`);
        }
    }
}
exports.zohoService = new ZohoService();
//# sourceMappingURL=zohoService.js.map