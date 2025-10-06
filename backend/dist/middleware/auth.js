"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireSamePartner = exports.requireAdmin = exports.authenticateToken = void 0;
const database_1 = require("../config/database");
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            res.status(401).json({
                error: 'Access token required',
                message: 'Please provide a valid authorization token'
            });
            return;
        }
        const { data: { user }, error: authError } = await database_1.supabase.auth.getUser(token);
        if (authError || !user) {
            res.status(401).json({
                error: 'Invalid token',
                message: 'The provided token is invalid or expired'
            });
            return;
        }
        const { data: userData, error: userError } = await database_1.supabaseAdmin
            .from('users')
            .select(`
        partner_id,
        role,
        first_name,
        last_name,
        is_active
      `)
            .eq('id', user.id)
            .single();
        if (userError || !userData) {
            res.status(403).json({
                error: 'User not found',
                message: 'User record not found in portal database'
            });
            return;
        }
        if (!userData.is_active) {
            res.status(403).json({
                error: 'Account inactive',
                message: 'Your account has been deactivated'
            });
            return;
        }
        req.user = {
            id: user.id,
            email: user.email || '',
            partner_id: userData.partner_id,
            role: userData.role,
            first_name: userData.first_name,
            last_name: userData.last_name,
        };
        next();
    }
    catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({
            error: 'Authentication error',
            message: 'Internal server error during authentication'
        });
    }
};
exports.authenticateToken = authenticateToken;
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({
            error: 'Authentication required',
            message: 'Please authenticate first'
        });
        return;
    }
    if (req.user.role !== 'admin') {
        res.status(403).json({
            error: 'Admin access required',
            message: 'This action requires admin privileges'
        });
        return;
    }
    next();
};
exports.requireAdmin = requireAdmin;
const requireSamePartner = (partnerIdParam = 'partnerId') => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                error: 'Authentication required',
                message: 'Please authenticate first'
            });
            return;
        }
        const requestedPartnerId = req.params[partnerIdParam] || req.body[partnerIdParam];
        if (req.user.partner_id !== requestedPartnerId) {
            res.status(403).json({
                error: 'Access denied',
                message: 'You can only access resources from your own organization'
            });
            return;
        }
        next();
    };
};
exports.requireSamePartner = requireSamePartner;
//# sourceMappingURL=auth.js.map