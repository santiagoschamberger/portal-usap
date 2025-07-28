"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const database_1 = require("../config/database");
const password_1 = require("../utils/password");
const jwt_1 = require("../utils/jwt");
class AuthService {
    static async login(email, password, deviceInfo) {
        try {
            const { data: users, error: userError } = await database_1.supabaseAdmin
                .from('users')
                .select(`
                    id, partner_id, email, password_hash, first_name, last_name, 
                    role, is_active, email_verified, last_login,
                    partners:partner_id (
                        id, name, email, approved, status
                    )
                `)
                .eq('email', email.toLowerCase())
                .eq('is_active', true)
                .single();
            if (userError || !users) {
                return {
                    success: false,
                    message: 'Invalid email or password'
                };
            }
            const isValidPassword = await (0, password_1.verifyPassword)(password, users.password_hash);
            if (!isValidPassword) {
                return {
                    success: false,
                    message: 'Invalid email or password'
                };
            }
            const partner = users.partners;
            if (!partner || !partner.approved) {
                return {
                    success: false,
                    message: 'Your partner account is not yet approved. Please contact support.'
                };
            }
            const tokenPayload = {
                userId: users.id,
                partnerId: users.partner_id,
                email: users.email,
                role: users.role
            };
            const tokens = (0, jwt_1.generateTokenPair)(tokenPayload);
            await this.createSession(users.id, tokens.refreshToken, tokens.tokenId, deviceInfo);
            await database_1.supabaseAdmin
                .from('users')
                .update({ last_login: new Date().toISOString() })
                .eq('id', users.id);
            await this.logActivity('USER_LOGIN', users.id, 'User logged in successfully', {
                deviceInfo,
                loginTime: new Date().toISOString()
            });
            return {
                success: true,
                user: {
                    id: users.id,
                    partner_id: users.partner_id,
                    email: users.email,
                    first_name: users.first_name,
                    last_name: users.last_name,
                    role: users.role,
                    is_active: users.is_active,
                    email_verified: users.email_verified
                },
                partner: {
                    id: partner.id,
                    name: partner.name,
                    email: partner.email,
                    approved: partner.approved,
                    status: partner.status
                },
                tokens: {
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken,
                    expiresIn: tokens.expiresIn
                }
            };
        }
        catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: 'An error occurred during login'
            };
        }
    }
    static async register(partnerId, email, password, firstName, lastName, role = 'sub') {
        try {
            const passwordValidation = (0, password_1.validatePasswordStrength)(password);
            if (!passwordValidation.valid) {
                return {
                    success: false,
                    message: `Password validation failed: ${passwordValidation.errors.join(', ')}`
                };
            }
            const { data: existingUser } = await database_1.supabaseAdmin
                .from('users')
                .select('id')
                .eq('email', email.toLowerCase())
                .single();
            if (existingUser) {
                return {
                    success: false,
                    message: 'User with this email already exists'
                };
            }
            const { data: partner, error: partnerError } = await database_1.supabaseAdmin
                .from('partners')
                .select('id, approved')
                .eq('id', partnerId)
                .eq('approved', true)
                .single();
            if (partnerError || !partner) {
                return {
                    success: false,
                    message: 'Partner not found or not approved'
                };
            }
            const passwordHash = await (0, password_1.hashPassword)(password);
            const { data: newUser, error: createError } = await database_1.supabaseAdmin
                .from('users')
                .insert({
                partner_id: partnerId,
                email: email.toLowerCase(),
                password_hash: passwordHash,
                first_name: firstName,
                last_name: lastName,
                role: role,
                email_verification_token: (0, password_1.generateVerificationToken)()
            })
                .select()
                .single();
            if (createError || !newUser) {
                console.error('User creation error:', createError);
                return {
                    success: false,
                    message: 'Failed to create user account'
                };
            }
            await this.logActivity('USER_REGISTERED', newUser.id, 'New user account created', {
                partnerId,
                role,
                registrationTime: new Date().toISOString()
            });
            return {
                success: true,
                user: {
                    id: newUser.id,
                    partner_id: newUser.partner_id,
                    email: newUser.email,
                    first_name: newUser.first_name,
                    last_name: newUser.last_name,
                    role: newUser.role,
                    is_active: newUser.is_active,
                    email_verified: newUser.email_verified
                },
                message: 'User account created successfully'
            };
        }
        catch (error) {
            console.error('Registration error:', error);
            return {
                success: false,
                message: 'An error occurred during registration'
            };
        }
    }
    static async refreshToken(refreshToken) {
        try {
            const decoded = (0, jwt_1.verifyRefreshToken)(refreshToken);
            const { data: session, error: sessionError } = await database_1.supabaseAdmin
                .from('user_sessions')
                .select('id, user_id, is_active, expires_at')
                .eq('id', decoded.tokenId)
                .eq('is_active', true)
                .single();
            if (sessionError || !session) {
                return {
                    success: false,
                    message: 'Invalid refresh token'
                };
            }
            if (new Date(session.expires_at) < new Date()) {
                await this.invalidateSession(session.id);
                return {
                    success: false,
                    message: 'Refresh token expired'
                };
            }
            const { data: user, error: userError } = await database_1.supabaseAdmin
                .from('users')
                .select(`
                    id, partner_id, email, first_name, last_name, 
                    role, is_active, email_verified,
                    partners:partner_id (id, name, email, approved, status)
                `)
                .eq('id', session.user_id)
                .eq('is_active', true)
                .single();
            if (userError || !user) {
                return {
                    success: false,
                    message: 'User not found or inactive'
                };
            }
            const tokenPayload = {
                userId: user.id,
                partnerId: user.partner_id,
                email: user.email,
                role: user.role
            };
            const tokens = (0, jwt_1.generateTokenPair)(tokenPayload);
            await database_1.supabaseAdmin
                .from('user_sessions')
                .update({
                refresh_token_hash: tokens.tokenId,
                last_used_at: new Date().toISOString()
            })
                .eq('id', session.id);
            const partner = user.partners;
            return {
                success: true,
                user: {
                    id: user.id,
                    partner_id: user.partner_id,
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    role: user.role,
                    is_active: user.is_active,
                    email_verified: user.email_verified
                },
                partner: {
                    id: partner.id,
                    name: partner.name,
                    email: partner.email,
                    approved: partner.approved,
                    status: partner.status
                },
                tokens: {
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken,
                    expiresIn: tokens.expiresIn
                }
            };
        }
        catch (error) {
            console.error('Token refresh error:', error);
            return {
                success: false,
                message: 'Invalid refresh token'
            };
        }
    }
    static async logout(userId, refreshToken) {
        try {
            const decoded = (0, jwt_1.verifyRefreshToken)(refreshToken);
            await this.invalidateSession(decoded.tokenId);
            await this.logActivity('USER_LOGOUT', userId, 'User logged out', {
                logoutTime: new Date().toISOString()
            });
            return {
                success: true,
                message: 'Logged out successfully'
            };
        }
        catch (error) {
            console.error('Logout error:', error);
            return {
                success: false,
                message: 'Error during logout'
            };
        }
    }
    static async createSession(userId, refreshToken, tokenId, deviceInfo) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        await database_1.supabaseAdmin
            .from('user_sessions')
            .insert({
            id: tokenId,
            user_id: userId,
            refresh_token_hash: tokenId,
            device_info: deviceInfo,
            expires_at: expiresAt.toISOString()
        });
    }
    static async invalidateSession(sessionId) {
        await database_1.supabaseAdmin
            .from('user_sessions')
            .update({ is_active: false })
            .eq('id', sessionId);
    }
    static async logActivity(action, userId, description, metadata) {
        await database_1.supabaseAdmin
            .from('activity_log')
            .insert({
            entity_type: 'USER',
            entity_id: userId,
            action,
            description,
            metadata,
            user_id: userId
        });
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=authService.js.map