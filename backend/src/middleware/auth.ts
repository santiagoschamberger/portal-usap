import { Request, Response, NextFunction } from 'express';
import { supabase, supabaseAdmin } from '../config/database';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    partner_id: string;
    role: 'admin' | 'sub_account' | 'sub';
    first_name?: string;
    last_name?: string;
  };
  /**
   * The authenticated "actor" derived from the JWT.
   * When impersonating, `user` becomes the effective user and `actorUser` remains the admin.
   */
  actorUser?: {
    id: string;
    email: string;
    partner_id: string;
    role: 'admin' | 'sub_account' | 'sub';
    first_name?: string;
    last_name?: string;
  };
  impersonation?: {
    target_user_id: string;
  };
}

/**
 * Middleware to authenticate requests using Supabase Auth
 */
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ 
        error: 'Access token required',
        message: 'Please provide a valid authorization token' 
      });
      return;
    }

    // Verify token with Supabase using admin client
    // This allows us to verify any valid Supabase JWT token
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.error('Token verification failed:', authError);
      res.status(401).json({ 
        error: 'Unauthorized',
        message: authError?.message || 'The provided token is invalid or expired' 
      });
      return;
    }

    // Get user data from our custom users table using admin client to bypass RLS
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select(`
        partner_id,
        role,
        first_name,
        last_name,
        is_active
      `)
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      res.status(403).json({ 
        error: 'User not found',
        message: 'User record not found in portal database' 
      });
      return;
    }

    if (!userData.is_active) {
      res.status(403).json({ 
        error: 'Account inactive',
        message: 'Your account has been deactivated' 
      });
      return;
    }

    const actorUser = {
      id: user.id,
      email: user.email || '',
      partner_id: userData.partner_id,
      role: userData.role,
      first_name: userData.first_name,
      last_name: userData.last_name,
    };

    // Default effective user is the actor.
    req.actorUser = actorUser;
    req.user = actorUser;

    // Optional admin impersonation (securely server-enforced).
    // If present, only allow admins to impersonate, and swap req.user to target user context.
    const impersonateUserIdHeader = req.headers['x-impersonate-user-id'];
    const impersonateUserId =
      typeof impersonateUserIdHeader === 'string'
        ? impersonateUserIdHeader
        : Array.isArray(impersonateUserIdHeader)
          ? impersonateUserIdHeader[0]
          : undefined;

    if (impersonateUserId && impersonateUserId !== actorUser.id) {
      if (actorUser.role !== 'admin') {
        res.status(403).json({
          error: 'Impersonation not allowed',
          message: 'Only admins can impersonate another user',
        });
        return;
      }

      const { data: targetUserData, error: targetUserError } = await supabaseAdmin
        .from('users')
        .select(
          `
          id,
          email,
          partner_id,
          role,
          first_name,
          last_name,
          is_active
        `
        )
        .eq('id', impersonateUserId)
        .single();

      if (targetUserError || !targetUserData) {
        res.status(404).json({
          error: 'Impersonated user not found',
          message: 'Unable to find the specified impersonated user',
        });
        return;
      }

      if (!targetUserData.is_active) {
        res.status(403).json({
          error: 'Impersonated user inactive',
          message: 'Cannot impersonate an inactive user',
        });
        return;
      }

      req.user = {
        id: targetUserData.id,
        email: targetUserData.email || '',
        partner_id: targetUserData.partner_id,
        role: targetUserData.role,
        first_name: targetUserData.first_name,
        last_name: targetUserData.last_name,
      };
      req.impersonation = { target_user_id: targetUserData.id };
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      error: 'Authentication error',
      message: 'Internal server error during authentication' 
    });
  }
};

/**
 * Middleware to check if user has admin role
 */
export const requireAdmin = (
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
      error: 'Admin access required',
      message: 'This action requires admin privileges' 
    });
    return;
  }

  next();
};

/**
 * Middleware to check if user belongs to the same partner organization
 */
export const requireSamePartner = (partnerIdParam: string = 'partnerId') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please authenticate first' 
      });
      return;
    }

    const requestedPartnerId = req.params[partnerIdParam] || req.body[partnerIdParam];
    
    if (req.user.partner_id !== requestedPartnerId) {
      res.status(403).json({ 
        error: 'Access denied',
        message: 'You can only access resources from your own organization' 
      });
      return;
    }

    next();
  };
}; 