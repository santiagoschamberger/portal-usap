"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTemporaryPassword = exports.validatePasswordStrength = exports.generateVerificationToken = exports.generateResetToken = exports.verifyPassword = exports.hashPassword = void 0;
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const SALT_ROUNDS = 12;
const hashPassword = async (password) => {
    if (!password || password.length < 1) {
        throw new Error('Password is required');
    }
    return await bcrypt.hash(password, SALT_ROUNDS);
};
exports.hashPassword = hashPassword;
const verifyPassword = async (password, hash) => {
    if (!password || !hash) {
        return false;
    }
    return await bcrypt.compare(password, hash);
};
exports.verifyPassword = verifyPassword;
const generateResetToken = () => {
    return crypto.randomBytes(32).toString('hex');
};
exports.generateResetToken = generateResetToken;
const generateVerificationToken = () => {
    return crypto.randomBytes(32).toString('hex');
};
exports.generateVerificationToken = generateVerificationToken;
const validatePasswordStrength = (password) => {
    const errors = [];
    if (!password) {
        errors.push('Password is required');
        return { valid: false, errors };
    }
    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }
    if (password.length > 128) {
        errors.push('Password must be less than 128 characters long');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!/\d/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }
    const commonPatterns = [
        /123456/,
        /password/i,
        /qwerty/i,
        /admin/i,
        /letmein/i
    ];
    for (const pattern of commonPatterns) {
        if (pattern.test(password)) {
            errors.push('Password contains common patterns and is not secure');
            break;
        }
    }
    return {
        valid: errors.length === 0,
        errors
    };
};
exports.validatePasswordStrength = validatePasswordStrength;
const generateTemporaryPassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    password += '0123456789'[Math.floor(Math.random() * 10)];
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)];
    for (let i = password.length; i < length; i++) {
        password += charset[Math.floor(Math.random() * charset.length)];
    }
    return password.split('').sort(() => Math.random() - 0.5).join('');
};
exports.generateTemporaryPassword = generateTemporaryPassword;
//# sourceMappingURL=password.js.map