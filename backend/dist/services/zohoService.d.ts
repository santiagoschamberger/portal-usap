interface ZohoLeadData {
    Last_Name: string;
    First_Name: string;
    Email: string;
    Company: string;
    Phone: string;
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
declare class ZohoService {
    private cachedToken;
    private tokenExpiryTime;
    private readonly baseUrl;
    private readonly authUrl;
    getAccessToken(): Promise<string>;
    private getAuthHeaders;
    createLead(leadData: ZohoLeadData): Promise<any>;
    updateLead(leadId: string, updateData: Partial<ZohoLeadData>): Promise<any>;
    addNoteToLead(noteData: ZohoNoteData): Promise<any>;
    getLeadsByCriteria(criteria: string): Promise<any>;
    getPartnerLeads(partnerId: string): Promise<any>;
    getDealsByVendor(vendorId: string): Promise<any>;
    createVendor(vendorName: string, email: string): Promise<string>;
    validateConfig(): void;
}
export declare const zohoService: ZohoService;
export {};
//# sourceMappingURL=zohoService.d.ts.map