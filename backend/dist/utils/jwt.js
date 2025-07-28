"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTokenExpirationSeconds = exports.extractTokenFromHeader = exports.generateTokenPair = exports.verifyRefreshToken = exports.verifyAccessToken = exports.generateRefreshToken = exports.generateAccessToken = void 0;
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const generateAccessToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
        issuer: 'partner-portal',
        audience: 'partner-portal-api'
    });
};
exports.generateAccessToken = generateAccessToken;
const generateRefreshToken = (userId, tokenId) => {
    const payload = {
        userId,
        tokenId
    };
    return jwt.sign(payload, JWT_REFRESH_SECRET, {
        expiresIn: JWT_REFRESH_EXPIRES_IN,
        issuer: 'partner-portal',
        audience: 'partner-portal-refresh'
    });
};
exports.generateRefreshToken = generateRefreshToken;
const verifyAccessToken = (token) => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET, {
            issuer: 'partner-portal',
            audience: 'partner-portal-api'
        });
        return decoded;
    }
    catch (error) {
        throw new Error('Invalid access token');
    }
};
exports.verifyAccessToken = verifyAccessToken;
const verifyRefreshToken = (token) => {
    try {
        const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
            issuer: 'partner-portal',
            audience: 'partner-portal-refresh'
        });
        return decoded;
    }
    catch (error) {
        throw new Error('Invalid refresh token');
    }
};
exports.verifyRefreshToken = verifyRefreshToken;
const generateTokenPair = (userPayload) => {
    const tokenId = crypto.randomUUID();
    const accessToken = (0, exports.generateAccessToken)(userPayload);
    const refreshToken = (0, exports.generateRefreshToken)(userPayload.userId, tokenId);
    return {
        accessToken,
        refreshToken,
        tokenId,
        expiresIn: JWT_EXPIRES_IN
    };
};
exports.generateTokenPair = generateTokenPair;
const extractTokenFromHeader = (authHeader) => {
    if (!authHeader)
        return null;
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer')
        return null;
    return parts[1] || null;
};
exports.extractTokenFromHeader = extractTokenFromHeader;
const getTokenExpirationSeconds = (token) => {
    try {
        const decoded = jwt.decode(token);
        if (!decoded || !decoded.exp)
            return 0;
        const now = Math.floor(Date.now() / 1000);
        return Math.max(0, decoded.exp - now);
    }
    catch (error) {
        return 0;
    }
};
exports.getTokenExpirationSeconds = getTokenExpirationSeconds;
//# sourceMappingURL=jwt.js.map