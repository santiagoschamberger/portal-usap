'use client'

import { useEffect, useState } from 'react'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/lib/auth-store'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

export default function ImpersonationBanner() {
  const router = useRouter()
  const { isImpersonating, user, stopImpersonation } = useAuthStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleStopImpersonation = () => {
    stopImpersonation()
    router.push('/admin/users')
  }

  // Don't render on server or if not impersonating
  if (!mounted || !isImpersonating || !user) {
    return null
  }

  return (
    <div className="fixed bottom-6 left-6 z-50 print:hidden">
      <div className="flex items-center gap-3 pl-4 pr-1.5 py-2 bg-zinc-900/95 backdrop-blur-sm text-zinc-100 rounded-full shadow-xl border border-zinc-800/50 ring-1 ring-black/5">
        <div className="flex items-center gap-3">
          <div className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </div>
          <div className="flex flex-col text-xs">
            <span className="font-medium text-zinc-400 leading-none mb-0.5">Viewing as</span>
            <span className="font-semibold text-zinc-100 leading-none max-w-[200px] truncate">
              {((user as any).first_name || user.firstName) && ((user as any).last_name || user.lastName)
                ? `${(user as any).first_name || user.firstName} ${(user as any).last_name || user.lastName}` 
                : user.email}
            </span>
          </div>
        </div>
        
        <div className="h-6 w-px bg-zinc-800 mx-1" />

        <Button
          size="sm"
          variant="ghost"
          onClick={handleStopImpersonation}
          className="h-7 px-3 text-xs font-medium text-amber-500 hover:text-amber-400 hover:bg-zinc-800 rounded-full transition-colors"
        >
          <LogOut className="h-3.5 w-3.5 mr-1.5" />
          Exit
        </Button>
      </div>
    </div>
  )
}
