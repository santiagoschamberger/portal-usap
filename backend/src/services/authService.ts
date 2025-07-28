import { supabaseAdmin } from '../config/database';
import { hashPassword, verifyPassword, generateResetToken, generateVerificationToken, validatePasswordStrength } from '../utils/password';
import { generateTokenPair, verifyRefreshToken } from '../utils/jwt';

export interface User {
    id: string;
    partner_id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    role: string;
    is_active: boolean;
    email_verified: boolean;
}

export interface Partner {
    id: string;
    name: string;
    email: string;
    approved: boolean;
    status: string;
}

export interface LoginResult {
    success: boolean;
    user?: User;
    partner?: Partner;
    tokens?: {
        accessToken: string;
        refreshToken: string;
        expiresIn: string;
    };
    message?: string;
    requiresPasswordReset?: boolean;
}

export interface RegistrationResult {
    success: boolean;
    user?: User;
    message: string;
}

export class AuthService {
    /**
     * Authenticate user with email and password
     */
    static async login(email: string, password: string, deviceInfo?: any): Promise<LoginResult> {
        try {
            // Find user by email
            const { data: users, error: userError } = await supabaseAdmin
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

            // Verify password
            const isValidPassword = await verifyPassword(password, users.password_hash);
            if (!isValidPassword) {
                return {
                    success: false,
                    message: 'Invalid email or password'
                };
            }

            // Check if partner is approved
            const partner = users.partners as any;
            if (!partner || !partner.approved) {
                return {
                    success: false,
                    message: 'Your partner account is not yet approved. Please contact support.'
                };
            }

            // Generate tokens
            const tokenPayload = {
                userId: users.id,
                partnerId: users.partner_id,
                email: users.email,
                role: users.role
            };

            const tokens = generateTokenPair(tokenPayload);

            // Create session record
            await this.createSession(users.id, tokens.refreshToken, tokens.tokenId, deviceInfo);

            // Update last login
            await supabaseAdmin
                .from('users')
                .update({ last_login: new Date().toISOString() })
                .eq('id', users.id);

            // Log activity
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
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: 'An error occurred during login'
            };
        }
    }

    /**
     * Register a new user (sub-account)
     */
    static async register(
        partnerId: string,
        email: string,
        password: string,
        firstName?: string,
        lastName?: string,
        role: string = 'sub'
    ): Promise<RegistrationResult> {
        try {
            // Validate password strength
            const passwordValidation = validatePasswordStrength(password);
            if (!passwordValidation.valid) {
                return {
                    success: false,
                    message: `Password validation failed: ${passwordValidation.errors.join(', ')}`
                };
            }

            // Check if user already exists
            const { data: existingUser } = await supabaseAdmin
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

            // Verify partner exists and is approved
            const { data: partner, error: partnerError } = await supabaseAdmin
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

            // Hash password
            const passwordHash = await hashPassword(password);

            // Create user
            const { data: newUser, error: createError } = await supabaseAdmin
                .from('users')
                .insert({
                    partner_id: partnerId,
                    email: email.toLowerCase(),
                    password_hash: passwordHash,
                    first_name: firstName,
                    last_name: lastName,
                    role: role,
                    email_verification_token: generateVerificationToken()
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

            // Log activity
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
        } catch (error) {
            console.error('Registration error:', error);
            return {
                success: false,
                message: 'An error occurred during registration'
            };
        }
    }

    /**
     * Refresh access token using refresh token
     */
    static async refreshToken(refreshToken: string): Promise<LoginResult> {
        try {
            // Verify refresh token
            const decoded = verifyRefreshToken(refreshToken);

            // Find session
            const { data: session, error: sessionError } = await supabaseAdmin
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

            // Check if session is expired
            if (new Date(session.expires_at) < new Date()) {
                await this.invalidateSession(session.id);
                return {
                    success: false,
                    message: 'Refresh token expired'
                };
            }

            // Get user details
            const { data: user, error: userError } = await supabaseAdmin
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

            // Generate new tokens
            const tokenPayload = {
                userId: user.id,
                partnerId: user.partner_id,
                email: user.email,
                role: user.role
            };

            const tokens = generateTokenPair(tokenPayload);

            // Update session with new refresh token
            await supabaseAdmin
                .from('user_sessions')
                .update({
                    refresh_token_hash: tokens.tokenId,
                    last_used_at: new Date().toISOString()
                })
                .eq('id', session.id);

            const partner = user.partners as any;

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
        } catch (error) {
            console.error('Token refresh error:', error);
            return {
                success: false,
                message: 'Invalid refresh token'
            };
        }
    }

    /**
     * Logout user and invalidate session
     */
    static async logout(userId: string, refreshToken: string): Promise<{ success: boolean; message: string }> {
        try {
            const decoded = verifyRefreshToken(refreshToken);
            
            await this.invalidateSession(decoded.tokenId);
            
            // Log activity
            await this.logActivity('USER_LOGOUT', userId, 'User logged out', {
                logoutTime: new Date().toISOString()
            });

            return {
                success: true,
                message: 'Logged out successfully'
            };
        } catch (error) {
            console.error('Logout error:', error);
            return {
                success: false,
                message: 'Error during logout'
            };
        }
    }

    /**
     * Create user session
     */
    private static async createSession(userId: string, refreshToken: string, tokenId: string, deviceInfo?: any) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

        await supabaseAdmin
            .from('user_sessions')
            .insert({
                id: tokenId,
                user_id: userId,
                refresh_token_hash: tokenId,
                device_info: deviceInfo,
                expires_at: expiresAt.toISOString()
            });
    }

    /**
     * Invalidate session
     */
    private static async invalidateSession(sessionId: string) {
        await supabaseAdmin
            .from('user_sessions')
            .update({ is_active: false })
            .eq('id', sessionId);
    }

    /**
     * Log user activity
     */
    private static async logActivity(action: string, userId: string, description: string, metadata?: any) {
        await supabaseAdmin
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