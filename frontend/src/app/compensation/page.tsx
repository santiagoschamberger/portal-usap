'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/protected-route'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function CompensationPage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'user']}>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold">Compensation</h1>
            <p className="text-muted-foreground mt-1 text-sm">This section is not enabled.</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">No compensation data</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                If you need compensation details, please contact support.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

