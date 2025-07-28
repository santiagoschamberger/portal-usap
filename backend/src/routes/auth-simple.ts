import { Router } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

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

export default router;