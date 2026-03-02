'use client'

import React, { useState } from 'react'
import { Search, UserCircle, LogIn, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { partnerService } from '@/services/partnerService'
import { useAuthStore } from '@/lib/auth-store'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface User {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: string
  partner_id: string
  is_active: boolean
  partners: {
    id: string
    name: string
    partner_type: string
  } | null
}

export default function UserImpersonation() {
  const router = useRouter()
  const { user: currentUser, startImpersonation } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [totalUsers, setTotalUsers] = useState<number | null>(null)
  const [offset, setOffset] = useState(0)
  const pageSize = 50
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [impersonating, setImpersonating] = useState<string | null>(null)

  const handleSearch = React.useCallback(async (options?: { reset?: boolean }) => {
    setLoading(true)
    setError(null)

    try {
      const shouldReset = Boolean(options?.reset)
      const query = searchQuery.trim() ? searchQuery.trim() : undefined
      const nextOffset = shouldReset ? 0 : offset

      const response = await partnerService.searchUsers(query, pageSize, nextOffset)
      // Ensure response.data is an array
      if (response && response.data && Array.isArray(response.data)) {
        setUsers((prev) => (shouldReset ? response.data : [...prev, ...response.data]))
        setOffset(nextOffset + response.data.length)
        setTotalUsers(response.meta?.total ?? null)
      } else {
        console.error('Invalid response format:', response)
        setUsers([])
        setOffset(0)
        setTotalUsers(null)
        setError('Received invalid data format from server')
      }
    } catch (err: any) {
      console.error('Error searching users:', err)
      setError(err.response?.data?.message || err.message || 'Failed to search users')
      setUsers([])
      setOffset(0)
      setTotalUsers(null)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, offset])

  // Load all users on mount
  React.useEffect(() => {
    void handleSearch({ reset: true })
  }, [])

  const handleImpersonate = async (targetUser: User) => {
    if (!currentUser) return

    setImpersonating(targetUser.id)
    setError(null)

    try {
      const response = await partnerService.impersonateUser(targetUser.id)
      
      // Update auth store with impersonation data
      startImpersonation(response.data.user, currentUser)
      
      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to impersonate user')
    } finally {
      setImpersonating(null)
    }
  }

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'admin':
        return 'border-purple-200 text-purple-700 hover:bg-purple-50'
      case 'sub_account':
      case 'sub':
        return 'border-blue-200 text-blue-700 hover:bg-blue-50'
      default:
        return 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch({ reset: true })}
            className="pl-9 h-9 text-sm bg-white"
          />
        </div>
        <Button 
          variant="secondary"
          size="sm"
          onClick={() => handleSearch({ reset: true })}
          disabled={loading}
          className="h-9 px-4"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Search'}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      <div className="rounded-md border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50/50 hover:bg-zinc-50/50">
              <TableHead className="h-9 text-xs font-medium text-zinc-500 w-[30%]">User</TableHead>
              <TableHead className="h-9 text-xs font-medium text-zinc-500 w-[20%]">Role</TableHead>
              <TableHead className="h-9 text-xs font-medium text-zinc-500 w-[25%]">Partner</TableHead>
              <TableHead className="h-9 text-xs font-medium text-zinc-500 w-[10%]">Status</TableHead>
              <TableHead className="h-9 text-xs font-medium text-zinc-500 w-[15%] text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-xs text-zinc-500">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 opacity-50" />
                  Loading users...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-xs text-zinc-500">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} className="hover:bg-zinc-50/50 h-10">
                  <TableCell className="py-2">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-zinc-900 truncate">
                        {user.first_name && user.last_name
                          ? `${user.first_name} ${user.last_name}`
                          : user.email.split('@')[0]}
                      </span>
                      <span className="text-xs text-zinc-500 truncate">{user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-2">
                    <Badge 
                      variant="outline" 
                      className={cn("text-[10px] px-1.5 py-0 h-5 font-normal", getRoleBadgeStyle(user.role))}
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2">
                    {user.partners ? (
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-zinc-700 truncate">
                          {user.partners.name}
                        </span>
                        <span className="text-[10px] text-zinc-400 capitalize">
                          {user.partners.partner_type}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="flex items-center gap-1.5">
                      <div className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        user.is_active ? "bg-emerald-500" : "bg-red-500"
                      )} />
                      <span className={cn(
                        "text-xs",
                        user.is_active ? "text-zinc-600" : "text-zinc-400"
                      )}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-2 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleImpersonate(user)}
                      disabled={
                        !user.is_active || 
                        impersonating !== null ||
                        user.id === currentUser?.id
                      }
                      className="h-7 px-2 text-xs hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900"
                    >
                      {impersonating === user.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <>
                          <LogIn className="h-3.5 w-3.5 mr-1.5" />
                          Impersonate
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {(totalUsers === null ? users.length % pageSize === 0 : users.length < totalUsers) && users.length > 0 && (
        <div className="flex justify-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSearch({ reset: false })}
            disabled={loading}
            className="text-xs text-zinc-500"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
            Load more users
          </Button>
        </div>
      )}

      <div className="flex items-center gap-2 px-1 text-xs text-zinc-400">
        <AlertCircle className="h-3.5 w-3.5" />
        <span>Impersonation actions are logged for security. You cannot impersonate yourself.</span>
      </div>
    </div>
  )
}
