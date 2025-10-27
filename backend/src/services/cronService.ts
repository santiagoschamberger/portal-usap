/**
 * Cron Service
 * Handles scheduled tasks like daily sync
 */

import cron from 'node-cron';
import { syncService } from './syncService';

class CronService {
  private isInitialized = false;

  /**
   * Initialize all cron jobs
   */
  init(): void {
    if (this.isInitialized) {
      console.log('⚠️ Cron service already initialized');
      return;
    }

    console.log('⏰ Initializing cron jobs...');

    // Daily sync at 2:00 AM UTC (optimal time - low traffic)
    // Cron format: second minute hour day month dayOfWeek
    cron.schedule('0 0 2 * * *', async () => {
      console.log('🌅 Daily sync cron job triggered at 2:00 AM UTC');
      
      try {
        const result = await syncService.syncAllPartners();
        
        if (result.success) {
          console.log(`✅ Daily sync completed successfully: ${result.successfulSyncs}/${result.totalPartners} partners synced`);
        } else {
          console.error(`❌ Daily sync completed with errors: ${result.errors.length} errors occurred`);
          console.error('Errors:', result.errors);
        }
      } catch (error) {
        console.error('❌ Daily sync cron job failed:', error);
      }
    }, {
      scheduled: true,
      timezone: "UTC"
    });

    // Weekly cleanup at 3:00 AM UTC on Sundays (optional - for maintenance)
    cron.schedule('0 0 3 * * 0', async () => {
      console.log('🧹 Weekly maintenance cron job triggered');
      
      try {
        // Clean up old activity logs (keep last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        // This would require supabaseAdmin import, but keeping it simple for now
        console.log('🧹 Weekly maintenance completed (placeholder)');
      } catch (error) {
        console.error('❌ Weekly maintenance failed:', error);
      }
    }, {
      scheduled: true,
      timezone: "UTC"
    });

    this.isInitialized = true;
    console.log('✅ Cron jobs initialized successfully');
    console.log('📅 Daily sync scheduled for 2:00 AM UTC');
    console.log('🧹 Weekly maintenance scheduled for 3:00 AM UTC on Sundays');
  }

  /**
   * Get status of all scheduled jobs
   */
  getStatus(): {
    initialized: boolean;
    jobs: Array<{
      name: string;
      schedule: string;
      nextRun: string;
      description: string;
    }>;
  } {
    return {
      initialized: this.isInitialized,
      jobs: [
        {
          name: 'Daily Sync',
          schedule: '0 0 2 * * *',
          nextRun: this.getNextRunTime('0 0 2 * * *'),
          description: 'Syncs all partners\' leads and deals from Zoho CRM'
        },
        {
          name: 'Weekly Maintenance',
          schedule: '0 0 3 * * 0',
          nextRun: this.getNextRunTime('0 0 3 * * 0'),
          description: 'Performs weekly maintenance tasks'
        }
      ]
    };
  }

  /**
   * Calculate next run time for a cron expression
   */
  private getNextRunTime(cronExpression: string): string {
    try {
      // Simple calculation - in production you'd use a proper cron parser
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setUTCHours(2, 0, 0, 0); // 2:00 AM UTC
      
      return tomorrow.toISOString();
    } catch (error) {
      return 'Unable to calculate';
    }
  }

  /**
   * Stop all cron jobs (for graceful shutdown)
   */
  destroy(): void {
    if (this.isInitialized) {
      cron.getTasks().forEach((task) => {
        task.destroy();
      });
      this.isInitialized = false;
      console.log('🛑 All cron jobs stopped');
    }
  }
}

export const cronService = new CronService();
