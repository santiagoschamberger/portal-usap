/**
 * Activity Tracker
 * Stores and retrieves recent user activities in localStorage
 */

export interface Activity {
  id: string
  type: 'lead_created' | 'lead_updated' | 'subaccount_synced' | 'subaccount_created' | 'login'
  description: string
  timestamp: Date
}

const ACTIVITY_STORAGE_KEY = 'usa_payments_activities'
const MAX_ACTIVITIES = 10

export const activityTracker = {
  /**
   * Add a new activity to the tracker
   */
  addActivity(type: Activity['type'], description: string): void {
    try {
      const activities = this.getActivities()
      const newActivity: Activity = {
        id: `${Date.now()}-${Math.random()}`,
        type,
        description,
        timestamp: new Date(),
      }
      
      // Add to beginning of array and limit to MAX_ACTIVITIES
      const updatedActivities = [newActivity, ...activities].slice(0, MAX_ACTIVITIES)
      
      localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(updatedActivities))
    } catch (error) {
      console.error('Failed to add activity:', error)
    }
  },

  /**
   * Get all activities
   */
  getActivities(): Activity[] {
    try {
      const stored = localStorage.getItem(ACTIVITY_STORAGE_KEY)
      if (!stored) return []
      
      const activities = JSON.parse(stored)
      // Convert timestamp strings back to Date objects
      return activities.map((a: any) => ({
        ...a,
        timestamp: new Date(a.timestamp)
      }))
    } catch (error) {
      console.error('Failed to get activities:', error)
      return []
    }
  },

  /**
   * Get recent activities (last N)
   */
  getRecentActivities(count: number = 3): Activity[] {
    return this.getActivities().slice(0, count)
  },

  /**
   * Clear all activities
   */
  clearActivities(): void {
    try {
      localStorage.removeItem(ACTIVITY_STORAGE_KEY)
    } catch (error) {
      console.error('Failed to clear activities:', error)
    }
  },

  /**
   * Get formatted time ago string
   */
  getTimeAgo(date: Date): string {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return date.toLocaleDateString()
  },

  /**
   * Get icon color for activity type
   */
  getActivityColor(type: Activity['type']): string {
    switch (type) {
      case 'lead_created':
        return 'bg-green-100 text-green-700'
      case 'lead_updated':
        return 'bg-blue-100 text-blue-700'
      case 'subaccount_synced':
        return 'bg-purple-100 text-purple-700'
      case 'subaccount_created':
        return 'bg-yellow-100 text-yellow-700'
      case 'login':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }
}

