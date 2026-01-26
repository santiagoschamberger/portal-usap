'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import UserImpersonation from '@/components/admin/UserImpersonation'

export default function AdminUsersPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage partners and their accounts
            </p>
          </div>

          {/* User Impersonation Feature */}
          <UserImpersonation />

          <Card>
            <CardHeader>
              <CardTitle>Additional User Management</CardTitle>
              <CardDescription>
                More features coming soon
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Additional user management features will be available soon. You&apos;ll be able to 
                view detailed user information, manage permissions, and more.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

