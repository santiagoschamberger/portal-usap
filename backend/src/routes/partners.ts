import { Router } from 'express';
import { authenticateToken, AuthenticatedRequest, requireAdmin } from '../middleware/auth';
import { supabase, supabaseAdmin } from '../config/database';
import { zohoService } from '../services/zohoService';
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
 * Fetch contacts from Zoho CRM and show which ones are activated in the portal
 * This is the NEW approach: fetch from Zoho (single source of truth)
 */
router.get('/sub-accounts', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get partner's Zoho ID
    const { data: partner, error: partnerError } = await supabaseAdmin
      .from('partners')
      .select('zoho_partner_id, name')
      .eq('id', req.user.partner_id)
      .single();

    if (partnerError || !partner) {
      return res.status(404).json({
        error: 'Partner not found',
        message: 'Unable to find partner information'
      });
    }

    // Fetch contacts from Zoho CRM
    let zohoContacts: any[] = [];
    try {
      const zohoResponse = await zohoService.getContactsByVendor(partner.zoho_partner_id);
      zohoContacts = zohoResponse?.data || [];
      console.log(`📋 Found ${zohoContacts.length} contacts in Zoho for partner ${partner.name}`);
    } catch (zohoError) {
      console.error('Error fetching contacts from Zoho:', zohoError);
      // Continue with empty array - don't fail the request
    }

    // Get all activated users (sub-accounts) from our database
    const { data: activatedUsers } = await supabaseAdmin
      .from('users')
      .select('id, email, first_name, last_name, role, is_active, created_at')
      .eq('partner_id', req.user.partner_id)
      .neq('id', req.user.id); // Exclude the main admin

    // Create a map of activated emails for quick lookup
    const activatedEmailMap = new Map(
      (activatedUsers || []).map(user => [user.email.toLowerCase(), user])
    );

    // Merge Zoho contacts with activation status
    const contactsWithStatus = zohoContacts.map(contact => {
      const email = contact.Email?.toLowerCase();
      const activatedUser = email ? activatedEmailMap.get(email) : null;

        return {
        zoho_contact_id: contact.id,
        first_name: contact.First_Name || '',
        last_name: contact.Last_Name || '',
        email: contact.Email || '',
        phone: contact.Phone || '',
        title: contact.Title || '',
        is_activated: !!activatedUser,
        portal_user_id: activatedUser?.id || null,
        is_active: activatedUser?.is_active || false,
        created_at: contact.Created_Time,
        activated_at: activatedUser?.created_at || null
        };
    });

    return res.json({
      success: true,
      data: contactsWithStatus,
      total: contactsWithStatus.length,
      stats: {
        total_contacts: contactsWithStatus.length,
        activated: contactsWithStatus.filter(c => c.is_activated).length,
        not_activated: contactsWithStatus.filter(c => !c.is_activated).length
      }
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
        role: 'sub_account'
      }
    });

    if (authError || !authData.user) {
      console.error('Auth user creation error:', authError);
      return res.status(500).json({
        error: 'Failed to create sub-account',
        details: authError?.message || 'Unknown error'
      });
    }

    // Create user in public.users table (deactivated by default)
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        first_name,
        last_name,
        partner_id: req.user.partner_id,
        role: 'sub_account',
        password_hash: 'placeholder', // Placeholder since auth is handled by Supabase Auth
        is_active: false
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
 * POST /api/partners/sync-contacts
 * Sync contacts from Zoho CRM for this partner
 */
