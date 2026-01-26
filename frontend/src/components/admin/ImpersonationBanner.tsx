'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/lib/auth-store'
import { useRouter } from 'next/navigation'

export default function ImpersonationBanner() {
  const router = useRouter()
  const { isImpersonating, originalUser, user, stopImpersonation } = useAuthStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleStopImpersonation = () => {
    stopImpersonation()
    router.push('/admin/users')
  }

  // Don't render on server or if not impersonating
  if (!mounted || !isImpersonating || !originalUser || !user) {
    return null
  }

  return (
    <div className="bg-yellow-500 text-white px-4 py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div className="text-sm">
            <span className="font-semibold">Impersonation Mode:</span>
            {' '}You are viewing the portal as{' '}
            <span className="font-semibold">
              {user.first_name && user.last_name 
                ? `${user.first_name} ${user.last_name}` 
                : user.email}
            </span>
            {' '}(Original admin: {originalUser.email})
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleStopImpersonation}
          className="bg-white text-yellow-700 hover:bg-yellow-50 border-yellow-300 shrink-0"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Exit Impersonation
        </Button>
      </div>
    </div>
  )
}
