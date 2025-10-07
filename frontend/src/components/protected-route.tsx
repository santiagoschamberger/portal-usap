'use client'

import { useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
import { User } from '@/types'

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles?: ('admin' | 'user' | 'contact')[]
  redirectTo?: string
}

export function ProtectedRoute({ 
  children, 
  allowedRoles,
  redirectTo = '/auth/login' 
}: ProtectedRouteProps) {
  const router = useRouter()
  const { user, isAuthenticated, loading, initialize } = useAuthStore()

  useEffect(() => {
    // Initialize auth store on mount
    initialize()
  }, [initialize])

  useEffect(() => {
    if (!loading) {
      // Not authenticated - redirect to login
      if (!isAuthenticated || !user) {
        router.push(redirectTo)
        return
      }

      // Check role-based access
      if (allowedRoles && allowedRoles.length > 0) {
        // Support both Supabase Auth format (user_metadata.role) and direct role property
        const userRole = (user.user_metadata?.role || (user as any).role) as 'admin' | 'user' | 'contact' || 'user'
        if (!allowedRoles.includes(userRole)) {
          // User doesn't have required role
          console.log('Access denied - User role:', userRole, 'Required roles:', allowedRoles)
          router.push('/dashboard') // Redirect to default dashboard
          return
        }
      }
    }
  }, [isAuthenticated, user, loading, allowedRoles, router, redirectTo])

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render children if not authenticated or wrong role
  if (!isAuthenticated || !user) {
    return null
  }

  if (allowedRoles && allowedRoles.length > 0) {
    // Support both Supabase Auth format (user_metadata.role) and direct role property
    const userRole = (user.user_metadata?.role || (user as any).role) as 'admin' | 'user' | 'contact' || 'user'
    if (!allowedRoles.includes(userRole)) {
      return null
    }
  }

  return <>{children}</>
}

// Higher-order component for easier usage
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles?: ('admin' | 'user' | 'contact')[]
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute allowedRoles={allowedRoles}>
        <Component {...props} />
      </ProtectedRoute>
    )
  }
}

// Hook for checking user permissions
export function usePermissions() {
  const { user } = useAuthStore()

  const hasRole = (role: 'admin' | 'user' | 'contact') => {
    // Support both Supabase Auth format and direct role property
    const userRole = user?.user_metadata?.role || (user as any)?.role
    return userRole === role
  }

  const hasAnyRole = (roles: ('admin' | 'user' | 'contact')[]) => {
    // Support both Supabase Auth format and direct role property
    const userRole = (user?.user_metadata?.role || (user as any)?.role) as 'admin' | 'user' | 'contact'
    return userRole ? roles.includes(userRole) : false
  }

  const isAdmin = () => hasRole('admin')
  const isUser = () => hasRole('user')
  const isContact = () => hasRole('contact')

  const canManageUsers = () => isAdmin()
  const canSubmitReferrals = () => hasAnyRole(['admin', 'user'])
  const canManageSubAccounts = () => hasAnyRole(['admin', 'user'])
  const canViewCompensation = () => hasAnyRole(['admin', 'user'])
  const canAccessAdminPanel = () => isAdmin()

  return {
    user,
    hasRole,
    hasAnyRole,
    isAdmin,
    isUser,
    isContact,
    canManageUsers,
    canSubmitReferrals,
    canManageSubAccounts,
    canViewCompensation,
    canAccessAdminPanel
  }
}

export default ProtectedRoute 