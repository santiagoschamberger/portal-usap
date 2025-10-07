'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/lib/auth-store'
import { toast } from 'react-hot-toast'
import { Copy, Check, ExternalLink } from 'lucide-react'

export default function SettingsPage() {
  const { user } = useAuthStore()
  const [copied, setCopied] = useState(false)
  const [publicUrl, setPublicUrl] = useState('')

  useEffect(() => {
    // Generate public URL for this partner
    if (user?.id) {
      const baseUrl = window.location.origin
      setPublicUrl(`${baseUrl}/public-lead-form?partner=${user.id}`)
    }
  }, [user])

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      toast.success('URL copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy URL')
    }
  }

  const handleTestUrl = () => {
    window.open(publicUrl, '_blank')
  }

  return (
    <ProtectedRoute allowedRoles={['admin', 'user']}>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground mt-2">
              Manage your profile and account settings
            </p>
          </div>

          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                View and manage your account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Email cannot be changed
                  </p>
                </div>

                <div>
                  <Label htmlFor="role">Account Type</Label>
                  <Input
                    id="role"
                    value={user?.user_metadata?.role || 'Partner'}
                    disabled
                    className="bg-gray-50 capitalize"
                  />
                </div>

                {user?.user_metadata?.first_name && (
                  <>
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={user.user_metadata.first_name}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>

                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={user.user_metadata.last_name || ''}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600">
                  To update your profile information, please contact support.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Public Lead Form URL */}
          <Card>
            <CardHeader>
              <CardTitle>Public Lead Submission Form</CardTitle>
              <CardDescription>
                Share this unique URL with your leads so they can submit information directly to your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="publicUrl">Your Unique Lead Form URL</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="publicUrl"
                    value={publicUrl}
                    readOnly
                    className="bg-gray-50 font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyUrl}
                    className="flex-shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleTestUrl}
                    className="flex-shrink-0"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Click the copy icon to copy the URL, or the external link icon to test it
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">How to use this URL:</h4>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Share this URL on your website, social media, or email campaigns</li>
                  <li>Leads who submit through this form are automatically linked to your account</li>
                  <li>You'll receive credit for all leads submitted through this link</li>
                  <li>Track all submissions in your Leads dashboard</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Account Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage your account preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Password</h4>
                  <p className="text-sm text-gray-600">
                    Reset your account password
                  </p>
                </div>
                <Button variant="outline" disabled>
                  Change Password
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Email Notifications</h4>
                  <p className="text-sm text-gray-600">
                    Manage notification preferences
                  </p>
                </div>
                <Button variant="outline" disabled>
                  Configure
                </Button>
              </div>

              <p className="text-sm text-gray-500 pt-4">
                Additional settings coming soon. Contact support for assistance.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
