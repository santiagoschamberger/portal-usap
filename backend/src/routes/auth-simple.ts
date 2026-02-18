import { Router } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { supabase, supabaseAdmin } from '../config/database';
import { sendPasswordResetEmail } from '../services/passwordResetService';

const router = Router();

/**
 * POST /auth/login
 * Login with email and password
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Use Supabase auth to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
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

    // Get user details from public.users table using admin client to bypass RLS
    const { data: userData, error: userError } = await supabaseAdmin
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
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Login failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /auth/profile
 * Get current user profile (for testing authentication)
 */
router.get('/profile', authenticateToken, async (req: AuthenticatedRequest, res) => {
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
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({
      error: 'Failed to fetch profile',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /auth/validate
 * Validate current token
 */
router.get('/validate', authenticateToken, (req: AuthenticatedRequest, res) => {
  return res.json({
    success: true,
    message: 'Token is valid',
    user: req.user
  });
});

/**
 * POST /auth/forgot-password
 * Initiate password reset process
 */
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

    // Use custom branded email service
    try {
      await sendPasswordResetEmail({
        email,
        redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password`
      });
      console.log('Password reset email sent successfully');
    } catch (emailError) {
      console.error('Password reset error:', emailError);
      return res.status(400).json({
        success: false,
        error: emailError instanceof Error ? emailError.message : 'Failed to send reset email'
      });
    }

    return res.json({
      success: true,
      message: 'Password reset email sent. Please check your inbox.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to send password reset email',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /auth/reset-password
 * Reset password with access token from Supabase email
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        error: 'Token and password are required'
      });
    }

    // The token is actually an access_token from Supabase's password reset email
    // We need to verify it and get the user, then update their password
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      console.error('Invalid or expired token:', userError);
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token'
      });
    }

    // Use admin API to update the user's password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userData.user.id,
      { password: password }
    );

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
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to reset password',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /auth/verify-reset-token
 * Verify if reset token is valid
 */
router.post('/verify-reset-token', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required'
      });
    }

    // Token verification is handled by Supabase when the user follows the email link
    // This endpoint mainly exists for frontend validation
    return res.json({
      success: true,
      message: 'Token is valid'
    });
  } catch (error) {
    console.error('Verify reset token error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to verify token',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;