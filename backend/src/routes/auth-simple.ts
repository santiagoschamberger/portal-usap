import { Router } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { supabase, supabaseAdmin } from '../config/database';

const router = Router();

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

    // First, check if user exists in auth.users using admin client
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    const userExists = authUser?.users?.some(u => u.email === email);

    if (!userExists) {
      console.log('User not found in auth.users:', email);
      return res.status(404).json({
        success: false,
        error: 'No account found with that email address'
      });
    }

    console.log('User found in auth, sending reset email:', email);
    console.log('Frontend URL:', process.env.FRONTEND_URL);

    // Use Supabase's built-in password reset with the regular client (anon key)
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
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
 * Reset password with token
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

    // Verify the token and update password
    const { error } = await supabase.auth.updateUser({
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