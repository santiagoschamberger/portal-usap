'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { partnerService, SubAccount } from '@/services/partnerService'
import { toast } from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { activityTracker } from '@/lib/activity-tracker'
import { useAuthStore } from '@/lib/auth-store'
import { useRouter } from 'next/navigation'

interface CreateSubAccountForm {
  email: string
  first_name: string
  last_name: string
}

export default function SubAccountsPage() {
  const router = useRouter()
  const { user, startImpersonation } = useAuthStore()
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [impersonating, setImpersonating] = useState<string | null>(null)
  const [activating, setActivating] = useState<string | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<CreateSubAccountForm>()

  useEffect(() => {
    fetchSubAccounts()
  }, [])

  const fetchSubAccounts = async () => {
    try {
      setLoading(true)
      const data = await partnerService.getSubAccounts()
      setSubAccounts(data)
    } catch (error) {
      console.error('Error fetching sub-accounts:', error)
      toast.error('Failed to load sub-accounts')
    } finally {
      setLoading(false)
    }
  }

  const handleSyncFromZoho = async () => {
    try {
      setSyncing(true)
      const result = await partnerService.syncContactsFromZoho()
      
      // Safely access properties with fallback values
      const synced = result?.synced ?? result?.data?.synced ?? 0
      const created = result?.created ?? result?.data?.created ?? 0
      const updated = result?.updated ?? result?.data?.updated ?? 0
      
      toast.success(
        `Synced ${synced} contacts: ${created} created, ${updated} updated`
      )
      
      // Track activity
      activityTracker.addActivity('subaccount_synced', `Synced ${synced} contacts from Zoho CRM`)
      
      fetchSubAccounts()
    } catch (error: any) {
      console.error('Error syncing from Zoho:', error)
      toast.error(error.message || 'Failed to sync contacts from Zoho')
    } finally {
      setSyncing(false)
    }
  }

  const onCreateSubmit = async (data: CreateSubAccountForm) => {
    try {
      setCreating(true)
      await partnerService.createSubAccount(data)
      toast.success('Sub-account created successfully! Password reset email sent.')
      
      // Track activity
      activityTracker.addActivity('subaccount_created', `Created sub-account for ${data.first_name} ${data.last_name}`)
      
      setCreateDialogOpen(false)
      reset()
      fetchSubAccounts()
    } catch (error: any) {
      console.error('Error creating sub-account:', error)
      toast.error(error.message || 'Failed to create sub-account')
    } finally {
      setCreating(false)
    }
  }

  const handleToggleStatus = async (subAccount: SubAccount) => {
    try {
      await partnerService.updateSubAccount(subAccount.id, {
        is_active: !subAccount.is_active
      })
      toast.success(`Sub-account ${subAccount.is_active ? 'deactivated' : 'activated'}`)
      fetchSubAccounts()
    } catch (error) {
      console.error('Error updating sub-account:', error)
      toast.error('Failed to update sub-account status')
    }
  }

  const handleActivateAccess = async (subAccount: SubAccount) => {
    try {
      setActivating(subAccount.id)
      await partnerService.activateSubAccount(subAccount.id)
      toast.success(`Activation email sent to ${subAccount.email}`)
      
      // Track activity
      activityTracker.addActivity('subaccount_activated', `Sent activation email to ${subAccount.first_name} ${subAccount.last_name}`)
    } catch (error: any) {
      console.error('Error sending activation email:', error)
      toast.error(error.message || 'Failed to send activation email')
    } finally {
      setActivating(null)
    }
  }

  const handleLoginAs = async (subAccount: SubAccount) => {
    if (!user) return

    try {
      setImpersonating(subAccount.id)
      const response = await partnerService.impersonateSubAccount(subAccount.id)
      
      // Create impersonated user object
      const impersonatedUser = {
        ...response.data.user,
        user_metadata: {
          role: 'sub_account',
          first_name: subAccount.first_name,
          last_name: subAccount.last_name
        }
      }

      // Start impersonation in auth store
      startImpersonation(impersonatedUser, user)
      
      toast.success(`Now viewing as ${subAccount.first_name} ${subAccount.last_name}`)
      
      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Error impersonating sub-account:', error)
      toast.error(error.message || 'Failed to login as sub-account')
    } finally {
      setImpersonating(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Sub-Accounts</h1>
              <p className="text-muted-foreground mt-2">
                Manage your team members and sub-accounts from Zoho CRM
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleSyncFromZoho}
                disabled={syncing}
              >
                {syncing ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>
                    Syncing...
                  </>
                ) : (
                  <>
                    <span className="mr-2">🔄</span>
                    Sync from Zoho
                  </>
                )}
              </Button>
              <Button onClick={() => setCreateDialogOpen(true)}>
                Create Sub-Account
              </Button>
            </div>
          </div>

          {/* Sub-Accounts Table */}
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                {subAccounts.length} {subAccounts.length === 1 ? 'member' : 'members'} in your team
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                </div>
              ) : subAccounts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    No sub-accounts yet. Create your first team member to get started.
                  </p>
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    Create Sub-Account
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-center">Total Leads</TableHead>
                        <TableHead className="text-center">New</TableHead>
                        <TableHead className="text-center">Qualified</TableHead>
                        <TableHead className="text-center">Won</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subAccounts.map((subAccount) => (
                        <TableRow key={subAccount.id}>
                          <TableCell className="font-medium">
                            {subAccount.first_name} {subAccount.last_name}
                          </TableCell>
                          <TableCell>{subAccount.email}</TableCell>
                          <TableCell className="text-center font-semibold">
                            {subAccount.lead_stats?.total_leads || 0}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">
                              {subAccount.lead_stats?.new_leads || 0}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">
                              {subAccount.lead_stats?.qualified || 0}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="default" className="bg-green-600">
                              {subAccount.lead_stats?.closed_won || 0}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={subAccount.is_active ? 'default' : 'secondary'}>
                              {subAccount.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleActivateAccess(subAccount)}
                                disabled={activating === subAccount.id}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                {activating === subAccount.id ? 'Sending...' : 'Activate Access'}
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleLoginAs(subAccount)}
                                disabled={!subAccount.is_active || impersonating === subAccount.id}
                                className="bg-[#9a132d] hover:bg-[#7d0f24]"
                              >
                                {impersonating === subAccount.id ? 'Loading...' : 'Login As'}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleStatus(subAccount)}
                              >
                                {subAccount.is_active ? 'Deactivate' : 'Activate'}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Create Sub-Account Dialog */}
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Sub-Account</DialogTitle>
                <DialogDescription>
                  Add a new team member. They will receive an email to set their password.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onCreateSubmit)}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input
                      id="first_name"
                      placeholder="John"
                      {...register('first_name', { required: 'First name is required' })}
                    />
                    {errors.first_name && (
                      <p className="text-sm text-red-600">{errors.first_name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input
                      id="last_name"
                      placeholder="Doe"
                      {...register('last_name', { required: 'Last name is required' })}
                    />
                    {errors.last_name && (
                      <p className="text-sm text-red-600">{errors.last_name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      })}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setCreateDialogOpen(false)
                      reset()
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={creating}>
                    {creating ? 'Creating...' : 'Create Sub-Account'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

