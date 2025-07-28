import { Partner } from '../config/database';
export declare class PartnerModel {
    static getAll(): Promise<Partner[]>;
    static getById(id: string): Promise<Partner | null>;
    static getByEmail(email: string): Promise<Partner | null>;
    static getByZohoId(zohoId: string): Promise<Partner | null>;
    static create(partnerData: Omit<Partner, 'id' | 'created_at' | 'updated_at'>): Promise<Partner>;
    static update(id: string, updates: Partial<Partner>): Promise<Partner>;
    static delete(id: string): Promise<void>;
    static approve(id: string): Promise<Partner>;
    static getApproved(): Promise<Partner[]>;
    static getPending(): Promise<Partner[]>;
}
//# sourceMappingURL=Partner.d.ts.map