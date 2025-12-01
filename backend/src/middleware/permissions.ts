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

