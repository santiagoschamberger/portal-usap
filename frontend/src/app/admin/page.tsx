'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/protected-route'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold">Admin</h1>
            <p className="text-muted-foreground mt-1 text-sm">Admin tools</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Available tools</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 text-sm">
                <Link className="underline underline-offset-4 hover:text-primary" href="/admin/users">
                  User management (impersonation)
                </Link>
                <Link className="underline underline-offset-4 hover:text-primary" href="/admin/payarc">
                  Payarc report
                </Link>
                <Link className="underline underline-offset-4 hover:text-primary" href="/admin/cliq">
                  Cliq report
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

