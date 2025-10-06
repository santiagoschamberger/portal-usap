"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const database_1 = require("../config/database");
const router = (0, express_1.Router)();
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required'
            });
        }
        const { data, error } = await database_1.supabase.auth.signInWithPassword({
            email,
            password
        });
        if (error || !data.user || !data.session) {
            console.error('Login error:', error);
            return res.status(401).json({
                success: false,
                error: error?.message || 'Invalid email or password'
            });
        }
        const { data: userData, error: userError } = await database_1.supabaseAdmin
            .from('users')
            .select('id, email, partner_id, role, first_name, last_name')
            .eq('id', data.user.id)
            .single();
        if (userError || !userData) {
            console.error('User data fetch error:', userError);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch user data'
            });
        }
        console.log('Login successful for:', email);
        return res.json({
            success: true,
            data: {
                user: userData,
                token: data.session.access_token,
                refreshToken: data.session.refresh_token
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            error: 'Login failed',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
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
        console.log('Password reset requested for:', email);
        console.log('Frontend URL:', process.env.FRONTEND_URL);
        const { data, error } = await database_1.supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password`
        });
        if (error) {
            console.error('Password reset error:', error);
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }
        console.log('Password reset email sent successfully');
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
        const { data: userData, error: userError } = await database_1.supabase.auth.getUser(token);
        if (userError || !userData.user) {
            console.error('Invalid or expired token:', userError);
            return res.status(400).json({
                success: false,
                error: 'Invalid or expired reset token'
            });
        }
        const { error: updateError } = await database_1.supabaseAdmin.auth.admin.updateUserById(userData.user.id, { password: password });
        if (updateError) {
            console.error('Password update error:', updateError);
            return res.status(400).json({
                success: false,
                error: updateError.message
            });
        }
        console.log('Password reset successful for user:', userData.user.email);
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