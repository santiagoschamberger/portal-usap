"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const authService_1 = require("../services/authService");
const express_validator_1 = require("express-validator");
class AuthController {
    static async login(req, res) {
        try {
            await (0, express_validator_1.body)('email')
                .isEmail()
                .normalizeEmail()
                .withMessage('Valid email is required')
                .run(req);
            await (0, express_validator_1.body)('password')
                .notEmpty()
                .withMessage('Password is required')
                .run(req);
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }
            const { email, password } = req.body;
            const deviceInfo = {
                userAgent: req.headers['user-agent'],
                ip: req.ip,
                timestamp: new Date().toISOString()
            };
            const result = await authService_1.AuthService.login(email, password, deviceInfo);
            if (!result.success) {
                return res.status(401).json({
                    success: false,
                    message: result.message
                });
            }
            res.cookie('refreshToken', result.tokens?.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });
            return res.status(200).json({
                success: true,
                message: 'Login successful',
                data: {
                    user: result.user,
                    partner: result.partner,
                    accessToken: result.tokens?.accessToken,
                    expiresIn: result.tokens?.expiresIn
                }
            });
        }
        catch (error) {
            console.error('Login error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    static async logout(req, res) {
        try {
            const refreshToken = req.cookies.refreshToken;
            const userId = req.user?.userId;
            if (!refreshToken || !userId) {
                return res.status(400).json({
                    success: false,
                    message: 'No active session found'
                });
            }
            const result = await authService_1.AuthService.logout(userId, refreshToken);
            res.clearCookie('refreshToken');
            return res.status(200).json(result);
        }
        catch (error) {
            console.error('Logout error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    static async register(req, res) {
        try {
            await (0, express_validator_1.body)('email')
                .isEmail()
                .normalizeEmail()
                .withMessage('Valid email is required')
                .run(req);
            await (0, express_validator_1.body)('password')
                .isLength({ min: 8 })
                .withMessage('Password must be at least 8 characters long')
                .run(req);
            await (0, express_validator_1.body)('firstName')
                .optional()
                .isLength({ min: 1, max: 100 })
                .withMessage('First name must be between 1 and 100 characters')
                .run(req);
            await (0, express_validator_1.body)('lastName')
                .optional()
                .isLength({ min: 1, max: 100 })
                .withMessage('Last name must be between 1 and 100 characters')
                .run(req);
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }
            const { email, password, firstName, lastName } = req.body;
            const partnerId = req.user?.partnerId;
            if (!partnerId) {
                return res.status(400).json({
                    success: false,
                    message: 'Partner ID is required'
                });
            }
            if (req.user?.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Only admin users can create sub-accounts'
                });
            }
            const result = await authService_1.AuthService.register(partnerId, email, password, firstName, lastName, 'sub');
            const statusCode = result.success ? 201 : 400;
            return res.status(statusCode).json(result);
        }
        catch (error) {
            console.error('Registration error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    static async refreshToken(req, res) {
        try {
            const refreshToken = req.cookies.refreshToken;
            if (!refreshToken) {
                return res.status(401).json({
                    success: false,
                    message: 'Refresh token not found'
                });
            }
            const result = await authService_1.AuthService.refreshToken(refreshToken);
            if (!result.success) {
                res.clearCookie('refreshToken');
                return res.status(401).json({
                    success: false,
                    message: result.message
                });
            }
            res.cookie('refreshToken', result.tokens?.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });
            return res.status(200).json({
                success: true,
                message: 'Token refreshed successfully',
                data: {
                    user: result.user,
                    partner: result.partner,
                    accessToken: result.tokens?.accessToken,
                    expiresIn: result.tokens?.expiresIn
                }
            });
        }
        catch (error) {
            console.error('Token refresh error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    static async profile(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
            }
            return res.status(200).json({
                success: true,
                data: {
                    user: {
                        userId: req.user.userId,
                        partnerId: req.user.partnerId,
                        email: req.user.email,
                        role: req.user.role
                    }
                }
            });
        }
        catch (error) {
            console.error('Profile error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    static async validateToken(req, res) {
        try {
            return res.status(200).json({
                success: true,
                message: 'Token is valid',
                data: {
                    valid: true,
                    user: req.user
                }
            });
        }
        catch (error) {
            console.error('Token validation error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=authController.js.map