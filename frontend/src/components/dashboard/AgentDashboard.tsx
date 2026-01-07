'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info, FileText, DollarSign, TrendingUp } from 'lucide-react'
import { api } from '@/lib/api'

interface AgentStats {
  assigned_leads: number
  assigned_deals: number
  conversion_rate: number
}

export function AgentDashboard() {
  const [stats, setStats] = useState<AgentStats>({
    assigned_leads: 0,
    assigned_deals: 0,
    conversion_rate: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAgentStats()
  }, [])

  const fetchAgentStats = async () => {
    try {
      setLoading(true)
      
      // Fetch assigned leads
      const leadsResponse = await api.get('/api/leads/assigned')
      const leads = leadsResponse.data.data || []
      
      // Fetch assigned deals
      const dealsResponse = await api.get('/api/deals/assigned')
      const deals = dealsResponse.data.data || []
      
      // Calculate conversion rate
      const totalAssigned = leads.length + deals.length
      const conversionRate = totalAssigned > 0 
        ? ((deals.length / totalAssigned) * 100).toFixed(1)
        : '0.0'
      
      setStats({
        assigned_leads: leads.length,
        assigned_deals: deals.length,
        conversion_rate: parseFloat(conversionRate)
      })
    } catch (error) {
      console.error('Failed to fetch agent stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Agent Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          View your assigned leads and deals
        </p>
      </div>

      {/* Agent Restriction Notice */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          As an agent, you have read-only access to view leads and deals assigned to you. 
          To submit new leads or manage accounts, please contact your administrator.
        </AlertDescription>
      </Alert>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Assigned Leads
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.assigned_leads}
            </div>
            <p className="text-xs text-muted-foreground">
              Leads currently assigned to you
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Assigned Deals
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.assigned_deals}
            </div>
            <p className="text-xs text-muted-foreground">
              Deals currently assigned to you
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Conversion Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : `${stats.conversion_rate}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              Leads converted to deals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Access your assigned leads and deals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <a
            href="/leads"
            className="block p-4 rounded-lg border hover:bg-accent transition-colors"
          >
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium">View Assigned Leads</div>
                <div className="text-sm text-muted-foreground">
                  See all leads assigned to you
                </div>
              </div>
            </div>
          </a>

          <a
            href="/deals"
            className="block p-4 rounded-lg border hover:bg-accent transition-colors"
          >
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium">View Assigned Deals</div>
                <div className="text-sm text-muted-foreground">
                  See all deals assigned to you
                </div>
              </div>
            </div>
          </a>
        </CardContent>
      </Card>
    </div>
  )
}
