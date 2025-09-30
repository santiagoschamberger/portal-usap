'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ProtectedRoute } from '@/components/protected-route'
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
  const [filters, setFilters] = useState<LeadsFilters>({
    search: '',
    status: '',
    dateRange: ''
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

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
      
      // Combine local leads and Zoho leads
      const allLeads = [
        ...response.local_leads,
        ...response.zoho_leads.map(zl => ({
          id: zl.id,
          first_name: zl.Full_Name?.split(' ')[0] || '',
          last_name: zl.Full_Name?.split(' ').slice(1).join(' ') || '',
          email: zl.Email,
          phone: zl.Phone,
          company: zl.Company,
          status: zl.Lead_Status?.toLowerCase() || 'new',
          created_at: zl.Created_Time,
          source: zl.Lead_Source
        }))
      ]
      
      setLeads(allLeads)
      setFilteredLeads(allLeads)
      setTotalPages(Math.ceil(allLeads.length / 10))
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new':
        return 'bg-blue-100 text-blue-800'
      case 'contacted':
        return 'bg-yellow-100 text-yellow-800'
      case 'qualified':
        return 'bg-purple-100 text-purple-800'
      case 'converted':
        return 'bg-green-100 text-green-800'
      case 'lost':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <ProtectedRoute allowedRoles={['admin', 'user']}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  onClick={() => router.push('/dashboard')}
                  className="mr-4"
                >
                  ← Back to Dashboard
                </Button>
                <h1 className="text-xl font-semibold text-gray-900">
                  Leads Management
                </h1>
              </div>
              <Button onClick={handleCreateLead}>
                Create New Lead
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters */}
          <Card className="mb-6">
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
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="converted">Converted</option>
                    <option value="lost">Lost</option>
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
                        <th className="text-left py-3 px-4 font-medium">Created</th>
                        <th className="text-left py-3 px-4 font-medium">Actions</th>
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
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(lead.status)}`}>
                              {lead.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-3 px-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewLead(lead.id)}
                            >
                              View
                            </Button>
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
        </main>
      </div>
    </ProtectedRoute>
  )
} 