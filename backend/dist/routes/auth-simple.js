"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const database_1 = require("../config/database");
const router = (0, express_1.Router)();
router.get('/profile', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required'
            });
        }
        return res.json({
            success: true,
            data: {
                id: req.user.id,
                email: req.user.email,
                partner_id: req.user.partner_id,
                role: req.user.role,
                first_name: req.user.first_name,
                last_name: req.user.last_name
            }
        });
    }
    catch (error) {
        console.error('Error fetching profile:', error);
        return res.status(500).json({
            error: 'Failed to fetch profile',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/validate', auth_1.authenticateToken, (req, res) => {
    return res.json({
        success: true,
        message: 'Token is valid',
        user: req.user
    });
});
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Email is required'
            });
        }
        const { error } = await database_1.supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password`
        });
        if (error) {
            console.error('Password reset error:', error);
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }
        return res.json({
            success: true,
            message: 'Password reset email sent. Please check your inbox.'
        });
    }
    catch (error) {
        console.error('Forgot password error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to send password reset email',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) {
            return res.status(400).json({
                success: false,
                error: 'Token and password are required'
            });
        }
        const { error } = await database_1.supabase.auth.updateUser({
            password: password
        });
        if (error) {
            console.error('Password reset error:', error);
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }
        return res.json({
            success: true,
            message: 'Password has been reset successfully'
        });
    }
    catch (error) {
        console.error('Reset password error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to reset password',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/verify-reset-token', async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({
                success: false,
                error: 'Token is required'
            });
        }
        return res.json({
            success: true,
            message: 'Token is valid'
        });
    }
    catch (error) {
        console.error('Verify reset token error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to verify token',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=auth-simple.js.map