router.post('/sync-contacts', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get partner information to find their Zoho vendor ID
    const { data: partner, error: partnerError } = await supabaseAdmin
      .from('partners')
      .select('id, name, zoho_partner_id')
      .eq('id', req.user.partner_id)
      .single();

    if (partnerError || !partner) {
      return res.status(404).json({
        error: 'Partner not found',
        message: 'Unable to find partner information'
      });
    }

    if (!partner.zoho_partner_id) {
      return res.status(400).json({
        error: 'Partner not linked to Zoho',
        message: 'This partner is not associated with a Zoho Vendor record'
      });
    }

    // Fetch contacts from Zoho CRM
    const zohoResponse = await zohoService.getContactsByVendor(partner.zoho_partner_id);

    if (!zohoResponse.data || zohoResponse.data.length === 0) {
      return res.json({
        success: true,
        message: 'No contacts found in Zoho CRM for this partner',
        synced: 0,
        created: 0,
        updated: 0
      });
    }

    let created = 0;
    let updated = 0;
    const syncResults = [];

    // Process each contact
    for (const contact of zohoResponse.data) {
      try {
        const email = contact.Email?.toLowerCase();
        if (!email || !contact.First_Name || !contact.Last_Name) {
          syncResults.push({
            contact_id: contact.id,
            status: 'skipped',
            reason: 'Missing required fields'
          });
          continue;
        }

        // Check if sub-account already exists
        const { data: existingUser } = await supabaseAdmin
          .from('users')
          .select('id, email, first_name, last_name')
          .eq('email', email)
          .single();

        if (existingUser) {
          // Update existing user
          const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({
              first_name: contact.First_Name,
              last_name: contact.Last_Name,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingUser.id);

          if (updateError) {
            syncResults.push({
              contact_id: contact.id,
              email,
              status: 'error',
              reason: updateError.message
            });
          } else {
            updated++;
            syncResults.push({
              contact_id: contact.id,
              email,
              status: 'updated',
              user_id: existingUser.id
            });
          }
        } else {
          // Create new sub-account
          const tempPassword = crypto.randomBytes(16).toString('hex');

          // Create user in Supabase Auth
          const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
              first_name: contact.First_Name,
              last_name: contact.Last_Name,
              partner_id: partner.id,
              role: 'sub_account',
              zoho_contact_id: contact.id
            }
          });

          if (authError || !authData.user) {
            syncResults.push({
              contact_id: contact.id,
              email,
              status: 'error',
              reason: authError?.message || 'Failed to create auth user'
            });
            continue;
          }

          // Create user in public.users table (deactivated by default)
          const { error: userError } = await supabaseAdmin
            .from('users')
            .insert({
              id: authData.user.id,
              email,
              first_name: contact.First_Name,
              last_name: contact.Last_Name,
              partner_id: partner.id,
              role: 'sub_account',
              password_hash: 'placeholder', // Placeholder since auth is handled by Supabase Auth
              is_active: false
            });

          if (userError) {
            // Rollback: delete auth user
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            syncResults.push({
              contact_id: contact.id,
              email,
              status: 'error',
              reason: userError.message
            });
          } else {
            created++;
            syncResults.push({
              contact_id: contact.id,
              email,
              status: 'created',
              user_id: authData.user.id
            });

            // Send password reset email
            await supabase.auth.resetPasswordForEmail(email, {
              redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password`
            });
          }
        }
      } catch (error) {
        console.error(`Error processing contact ${contact.id}:`, error);
        syncResults.push({
          contact_id: contact.id,
          email: contact.Email,
          status: 'error',
          reason: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Log activity
    await supabaseAdmin.from('activity_log').insert({
      partner_id: req.user.partner_id,
      user_id: req.user.id,
      activity_type: 'contacts_synced',
      description: `Synced ${zohoResponse.data.length} contacts from Zoho CRM (${created} created, ${updated} updated)`,
      metadata: { created, updated, total: zohoResponse.data.length }
    });

    return res.json({
      success: true,
      message: 'Contacts synced successfully',
      synced: zohoResponse.data.length,
      created,
      updated,
      details: syncResults
    });
  } catch (error) {
    console.error('Error syncing contacts:', error);
    return res.status(500).json({
      error: 'Failed to sync contacts',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/partners/sub-accounts/:zohoContactId/activate
 * Activate a contact from Zoho: create portal account + send password reset email
 * The :zohoContactId is the Zoho Contact ID, not the portal user ID
 */
router.post('/sub-accounts/:zohoContactId/activate', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const zohoContactId = req.params.zohoContactId;

    // Get partner's Zoho ID
    const { data: partner, error: partnerError } = await supabaseAdmin
      .from('partners')
      .select('id, zoho_partner_id, name')
      .eq('id', req.user.partner_id)
      .single();

    if (partnerError || !partner) {
      return res.status(404).json({
        error: 'Partner not found'
      });
    }

    // Fetch the contact from Zoho to get their details
    console.log(`🔍 Fetching contact ${zohoContactId} from Zoho...`);
    const zohoResponse = await zohoService.getContactsByVendor(partner.zoho_partner_id);
    const contact = zohoResponse?.data?.find((c: any) => c.id === zohoContactId);

    if (!contact) {
      return res.status(404).json({
        error: 'Contact not found in Zoho CRM',
        message: 'This contact does not exist or is not linked to your partner account'
      });
    }

    const email = contact.Email;
    const firstName = contact.First_Name || '';
    const lastName = contact.Last_Name || '';

    if (!email) {
      return res.status(400).json({
        error: 'Contact has no email',
        message: 'Cannot activate a contact without an email address'
      });
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, email, is_active')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      // User already exists - just send password reset email
      console.log(`✅ User already exists: ${existingUser.id}`);
      
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.toLowerCase(), {
      redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password`
    });

    if (resetError) {
      console.error('Failed to send password reset email:', resetError);
      return res.status(500).json({
        error: 'Failed to send activation email',
        message: resetError.message
      });
      }

      return res.json({
        success: true,
        message: `Activation email sent to ${email}`,
        user_id: existingUser.id
      });
    }

    // Create new user account
    console.log(`🆕 Creating new user account for ${email}...`);
    
    // Generate a temporary password
    const tempPassword = crypto.randomBytes(16).toString('hex');

    // Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        partner_id: partner.id,
        role: 'sub_account',
        zoho_contact_id: zohoContactId
      }
    });

    if (authError || !authUser.user) {
      console.error('Error creating auth user:', authError);
      return res.status(500).json({
        error: 'Failed to create user account',
        details: authError?.message || 'Unknown error'
      });
    }

    // Create user record in portal users table (deactivated by default)
    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authUser.user.id,
        email: email.toLowerCase(),
        partner_id: partner.id,
        role: 'sub_account',
        first_name: firstName,
        last_name: lastName,
        password_hash: 'placeholder',
        is_active: false
      });

    if (userError) {
      console.error('Error creating user record:', userError);
      // Rollback: delete auth user
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      return res.status(500).json({
        error: 'Failed to create user record',
        details: userError.message
      });
    }

    // Send password reset email
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.toLowerCase(), {
      redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password`
    });

    if (resetError) {
      console.error('Failed to send password reset email:', resetError);
      // Don't fail the request - user was created successfully
    }

    // Log activity
    await supabaseAdmin.from('activity_log').insert({
      partner_id: partner.id,
      user_id: req.user.id,
      activity_type: 'sub_account_activated',
      description: `Sub-account activated for ${firstName} ${lastName} (${email})`,
      metadata: { 
        sub_account_id: authUser.user.id,
        zoho_contact_id: zohoContactId
      }
    });

    console.log(`✅ Sub-account created and activated: ${authUser.user.id}`);

    return res.json({
      success: true,
      message: `Sub-account activated and email sent to ${email}`,
      user_id: authUser.user.id
    });
  } catch (error) {
    console.error('Error activating sub-account:', error);
    return res.status(500).json({
      error: 'Failed to activate sub-account',
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

/**
 * POST /api/partners/impersonate/:subAccountId
 * Impersonate a sub-account (admin only)
 */
router.post('/impersonate/:subAccountId', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { subAccountId } = req.params;

    // Verify the sub-account exists and belongs to this partner
    const { data: subAccount, error: subAccountError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', subAccountId)
      .eq('partner_id', req.user.partner_id)
      .eq('role', 'sub_account')
      .single();

    if (subAccountError || !subAccount) {
      return res.status(404).json({
        error: 'Sub-account not found',
        message: 'Unable to find sub-account or you do not have permission'
      });
    }

    if (!subAccount.is_active) {
      return res.status(403).json({
        error: 'Sub-account inactive',
        message: 'Cannot impersonate an inactive sub-account'
      });
    }

    // Create impersonation token
    const impersonationData = {
      id: subAccount.id,
      email: subAccount.email,
      partner_id: subAccount.partner_id,
      role: subAccount.role,
      first_name: subAccount.first_name,
      last_name: subAccount.last_name,
      is_impersonating: true,
      original_user_id: req.user.id,
      original_user_email: req.user.email
    };

    return res.json({
      success: true,
      message: 'Impersonation started',
      data: {
        user: impersonationData,
        token: req.headers.authorization?.split(' ')[1] // Return same token with impersonation flag
      }
    });
  } catch (error) {
    console.error('Error impersonating sub-account:', error);
    return res.status(500).json({
      error: 'Failed to impersonate sub-account',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;

