'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ProtectedRoute } from '@/components/protected-route'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { dealsService } from '@/services/dealsService'
import { DealStageBadge } from '@/components/deals/DealStageBadge'
import { toast } from 'react-hot-toast'
import { Pagination } from '@/components/ui/Pagination'
import { useDebounce } from '@/hooks/useDebounce'
import { normalizeDealStage } from '@/lib/statusStageMapping'

interface DealsFilters {
  search: string
  stage: string
  dateRange: string
}

export default function DealsPage() {
  const router = useRouter()
  const [deals, setDeals] = useState<any[]>([])
  const [filteredDeals, setFilteredDeals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [filters, setFilters] = useState<DealsFilters>({
    search: '',
    stage: '',
    dateRange: ''
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [isSubAccount, setIsSubAccount] = useState(false)

  // Debounce search term
  const debouncedSearch = useDebounce(filters.search, 300)

  useEffect(() => {
    fetchDeals()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [filters.stage, filters.dateRange, debouncedSearch, deals])

  const fetchDeals = async () => {
    try {
      setLoading(true)
      const response = await dealsService.getAll()
      
      // Use only local deals (synced from Zoho via webhooks and sync)
      // No need to fetch from Zoho API as deals are already synced to database
      const allDeals = response.local_deals.map(deal => ({
        ...deal,
        deal_name: deal.deal_name || 'Unnamed Deal',
        stage: normalizeDealStage(deal.stage),
        company: deal.company || deal.deal_name
      }))
      
      setDeals(allDeals)
      setFilteredDeals(allDeals)
      setIsSubAccount(response.is_sub_account || false)
    } catch (error) {
      console.error('Error fetching deals:', error)
      toast.error('Failed to load deals')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...deals]

    // Search filter
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase()
      filtered = filtered.filter(deal =>
        deal.deal_name?.toLowerCase().includes(searchLower) ||
        deal.first_name?.toLowerCase().includes(searchLower) ||
        deal.last_name?.toLowerCase().includes(searchLower) ||
        deal.email?.toLowerCase().includes(searchLower) ||
        deal.company?.toLowerCase().includes(searchLower)
      )
    }

    // Stage filter
    if (filters.stage) {
      filtered = filtered.filter(deal => deal.stage === filters.stage)
    }

    // Date range filter
    if (filters.dateRange) {
      const now = new Date()
      filtered = filtered.filter(deal => {
        const createdDate = new Date(deal.created_at)
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

    setFilteredDeals(filtered)
    setCurrentPage(1)
  }

  const handleViewDeal = (dealId: string) => {
    router.push(`/deals/${dealId}`)
  }

  const handleFilterChange = (key: keyof DealsFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleSyncDeals = async () => {
    try {
      setSyncing(true)
      toast.loading('Syncing deals from Zoho CRM...', { id: 'sync-deals' })
      
      const result = await dealsService.syncFromZoho()
      
      toast.success(
        `Sync complete! ${result.created} created, ${result.updated} updated, ${result.skipped} skipped`,
        { id: 'sync-deals', duration: 5000 }
      )
      
      // Refresh the deals list
      await fetchDeals()
    } catch (error) {
      console.error('Error syncing deals:', error)
      toast.error('Failed to sync deals from Zoho CRM', { id: 'sync-deals' })
    } finally {
      setSyncing(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }
  
  // Calculate pagination
  const totalItems = filteredDeals.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const paginatedDeals = filteredDeals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <ProtectedRoute allowedRoles={['admin', 'user']}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Deals Management</h1>
              <p className="text-muted-foreground mt-2">
                Track converted deals and opportunities
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={handleSyncDeals} 
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
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
              <CardDescription>
                Filter deals by various criteria
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
                  <Label htmlFor="stage">Stage</Label>
                  <select
                    id="stage"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={filters.stage}
                    onChange={(e) => handleFilterChange('stage', e.target.value)}
                  >
                    <option value="">All Stages</option>
                    <option value="In Underwriting">In Underwriting</option>
                    <option value="Conditionally Approved">Conditionally Approved</option>
                    <option value="Approved">Approved</option>
                    <option value="Lost">Lost</option>
                    <option value="Declined">Declined</option>
                    <option value="Closed">Closed</option>
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

          {/* Deals Table */}
          <Card>
            <CardHeader>
              <CardTitle>Deals</CardTitle>
              <CardDescription>
                View and manage your deals
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading deals...</p>
                </div>
              ) : filteredDeals.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Deal Name</th>
                        <th className="text-left py-3 px-4 font-medium">Company</th>
                        <th className="text-left py-3 px-4 font-medium">Amount</th>
                        <th className="text-left py-3 px-4 font-medium">Stage</th>
                        {!isSubAccount && (
                          <th className="text-left py-3 px-4 font-medium">Submitted By</th>
                        )}
                        <th className="text-left py-3 px-4 font-medium">Approval Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedDeals.map((deal) => (
                        <tr 
                          key={deal.id} 
                          className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => handleViewDeal(deal.id)}
                        >
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium">
                                {deal.deal_name}
                              </div>
                              <div className="text-sm text-gray-600">
                                {deal.first_name} {deal.last_name}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {deal.company || 'N/A'}
                          </td>
                          <td className="py-3 px-4 font-semibold">
                            {formatCurrency(deal.amount || 0)}
                          </td>
                          <td className="py-3 px-4">
                            <DealStageBadge stage={deal.stage} size="sm" />
                          </td>
                          {!isSubAccount && (
                            <td className="py-3 px-4">
                              {deal.creator ? (
                                <div className="text-sm">
                                  <div className="font-medium">
                                    {deal.creator.first_name} {deal.creator.last_name}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {deal.creator.role === 'admin' ? 'Main Account' : 'Sub-Account'}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-sm text-gray-400">N/A</span>
                              )}
                            </td>
                          )}
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {deal.approval_date ? new Date(deal.approval_date).toLocaleDateString() : 
                             deal.close_date ? new Date(deal.close_date).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No deals found</p>
                  <Button onClick={handleSyncDeals}>
                    Sync Deals from Zoho
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {filteredDeals.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={totalItems}
              onItemsPerPageChange={(size) => {
                setItemsPerPage(size)
                setCurrentPage(1)
              }}
            />
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

