export interface JWTPayload {
    userId: string;
    partnerId: string;
    email: string;
    role: string;
    iat?: number;
    exp?: number;
}
export interface RefreshTokenPayload {
    userId: string;
    tokenId: string;
    iat?: number;
    exp?: number;
}
export declare const generateAccessToken: (payload: Omit<JWTPayload, "iat" | "exp">) => string;
export declare const generateRefreshToken: (userId: string, tokenId: string) => string;
export declare const verifyAccessToken: (token: string) => JWTPayload;
export declare const verifyRefreshToken: (token: string) => RefreshTokenPayload;
export declare const generateTokenPair: (userPayload: Omit<JWTPayload, "iat" | "exp">) => {
    accessToken: string;
    refreshToken: string;
    tokenId: any;
    expiresIn: string;
};
export declare const extractTokenFromHeader: (authHeader: string | null | undefined) => string | null;
export declare const getTokenExpirationSeconds: (token: string) => number;
//# sourceMappingURL=jwt.d.ts.map