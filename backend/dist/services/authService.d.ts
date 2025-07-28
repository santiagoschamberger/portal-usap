export interface User {
    id: string;
    partner_id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    role: string;
    is_active: boolean;
    email_verified: boolean;
}
export interface Partner {
    id: string;
    name: string;
    email: string;
    approved: boolean;
    status: string;
}
export interface LoginResult {
    success: boolean;
    user?: User;
    partner?: Partner;
    tokens?: {
        accessToken: string;
        refreshToken: string;
        expiresIn: string;
    };
    message?: string;
    requiresPasswordReset?: boolean;
}
export interface RegistrationResult {
    success: boolean;
    user?: User;
    message: string;
}
export declare class AuthService {
    static login(email: string, password: string, deviceInfo?: any): Promise<LoginResult>;
    static register(partnerId: string, email: string, password: string, firstName?: string, lastName?: string, role?: string): Promise<RegistrationResult>;
    static refreshToken(refreshToken: string): Promise<LoginResult>;
    static logout(userId: string, refreshToken: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private static createSession;
    private static invalidateSession;
    private static logActivity;
}
//# sourceMappingURL=authService.d.ts.map