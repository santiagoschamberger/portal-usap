import { Router } from 'express';
import { authenticateToken, AuthenticatedRequest, requireAdmin } from '../middleware/auth';
import { supabase, supabaseAdmin } from '../config/database';
import crypto from 'crypto';

const router = Router();

/**
 * GET /api/partners/profile
 * Get current partner's profile information
 */
router.get('/profile', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get partner information
    const { data: partner, error: partnerError } = await supabaseAdmin
      .from('partners')
      .select('*')
      .eq('id', req.user.partner_id)
      .single();

    if (partnerError || !partner) {
      return res.status(404).json({
        error: 'Partner not found',
        message: 'Unable to find partner information'
      });
    }

    return res.json({
      success: true,
      data: partner
    });
  } catch (error) {
    console.error('Error fetching partner profile:', error);
    return res.status(500).json({
      error: 'Failed to fetch profile',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/partners/profile
 * Update current partner's profile
 */
router.put('/profile', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { name, email, phone, address } = req.body;

    const { data: partner, error } = await supabaseAdmin
      .from('partners')
      .update({
        name,
        email,
        phone,
        address,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.user.partner_id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        error: 'Failed to update profile',
        details: error.message
      });
    }

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: partner
    });
  } catch (error) {
    console.error('Error updating partner profile:', error);
    return res.status(500).json({
      error: 'Failed to update profile',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/partners/sub-accounts
 * List all sub-accounts for the current partner
 */
router.get('/sub-accounts', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get all users (sub-accounts) under this partner
    const { data: subAccounts, error } = await supabaseAdmin
      .from('users')
      .select('id, email, first_name, last_name, role, is_active, created_at, updated_at')
      .eq('partner_id', req.user.partner_id)
      .neq('id', req.user.id) // Exclude the current user (main admin)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sub-accounts:', error);
      return res.status(500).json({
        error: 'Failed to fetch sub-accounts',
        details: error.message
      });
    }

    return res.json({
      success: true,
      data: subAccounts || [],
      total: subAccounts?.length || 0
    });
  } catch (error) {
    console.error('Error fetching sub-accounts:', error);
    return res.status(500).json({
      error: 'Failed to fetch sub-accounts',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/partners/sub-accounts
 * Create a new sub-account
 */
router.post('/sub-accounts', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { email, first_name, last_name } = req.body;

    // Validate required fields
    if (!email || !first_name || !last_name) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['email', 'first_name', 'last_name']
      });
    }

    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({
        error: 'Email already exists',
        message: 'A user with this email already exists'
      });
    }

    // Generate a temporary password
    const tempPassword = crypto.randomBytes(16).toString('hex');

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        first_name,
        last_name,
        partner_id: req.user.partner_id,
        role: 'sub'
      }
    });

    if (authError || !authData.user) {
      console.error('Auth user creation error:', authError);
      return res.status(500).json({
        error: 'Failed to create sub-account',
        details: authError?.message || 'Unknown error'
      });
    }

    // Create user in public.users table
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        first_name,
        last_name,
        partner_id: req.user.partner_id,
        role: 'sub',
        is_active: true
      })
      .select()
      .single();

    if (userError) {
      // Rollback: delete auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      
      console.error('User data creation error:', userError);
      return res.status(500).json({
        error: 'Failed to create sub-account',
        details: userError.message
      });
    }

    // Log activity
    await supabaseAdmin.from('activity_log').insert({
      partner_id: req.user.partner_id,
      user_id: req.user.id,
      activity_type: 'sub_account_created',
      description: `Sub-account created for ${first_name} ${last_name} (${email})`,
      metadata: { sub_account_id: userData.id }
    });

    // Send password reset email
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password`
    });

    if (resetError) {
      console.error('Failed to send password reset email:', resetError);
      // Continue anyway - user created successfully
    }

    return res.status(201).json({
      success: true,
      message: 'Sub-account created successfully. Password reset email sent.',
      data: userData
    });
  } catch (error) {
    console.error('Error creating sub-account:', error);
    return res.status(500).json({
      error: 'Failed to create sub-account',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/partners/sub-accounts/:id
 * Get specific sub-account details
 */
router.get('/sub-accounts/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { data: subAccount, error } = await supabaseAdmin
      .from('users')
      .select('id, email, first_name, last_name, role, is_active, created_at, updated_at')
      .eq('id', req.params.id)
      .eq('partner_id', req.user.partner_id)
      .single();

    if (error || !subAccount) {
      return res.status(404).json({
        error: 'Sub-account not found',
        message: 'Sub-account does not exist or you do not have access to it'
      });
    }

    // Get lead stats for this sub-account
    const { data: leads } = await supabaseAdmin
      .from('leads')
      .select('id, status')
      .eq('created_by_user_id', req.params.id);

    const stats = {
      total_leads: leads?.length || 0,
      new_leads: leads?.filter(l => l.status === 'new').length || 0,
      active_leads: leads?.filter(l => ['new', 'contacted', 'qualified'].includes(l.status)).length || 0,
      converted_leads: leads?.filter(l => l.status === 'converted').length || 0
    };

    return res.json({
      success: true,
      data: {
        ...subAccount,
        stats
      }
    });
  } catch (error) {
    console.error('Error fetching sub-account:', error);
    return res.status(500).json({
      error: 'Failed to fetch sub-account',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/partners/sub-accounts/:id
 * Update sub-account information
 */
router.put('/sub-accounts/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { first_name, last_name, is_active } = req.body;

    // Verify sub-account belongs to this partner
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', req.params.id)
      .eq('partner_id', req.user.partner_id)
      .single();

    if (!existingUser) {
      return res.status(404).json({
        error: 'Sub-account not found',
        message: 'Sub-account does not exist or you do not have access to it'
      });
    }

    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update({
        first_name,
        last_name,
        is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        error: 'Failed to update sub-account',
        details: error.message
      });
    }

    // Log activity
    await supabaseAdmin.from('activity_log').insert({
      partner_id: req.user.partner_id,
      user_id: req.user.id,
      activity_type: 'sub_account_updated',
      description: `Sub-account updated: ${first_name} ${last_name}`,
      metadata: { sub_account_id: req.params.id }
    });

    return res.json({
      success: true,
      message: 'Sub-account updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating sub-account:', error);
    return res.status(500).json({
      error: 'Failed to update sub-account',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/partners/sub-accounts/:id
 * Deactivate a sub-account
 */
router.delete('/sub-accounts/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify sub-account belongs to this partner
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, email, first_name, last_name')
      .eq('id', req.params.id)
      .eq('partner_id', req.user.partner_id)
      .single();

    if (!existingUser) {
      return res.status(404).json({
        error: 'Sub-account not found',
        message: 'Sub-account does not exist or you do not have access to it'
      });
    }

    // Deactivate user instead of deleting
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id);

    if (error) {
      return res.status(500).json({
        error: 'Failed to deactivate sub-account',
        details: error.message
      });
    }

    // Log activity
    await supabaseAdmin.from('activity_log').insert({
      partner_id: req.user.partner_id,
      user_id: req.user.id,
      activity_type: 'sub_account_deactivated',
      description: `Sub-account deactivated: ${existingUser.first_name} ${existingUser.last_name}`,
      metadata: { sub_account_id: req.params.id }
    });

    return res.json({
      success: true,
      message: 'Sub-account deactivated successfully'
    });
  } catch (error) {
    console.error('Error deactivating sub-account:', error);
    return res.status(500).json({
      error: 'Failed to deactivate sub-account',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;

