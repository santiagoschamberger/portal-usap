'use client'

import { DealStageHistory } from '@/services/dealsService'
import { DealStageBadge } from './DealStageBadge'

interface DealStageTimelineProps {
  history: DealStageHistory[]
}

export function DealStageTimeline({ history }: DealStageTimelineProps) {
  if (!history || history.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No stage history available
      </div>
    )
  }

  // Sort history by date (newest first)
  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Stage History</h3>
      
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
        
        {/* Timeline items */}
        <div className="space-y-6">
          {sortedHistory.map((item, index) => (
            <div key={item.id} className="relative flex gap-4">
              {/* Timeline dot */}
              <div className="relative z-10">
                <div className={`
                  w-8 h-8 rounded-full border-4 border-white flex items-center justify-center
                  ${index === 0 ? 'bg-blue-500' : 'bg-gray-400'}
                `}>
                  {index === 0 && (
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 pb-6">
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {item.old_stage && (
                        <>
                          <DealStageBadge stage={item.old_stage} size="sm" />
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </>
                      )}
                      <DealStageBadge stage={item.new_stage} size="sm" />
                    </div>
                    {index === 0 && (
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        Current
                      </span>
                    )}
                  </div>

                  <div className="text-sm text-gray-600 mt-2">
                    {formatDate(item.created_at)}
                  </div>

                  {item.notes && (
                    <div className="mt-3 text-sm text-gray-700 bg-gray-50 p-3 rounded border border-gray-100">
                      <p className="font-medium text-gray-900 mb-1">Note:</p>
                      {item.notes}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


