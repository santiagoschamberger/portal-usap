'use client'

import React, { useState } from 'react'
import { Search, UserCircle, LogIn, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { partnerService } from '@/services/partnerService'
import { useAuthStore } from '@/lib/auth-store'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

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
  const [impersonatingUserId, setImpersonatingUserId] = useState<string | null>(null)

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
    if (impersonatingUserId) return

    setImpersonatingUserId(targetUser.id)
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
      setImpersonatingUserId(null)
    }
  }

  const getPartnerTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'partner':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'agent':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'iso':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getAccountTypeLabel = (u: User) => {
    if (u.role === 'sub_account' || u.role === 'sub') return 'sub_account'
    if (u.partners?.partner_type) return u.partners.partner_type
    return u.role || 'user'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <UserCircle className="h-4 w-4" />
          Impersonate user
        </CardTitle>
        <CardDescription className="text-xs">
          Search by email. Actions are logged for security.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by email (leave blank to show all)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch({ reset: true })}
              className="pl-10"
            />
          </div>
          <Button 
            onClick={() => handleSearch({ reset: true })}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Search'}
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Search Results */}
        {users && users.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-gray-700">
              Search Results ({users.length}{totalUsers !== null ? ` of ${totalUsers}` : ''})
            </h3>
            <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="px-3 py-2 hover:bg-gray-50 transition-colors"
                >
                  {(() => {
                    const isRowLoading = impersonatingUserId === user.id
                    const accountType = getAccountTypeLabel(user)
                    const showMainPartner = accountType !== 'partner' && Boolean(user.partners?.name)
                    const mainPartnerName = user.partners?.name ?? ''

                    return (
                <div
                  className="flex items-start justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.email}
                      </p>
                    <Badge
                      variant="outline"
                      className={cn(getPartnerTypeBadgeColor(accountType), "text-[10px] px-2 py-0.5")}
                    >
                      {accountType}
                    </Badge>
                      {!user.is_active && (
                        <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200 text-[10px] px-2 py-0.5">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    {showMainPartner ? (
                      <div className="mt-1 text-xs text-gray-600 truncate">
                        Main partner: <span className="font-medium text-gray-800">{mainPartnerName}</span>
                      </div>
                    ) : null}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleImpersonate(user)}
                    disabled={
                      !user.is_active || 
                      isRowLoading ||
                      user.id === currentUser?.id
                    }
                    className="shrink-0 h-8 px-3 text-xs"
                  >
                    {isRowLoading ? 'Impersonating…' : (
                      <>
                        <LogIn className="h-4 w-4 mr-1" />
                        Impersonate
                      </>
                    )}
                  </Button>
                </div>
                    )
                  })()}
                </div>
              ))}
            </div>

            {/* Load more */}
            {(totalUsers === null ? users.length % pageSize === 0 : users.length < totalUsers) && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  onClick={() => handleSearch({ reset: false })}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Load more'}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!loading && (!users || users.length === 0) && (
          <div className="text-center py-8 text-gray-500">
            <UserCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>{searchQuery ? `No users found matching "${searchQuery}"` : 'No users found in the system'}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
            <p>Loading users...</p>
          </div>
        )}

        {/* Info Box */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Security Notice:</strong> All impersonation actions are logged with your admin account details.
            You cannot impersonate yourself or inactive users.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
