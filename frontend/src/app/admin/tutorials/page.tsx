'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/protected-route'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function AdminTutorialsPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold">Manage Tutorials</h1>
            <p className="text-muted-foreground mt-1 text-sm">This section is not enabled.</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Nothing to manage here</CardTitle>
            </CardHeader>
            <CardContent>
              <Link className="text-sm underline underline-offset-4 hover:text-primary" href="/admin/users">
                Go to User Management
              </Link>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

