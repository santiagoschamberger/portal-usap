'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ProtectedRoute } from '@/components/protected-route'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { LeadStatusBadge } from '@/components/leads/LeadStatusBadge'
import { Lead } from '@/types'
import { zohoService } from '@/services/zohoService'
import { toast } from 'react-hot-toast'

interface LeadsFilters {
  search: string
  status: string
  dateRange: string
}

export default function LeadsPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<any[]>([])
  const [filteredLeads, setFilteredLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [filters, setFilters] = useState<LeadsFilters>({
    search: '',
    status: '',
    dateRange: ''
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isSubAccount, setIsSubAccount] = useState(false)

  useEffect(() => {
    fetchLeads()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [filters, leads])

  const fetchLeads = async () => {
    try {
      setLoading(true)
      const response = await zohoService.leads.getAll()
      
      // Combine local leads (which already have Portal status) and Zoho leads
      const allLeads = [
        ...response.local_leads, // These already have mapped status from backend
        ...response.zoho_leads.map(zl => ({
          id: zl.id,
          first_name: zl.Full_Name?.split(' ')[0] || '',
          last_name: zl.Full_Name?.split(' ').slice(1).join(' ') || '',
          email: zl.Email,
          phone: zl.Phone,
          company: zl.Company,
          status: zl.Lead_Status, // Keep as-is from Zoho for display
          zoho_status: zl.Lead_Status, // Original Zoho status
          created_at: zl.Created_Time,
          source: zl.Lead_Source
        }))
      ]
      
      setLeads(allLeads)
      setFilteredLeads(allLeads)
      setTotalPages(Math.ceil(allLeads.length / 10))
      setIsSubAccount(response.is_sub_account || false)
    } catch (error) {
      console.error('Error fetching leads:', error)
      toast.error('Failed to load leads')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...leads]

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(lead =>
        lead.first_name?.toLowerCase().includes(searchLower) ||
        lead.last_name?.toLowerCase().includes(searchLower) ||
        lead.email?.toLowerCase().includes(searchLower) ||
        lead.company?.toLowerCase().includes(searchLower)
      )
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(lead => lead.status === filters.status)
    }

    // Date range filter
    if (filters.dateRange) {
      const now = new Date()
      filtered = filtered.filter(lead => {
        const createdDate = new Date(lead.created_at)
        switch (filters.dateRange) {
          case 'today':
            return createdDate.toDateString() === now.toDateString()
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            return createdDate >= weekAgo
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            return createdDate >= monthAgo
          case 'quarter':
            const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
            return createdDate >= quarterAgo
          default:
            return true
        }
      })
    }

    setFilteredLeads(filtered)
    setTotalPages(Math.ceil(filtered.length / 10))
    setCurrentPage(1)
  }

  const handleCreateLead = () => {
    router.push('/leads/new')
  }

  const handleViewLead = (leadId: string) => {
    router.push(`/leads/${leadId}`)
  }

  const handleFilterChange = (key: keyof LeadsFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1) // Reset to first page when filters change
  }

  const handleSyncLeads = async () => {
    try {
      setSyncing(true)
      toast.loading('Syncing leads from Zoho CRM...', { id: 'sync-leads' })
      
      const result = await zohoService.leads.syncFromZoho()
      
      toast.success(
        `Sync complete! ${result.created} created, ${result.updated} updated, ${result.skipped} skipped`,
        { id: 'sync-leads', duration: 5000 }
      )
      
      // Refresh the leads list
      await fetchLeads()
    } catch (error) {
      console.error('Error syncing leads:', error)
      toast.error('Failed to sync leads from Zoho CRM', { id: 'sync-leads' })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={['admin', 'user']}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Leads Management</h1>
              <p className="text-muted-foreground mt-2">
                Manage and track your leads
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={handleSyncLeads} 
                variant="outline"
                disabled={syncing}
                className="border-[#9a132d] text-[#9a132d] hover:bg-[#9a132d] hover:text-white"
              >
                {syncing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Syncing...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Sync from Zoho
                  </>
                )}
              </Button>
              <Button onClick={handleCreateLead} className="bg-[#9a132d] hover:bg-[#7d0f24]">
                Create New Lead
              </Button>
            </div>
          </div>
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
              <CardDescription>
                Filter leads by various criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="search">Search</Label>
                  <Input
                    id="search"
                    placeholder="Search by name, email, or company..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    <option value="Pre-Vet / New Lead">Pre-Vet / New Lead</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Sent for Signature / Submitted">Sent for Signature / Submitted</option>
                    <option value="Approved">Approved</option>
                    <option value="Declined">Declined</option>
                    <option value="Dead / Withdrawn">Dead / Withdrawn</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="dateRange">Date Range</Label>
                  <select
                    id="dateRange"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={filters.dateRange}
                    onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  >
                    <option value="">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="quarter">This Quarter</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Leads Table */}
          <Card>
            <CardHeader>
              <CardTitle>Leads</CardTitle>
              <CardDescription>
                Manage and track your leads
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading leads...</p>
                </div>
              ) : filteredLeads.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Name</th>
                        <th className="text-left py-3 px-4 font-medium">Company</th>
                        <th className="text-left py-3 px-4 font-medium">Contact</th>
                        <th className="text-left py-3 px-4 font-medium">Status</th>
                        {!isSubAccount && (
                          <th className="text-left py-3 px-4 font-medium">Submitted By</th>
                        )}
                        <th className="text-left py-3 px-4 font-medium">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeads
                        .slice((currentPage - 1) * 10, currentPage * 10)
                        .map((lead) => (
                        <tr key={lead.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium">
                                {lead.first_name} {lead.last_name}
                              </div>
                              <div className="text-sm text-gray-600">
                                {lead.source || 'Portal'}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {lead.company || 'N/A'}
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <div className="text-sm">{lead.email}</div>
                              <div className="text-sm text-gray-600">{lead.phone || 'N/A'}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <LeadStatusBadge status={lead.status} size="sm" />
                          </td>
                          {!isSubAccount && (
                            <td className="py-3 px-4">
                              {lead.creator ? (
                                <div className="text-sm">
                                  <div className="font-medium">
                                    {lead.creator.first_name} {lead.creator.last_name}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {lead.creator.role === 'admin' ? 'Main Account' : 'Sub-Account'}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-sm text-gray-400">N/A</span>
                              )}
                            </td>
                          )}
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No leads found</p>
                  <Button onClick={handleCreateLead}>
                    Create Your First Lead
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {filteredLeads.length > 0 && (
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-600">
                Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, filteredLeads.length)} of {filteredLeads.length} results
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
} 