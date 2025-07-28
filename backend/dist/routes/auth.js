"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/login', authController_1.AuthController.login);
router.post('/logout', auth_1.authenticateToken, authController_1.AuthController.logout);
router.post('/register', auth_1.authenticateToken, auth_1.requireAdmin, authController_1.AuthController.register);
router.post('/refresh', authController_1.AuthController.refreshToken);
router.get('/profile', auth_1.authenticateToken, authController_1.AuthController.profile);
router.get('/validate', auth_1.authenticateToken, authController_1.AuthController.validateToken);
exports.default = router;
//# sourceMappingURL=auth.js.map