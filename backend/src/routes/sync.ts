/**
 * Sync API Routes
 * Endpoints for managing and monitoring sync operations
 */

import { Router } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { syncService } from '../services/syncService';
import { cronService } from '../services/cronService';

const router = Router();

/**
 * POST /api/sync/manual
 * Manually trigger a full sync of all partners
 * Requires admin authentication
 */
router.post('/manual', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Only allow admin users to trigger manual sync
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: 'Only admin users can trigger manual sync'
      });
    }

    console.log(`🔄 Manual sync triggered by user: ${req.user.email}`);

    const result = await syncService.triggerManualSync();

    return res.json({
      success: true,
      message: 'Manual sync completed',
      data: {
        totalPartners: result.totalPartners,
        successfulSyncs: result.successfulSyncs,
        summary: {
          totalLeads: result.results.reduce((sum: number, r: any) => sum + r.leads.created + r.leads.updated, 0),
          totalDeals: result.results.reduce((sum: number, r: any) => sum + r.deals.created + r.deals.updated, 0),
          errors: result.errors.length
        },
        results: result.results,
        errors: result.errors
      }
    });

  } catch (error) {
    console.error('Manual sync API error:', error);
    return res.status(500).json({
      error: 'Manual sync failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/sync/status
 * Get sync status and cron job information
 * Requires authentication
 */
router.get('/status', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const cronStatus = cronService.getStatus();

    // Get last sync activity from database
    const { supabaseAdmin } = require('../config/database');
    const { data: lastSyncActivity } = await supabaseAdmin
      .from('activity_log')
      .select('created_at, description, metadata')
      .eq('action', 'daily_sync_completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return res.json({
      success: true,
      data: {
        cronJobs: cronStatus,
        lastSync: lastSyncActivity ? {
          timestamp: lastSyncActivity.created_at,
          description: lastSyncActivity.description,
          details: lastSyncActivity.metadata
        } : null,
        nextScheduledSync: cronStatus.jobs.find(job => job.name === 'Daily Sync')?.nextRun || null
      }
    });

  } catch (error) {
    console.error('Sync status API error:', error);
    return res.status(500).json({
      error: 'Failed to get sync status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/sync/history
 * Get sync history for monitoring
 * Requires admin authentication
 */
router.get('/history', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Only allow admin users to view sync history
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: 'Only admin users can view sync history'
      });
    }

    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;

    const { supabaseAdmin } = require('../config/database');
    const { data: syncHistory, error } = await supabaseAdmin
      .from('activity_log')
      .select('created_at, description, metadata')
      .eq('action', 'daily_sync_completed')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch sync history: ${error.message}`);
    }

    return res.json({
      success: true,
      data: {
        history: syncHistory || [],
        pagination: {
          limit,
          offset,
          hasMore: (syncHistory?.length || 0) === limit
        }
      }
    });

  } catch (error) {
    console.error('Sync history API error:', error);
    return res.status(500).json({
      error: 'Failed to get sync history',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
