/**
 * Permission Middleware
 * 
 * Middleware functions for checking user permissions beyond basic authentication.
 * These middlewares work in conjunction with the authenticateToken middleware.
 */

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';

/**
 * Middleware to check if user has permission to submit leads
 * Blocks Agent/ISO users who cannot submit leads via portal
 */
export const requireCanSubmitLeads = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ 
      error: 'Authentication required',
      message: 'Please authenticate first' 
    });
    return;
  }

  // This check will be enforced by RLS, but we add it here for clarity
  // The can_submit_leads field is checked in the database
  // For Agent/ISO users, this will be false
  
  // Note: The actual permission check happens in RLS policies
  // This middleware is here for explicit API-level validation if needed
  next();
};

/**
 * Middleware to check if user can view all partner leads
 * Sub-accounts without this permission can only see their own leads
 */
export const requireCanViewAllPartnerLeads = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ 
      error: 'Authentication required',
      message: 'Please authenticate first' 
    });
    return;
  }

  // Admin users always have this permission
  if (req.user.role === 'admin') {
    next();
    return;
  }

  // For sub-accounts, this is enforced by RLS policies
  // The can_view_all_partner_leads field determines access
  // If false, they only see leads where created_by_user_id = their user id
  
  res.status(403).json({ 
    error: 'Insufficient permissions',
    message: 'You can only view leads you have submitted' 
  });
};

/**
 * Middleware to check if user is a main partner (admin role)
 * Used for sub-account management endpoints
 */
export const requireMainPartner = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ 
      error: 'Authentication required',
      message: 'Please authenticate first' 
    });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({ 
      error: 'Main partner access required',
      message: 'This action requires main partner (admin) privileges' 
    });
    return;
  }

  next();
};

/**
 * Middleware to check if user is a sub-account
 * Can be used for sub-account-specific features
 */
export const requireSubAccount = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ 
      error: 'Authentication required',
      message: 'Please authenticate first' 
    });
    return;
  }

  if (req.user.role !== 'sub' && req.user.role !== 'sub_account') {
    res.status(403).json({ 
      error: 'Sub-account access required',
      message: 'This action is only available to sub-accounts' 
    });
    return;
  }

  next();
};

/**
 * Middleware to check if user can manage a specific sub-account
 * Verifies that the sub-account belongs to the same partner organization
 */
export const requireCanManageSubAccount = (subAccountIdParam: string = 'id') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please authenticate first' 
      });
      return;
    }

    // Only admins can manage sub-accounts
    if (req.user.role !== 'admin') {
      res.status(403).json({ 
        error: 'Admin access required',
        message: 'Only main partners can manage sub-accounts' 
      });
      return;
    }

    // The actual verification that the sub-account belongs to this partner
    // is done in the route handler by checking partner_id
    next();
  };
};

/**
 * Middleware to add user context to request for logging
 * Adds user information to the request object for activity logging
 */
export const addUserContext = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.user) {
    // Add user context for logging
    req.body._user_context = {
      user_id: req.user.id,
      partner_id: req.user.partner_id,
      role: req.user.role,
      timestamp: new Date().toISOString()
    };
  }
  next();
};

/**
 * Middleware to check if user is a regular partner (not agent/ISO)
 * Agents and ISOs have read-only access and cannot submit leads
 */
export const requireRegularPartner = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ 
      error: 'Authentication required',
      message: 'Please authenticate first' 
    });
    return;
  }

  try {
    // Import supabaseAdmin here to avoid circular dependency
    const { supabaseAdmin } = await import('../config/database');
    
    // Check partner type from database
    const { data: partner, error } = await supabaseAdmin
      .from('partners')
      .select('partner_type')
      .eq('id', req.user.partner_id)
      .single();

    if (error) {
      console.error('Error checking partner type:', error);
      res.status(500).json({ 
        error: 'Failed to verify permissions',
        message: 'Unable to check partner type' 
      });
      return;
    }

    // Block agents and ISOs from this action
    if (partner?.partner_type === 'agent' || partner?.partner_type === 'iso') {
      res.status(403).json({ 
        error: 'Action not allowed',
        message: 'Agents and ISOs cannot submit leads. Please contact your administrator.' 
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Error in requireRegularPartner middleware:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

/**
 * Helper function to check if a user is an agent or ISO
 * Returns true if user belongs to an agent/ISO partner
 */
export const isAgentOrISO = async (userId: string): Promise<boolean> => {
  try {
    const { supabaseAdmin } = await import('../config/database');
    
    // Use the database helper function
    const { data, error } = await supabaseAdmin
      .rpc('is_agent_or_iso', { user_uuid: userId });

    if (error) {
      console.error('Error checking if user is agent/ISO:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('Error in isAgentOrISO helper:', error);
    return false;
  }
};

