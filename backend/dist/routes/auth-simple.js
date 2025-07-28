"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
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
exports.default = router;
//# sourceMappingURL=auth-simple.js.map