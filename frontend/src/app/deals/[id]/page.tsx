'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProtectedRoute } from '@/components/protected-route'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { dealsService, Deal } from '@/services/dealsService'
import { DealStageBadge } from '@/components/deals/DealStageBadge'
import { DealStageTimeline } from '@/components/deals/DealStageTimeline'
import { RelatedLeadInfo } from '@/components/deals/RelatedLeadInfo'
import { toast } from 'react-hot-toast'
import Link from 'next/link'
import { normalizeDealStage } from '@/lib/statusStageMapping'

export default function DealDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [deal, setDeal] = useState<Deal | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchDeal(params.id as string)
    }
  }, [params.id])

  const fetchDeal = async (id: string) => {
    try {
      setLoading(true)
      const data = await dealsService.getById(id)

      setDeal({
        ...data,
        stage: normalizeDealStage(data.stage || data.metadata?.zoho_stage)
      })
    } catch (error) {
      console.error('Error fetching deal:', error)
      toast.error('Failed to load deal details')
      router.push('/deals')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['admin', 'user']}>
        <DashboardLayout>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (!deal) {
    return null
  }

  return (
    <ProtectedRoute allowedRoles={['admin', 'user']}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-4">
                <Link href="/deals" className="text-gray-500 hover:text-gray-700">
                  ← Back to Deals
                </Link>
                <h1 className="text-3xl font-bold">{deal.deal_name}</h1>
              </div>
              <p className="text-muted-foreground mt-2 ml-4">
                {deal.company}
              </p>
            </div>
            <div>
               <DealStageBadge stage={deal.stage} size="lg" showIcon />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main Info */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Deal Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Contact Name</label>
                    <p className="text-lg">{deal.first_name} {deal.last_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Company</label>
                    <p className="text-lg">{deal.company || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Amount</label>
                    <p className="text-lg font-semibold">{formatCurrency(deal.amount)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Approval Date</label>
                    <p className="text-lg">{formatDate(deal.approval_date)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-lg">{deal.email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p className="text-lg">{deal.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Created At</label>
                    <p className="text-lg">{formatDate(deal.created_at)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Last Sync</label>
                    <p className="text-sm text-gray-600">
                      {deal.last_sync_at ? new Date(deal.last_sync_at).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-2">Original Zoho Data</h3>
                   <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Zoho Stage:</span> {deal.metadata?.zoho_stage || deal.stage}
                      </div>
                      <div>
                         <span className="text-gray-500">Zoho Deal ID:</span> {deal.zoho_deal_id || 'N/A'}
                      </div>
                   </div>
                </div>
              </CardContent>
            </Card>

            {/* Sidebar / Actions */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Submitted By</CardTitle>
                </CardHeader>
                <CardContent>
                   {deal.creator ? (
                      <div>
                        <p className="font-medium">{deal.creator.first_name} {deal.creator.last_name}</p>
                        <p className="text-sm text-gray-500 capitalize">
                          {deal.creator.role === 'admin' ? 'Main Account' : 'Sub-Account'}
                        </p>
                      </div>
                   ) : (
                      <p className="text-gray-500">Submitted on ZOHO</p>
                   )}
                </CardContent>
              </Card>

              {/* Related Lead Information */}
              {deal.related_lead && (
                <RelatedLeadInfo lead={deal.related_lead} />
              )}
            </div>
          </div>

          {/* Stage History Timeline */}
          {deal.deal_stage_history && deal.deal_stage_history.length > 0 && (
            <Card className="mt-6">
              <CardContent className="pt-6">
                <DealStageTimeline history={deal.deal_stage_history} />
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

