'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/protected-route'
import UserImpersonation from '@/components/admin/UserImpersonation'

export default function AdminUsersPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold">User Management</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Manage partners and their accounts
            </p>
          </div>

          {/* User Impersonation Feature */}
          <UserImpersonation />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

