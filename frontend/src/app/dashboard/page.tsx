'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/lib/auth-store'
import { ProtectedRoute } from '@/components/protected-route'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Lead } from '@/types'
import { zohoService } from '@/services/zohoService'
import { toast } from 'react-hot-toast'
import { activityTracker, Activity } from '@/lib/activity-tracker'

interface DashboardStats {
  totalLeads: number
  activeLeads: number
  conversionRate: number
  monthlyLeads: number
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, signOut } = useAuthStore()
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    activeLeads: 0,
    conversionRate: 0,
    monthlyLeads: 0
  })
  const [recentLeads, setRecentLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [recentActivities, setRecentActivities] = useState<Activity[]>([])

  useEffect(() => {
    fetchDashboardData()
    loadRecentActivities()
  }, [])

  const loadRecentActivities = () => {
    const activities = activityTracker.getRecentActivities(3)
    setRecentActivities(activities)
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch lead statistics from Zoho
      const leadStats = await zohoService.leads.getStats()
      const recentLeadsData = await zohoService.leads.getRecent()

      // Calculate conversion rate
      const conversionRate = leadStats.total > 0 
        ? Math.round((leadStats.converted / leadStats.total) * 100) 
        : 0

      // Calculate active leads (new + contacted + qualified)
      const activeLeads = leadStats.new + leadStats.contacted + leadStats.qualified

      // Calculate monthly leads (approximation based on recent data)
      const monthlyLeads = leadStats.new

      setStats({
        totalLeads: leadStats.total,
        activeLeads,
        conversionRate,
        monthlyLeads
      })

      setRecentLeads(recentLeadsData)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/auth/login')
  }

  const handleCreateLead = () => {
    router.push('/leads/new')
  }

  const handleViewLeads = () => {
    router.push('/leads')
  }

  return (
    <ProtectedRoute allowedRoles={['admin', 'user']}>
      <DashboardLayout>
        <div>
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Welcome back, {user?.email}! Here's an overview of your leads.
            </p>
          </div>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Leads
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalLeads}</div>
                <p className="text-xs text-muted-foreground">
                  All time
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Leads
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeLeads}</div>
                <p className="text-xs text-muted-foreground">
                  Currently active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Conversion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.conversionRate}%</div>
                <p className="text-xs text-muted-foreground">
                  This month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Monthly Leads
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.monthlyLeads}</div>
                <p className="text-xs text-muted-foreground">
                  This month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common tasks and shortcuts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={handleCreateLead}
                  className="w-full bg-[#9a132d] hover:bg-[#7d0f24]"
                >
                  Create New Lead
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleViewLeads}
                  className="w-full"
                >
                  View All Leads
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Your latest actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentActivities.length > 0 ? (
                  <div className="space-y-3">
                    {recentActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${activityTracker.getActivityColor(activity.type)}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {activity.description}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {activityTracker.getTimeAgo(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    No recent activity
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}