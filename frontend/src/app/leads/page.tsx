'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProtectedRoute } from '@/components/protected-route'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { LeadStatusBadge } from '@/components/leads/LeadStatusBadge'
import { LeadFilters } from '@/components/leads/LeadFilters'
import { Pagination } from '@/components/ui/Pagination'
import { zohoService } from '@/services/zohoService'
import { toast } from 'react-hot-toast'
import { useDebounce } from '@/hooks/useDebounce'
import { Lead } from '@/services/leadService' // Import from service to match snake_case backend

export default function LeadsPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  
  // Filter State
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    dateRange: ''
  })
  
  // Pagination State
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  })

  // Debounce search to prevent too many API calls
  const debouncedSearch = useDebounce(filters.search, 500)

  // Fetch leads when filters or pagination changes
  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true)
      const response = await zohoService.leads.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch,
        status: filters.status,
        date_range: filters.dateRange
      })
      
      setLeads(response.data)
      setPagination(prev => ({
        ...prev,
        total: response.pagination.total,
        totalPages: response.pagination.pages
      }))
    } catch (error) {
      console.error('Error fetching leads:', error)
      toast.error('Failed to load leads')
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, debouncedSearch, filters.status, filters.dateRange])

  // Initial fetch and refetch on dependencies
  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  const handleCreateLead = () => {
    router.push('/leads/new')
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    // Reset to page 1 when filters change
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">Leads Management</h1>
              <p className="text-muted-foreground mt-2">
                Manage and track your leads
              </p>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <Button 
                onClick={handleSyncLeads} 
                variant="outline"
                disabled={syncing}
                className="border-[#9a132d] text-[#9a132d] hover:bg-[#9a132d] hover:text-white flex-1 sm:flex-none"
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
              <Button onClick={handleCreateLead} className="bg-[#9a132d] hover:bg-[#7d0f24] flex-1 sm:flex-none">
                Create New Lead
              </Button>
            </div>
          </div>

          {/* Filters */}
          <LeadFilters 
            filters={filters} 
            onFilterChange={handleFilterChange} 
          />

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
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9a132d] mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading leads...</p>
                </div>
              ) : leads.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium text-gray-500">Name</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-500">Company</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-500">Contact</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-500">Submitted By</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-500">Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leads.map((lead) => (
                          <tr key={lead.id} className="border-b hover:bg-gray-50 transition-colors">
                            <td className="py-3 px-4">
                              <div>
                                <div className="font-medium text-gray-900">
                                  {lead.first_name} {lead.last_name}
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {lead.lead_source || 'Portal'}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-700">
                              {lead.company || 'N/A'}
                            </td>
                            <td className="py-3 px-4">
                              <div>
                                <div className="text-sm text-gray-900">{lead.email}</div>
                                <div className="text-xs text-gray-500 mt-0.5">{lead.phone || 'N/A'}</div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <LeadStatusBadge status={lead.status} size="sm" />
                            </td>
                            <td className="py-3 px-4">
                              {lead.creator ? (
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {lead.creator.first_name} {lead.creator.last_name}
                                  </div>
                                  <div className="text-xs text-gray-500 capitalize">
                                    {lead.creator.role.replace('_', ' ')}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-sm text-gray-400">System</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <Pagination 
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                    totalItems={pagination.total}
                    itemsPerPage={pagination.limit}
                  />
                </>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <div className="mx-auto h-12 w-12 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No leads found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {filters.search || filters.status || filters.dateRange 
                      ? 'Try adjusting your filters' 
                      : 'Get started by creating a new lead'}
                  </p>
                  <div className="mt-6">
                    <Button onClick={handleCreateLead} className="bg-[#9a132d] hover:bg-[#7d0f24]">
                      Create New Lead
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
