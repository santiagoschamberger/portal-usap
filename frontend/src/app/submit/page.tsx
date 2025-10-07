'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/protected-route'

export default function SubmitPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the new lead form since "Submit a Referral" is the same as "Submit Lead"
    router.push('/leads/new')
  }, [router])

  return (
    <ProtectedRoute allowedRoles={['admin', 'user']}>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9a132d] mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to lead submission form...</p>
        </div>
      </div>
    </ProtectedRoute>
  )
}

