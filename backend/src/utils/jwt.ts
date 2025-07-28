const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

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

/**
 * Generate access token (short-lived)
 */
export const generateAccessToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
        issuer: 'partner-portal',
        audience: 'partner-portal-api'
    });
};

/**
 * Generate refresh token (long-lived)
 */
export const generateRefreshToken = (userId: string, tokenId: string): string => {
    const payload: Omit<RefreshTokenPayload, 'iat' | 'exp'> = {
        userId,
        tokenId
    };
    
    return jwt.sign(payload, JWT_REFRESH_SECRET, {
        expiresIn: JWT_REFRESH_EXPIRES_IN,
        issuer: 'partner-portal',
        audience: 'partner-portal-refresh'
    });
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token: string): JWTPayload => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET, {
            issuer: 'partner-portal',
            audience: 'partner-portal-api'
        }) as JWTPayload;
        return decoded;
    } catch (error) {
        throw new Error('Invalid access token');
    }
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
    try {
        const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
            issuer: 'partner-portal',
            audience: 'partner-portal-refresh'
        }) as RefreshTokenPayload;
        return decoded;
    } catch (error) {
        throw new Error('Invalid refresh token');
    }
};

/**
 * Generate token pair (access + refresh)
 */
export const generateTokenPair = (userPayload: Omit<JWTPayload, 'iat' | 'exp'>) => {
    const tokenId = crypto.randomUUID();
    
    const accessToken = generateAccessToken(userPayload);
    const refreshToken = generateRefreshToken(userPayload.userId, tokenId);
    
    return {
        accessToken,
        refreshToken,
        tokenId,
        expiresIn: JWT_EXPIRES_IN
    };
};

/**
 * Extract token from Authorization header
 */
export const extractTokenFromHeader = (authHeader: string | null | undefined): string | null => {
    if (!authHeader) return null;
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
    
    return parts[1] || null;
};

/**
 * Get token expiration time in seconds
 */
export const getTokenExpirationSeconds = (token: string): number => {
    try {
        const decoded = jwt.decode(token) as any;
        if (!decoded || !decoded.exp) return 0;
        
        const now = Math.floor(Date.now() / 1000);
        return Math.max(0, decoded.exp - now);
    } catch (error) {
        return 0;
    }
}; 