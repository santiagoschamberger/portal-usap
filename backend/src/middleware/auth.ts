import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/database';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    partner_id: string;
    role: 'admin' | 'sub';
    first_name?: string;
    last_name?: string;
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

    // Verify token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      res.status(401).json({ 
        error: 'Invalid token',
        message: 'The provided token is invalid or expired' 
      });
      return;
    }

    // Get user data from our custom users table
    const { data: userData, error: userError } = await supabase
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

    // Attach user info to request object
    req.user = {
      id: user.id,
      email: user.email || '',
      partner_id: userData.partner_id,
      role: userData.role,
      first_name: userData.first_name,
      last_name: userData.last_name,
    };

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