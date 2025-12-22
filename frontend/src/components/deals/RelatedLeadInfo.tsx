'use client'

import { RelatedLead } from '@/services/dealsService'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

interface RelatedLeadInfoProps {
  lead: RelatedLead
}

export function RelatedLeadInfo({ lead }: RelatedLeadInfoProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase()
    if (statusLower.includes('approved') || statusLower.includes('won')) {
      return 'text-green-600 bg-green-50'
    }
    if (statusLower.includes('declined') || statusLower.includes('lost')) {
      return 'text-red-600 bg-red-50'
    }
    if (statusLower.includes('contacted') || statusLower.includes('submitted')) {
      return 'text-blue-600 bg-blue-50'
    }
    return 'text-gray-600 bg-gray-50'
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Original Lead</CardTitle>
          <Link 
            href={`/leads/${lead.id}`}
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            View Lead Details →
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-lg">
          <div className="flex-shrink-0 mt-1">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900">
              This deal was converted from a lead submitted through the portal
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Lead created on {formatDate(lead.created_at)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Contact Name
            </label>
            <p className="text-sm font-medium mt-1">
              {lead.first_name} {lead.last_name}
            </p>
          </div>

          {lead.company && (
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Company
              </label>
              <p className="text-sm font-medium mt-1">{lead.company}</p>
            </div>
          )}

          {lead.email && (
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Email
              </label>
              <p className="text-sm mt-1">
                <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">
                  {lead.email}
                </a>
              </p>
            </div>
          )}

          {lead.phone && (
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Phone
              </label>
              <p className="text-sm mt-1">
                <a href={`tel:${lead.phone}`} className="text-blue-600 hover:underline">
                  {lead.phone}
                </a>
              </p>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Lead Status
            </label>
            <p className="mt-1">
              <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${getStatusColor(lead.status)}`}>
                {lead.status}
              </span>
            </p>
          </div>

          {lead.zoho_lead_id && (
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Zoho Lead ID
              </label>
              <p className="text-xs font-mono mt-1 text-gray-600">
                {lead.zoho_lead_id}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}


