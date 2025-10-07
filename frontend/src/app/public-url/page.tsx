'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/lib/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Copy, ExternalLink, Globe, Mail, Share2, Smartphone, FileText, QrCode, CheckCircle2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function PublicUrlPage() {
  const { user } = useAuthStore()
  const [publicLeadFormUrl, setPublicLeadFormUrl] = useState('')

  useEffect(() => {
    if (user?.id) {
      const baseUrl = window.location.origin
      setPublicLeadFormUrl(`${baseUrl}/public-lead-form?partner=${user.id}`)
    }
  }, [user])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicLeadFormUrl)
    toast.success('Public lead form URL copied to clipboard!')
  }

  const handleOpenLink = () => {
    window.open(publicLeadFormUrl, '_blank')
  }

  return (
    <ProtectedRoute allowedRoles={['admin', 'user']}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">Public Lead Submission URL</h1>
            <p className="text-muted-foreground mt-2">
              Share your unique URL to collect leads from anywhere. All submissions are automatically credited to your account.
            </p>
          </div>

          {/* Your Unique URL Card */}
          <Card className="border-[#9a132d]/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-[#9a132d]" />
                Your Unique Public Form URL
              </CardTitle>
              <CardDescription>
                This URL is unique to your account and can be safely shared publicly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="public-lead-url" className="text-base font-medium mb-2 block">
                  Shareable Link
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="public-lead-url"
                    type="text"
                    readOnly
                    value={publicLeadFormUrl}
                    className="flex-1 font-mono text-sm"
                  />
                  <Button onClick={handleCopyLink} variant="outline" size="icon" title="Copy to clipboard">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button onClick={handleOpenLink} className="bg-[#9a132d] hover:bg-[#7d0f24]" size="icon" title="Open in new tab">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Click the copy icon to copy the link, or the open icon to preview the form
                </p>
              </div>
            </CardContent>
          </Card>

          {/* How to Use Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-[#9a132d]" />
                How to Use This URL
              </CardTitle>
              <CardDescription>
                Multiple ways to share your public lead form and start collecting referrals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Use Cases Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Website */}
                <div className="flex gap-3 p-4 border rounded-lg hover:border-[#9a132d]/50 transition-colors">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-[#9a132d]/10 flex items-center justify-center">
                      <Globe className="h-5 w-5 text-[#9a132d]" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Add to Your Website</h3>
                    <p className="text-sm text-muted-foreground">
                      Embed a "Submit a Referral" button on your website that links to this URL
                    </p>
                  </div>
                </div>

                {/* Email Signature */}
                <div className="flex gap-3 p-4 border rounded-lg hover:border-[#9a132d]/50 transition-colors">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-[#9a132d]/10 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-[#9a132d]" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Email Signature</h3>
                    <p className="text-sm text-muted-foreground">
                      Include the link in your email signature so every email becomes a referral opportunity
                    </p>
                  </div>
                </div>

                {/* Social Media */}
                <div className="flex gap-3 p-4 border rounded-lg hover:border-[#9a132d]/50 transition-colors">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-[#9a132d]/10 flex items-center justify-center">
                      <Smartphone className="h-5 w-5 text-[#9a132d]" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Social Media Profiles</h3>
                    <p className="text-sm text-muted-foreground">
                      Add to your LinkedIn, Twitter, or Facebook bio as a call-to-action
                    </p>
                  </div>
                </div>

                {/* Marketing Materials */}
                <div className="flex gap-3 p-4 border rounded-lg hover:border-[#9a132d]/50 transition-colors">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-[#9a132d]/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-[#9a132d]" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Marketing Materials</h3>
                    <p className="text-sm text-muted-foreground">
                      Include on brochures, flyers, business cards, and other printed materials
                    </p>
                  </div>
                </div>

                {/* QR Code */}
                <div className="flex gap-3 p-4 border rounded-lg hover:border-[#9a132d]/50 transition-colors">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-[#9a132d]/10 flex items-center justify-center">
                      <QrCode className="h-5 w-5 text-[#9a132d]" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Generate QR Code</h3>
                    <p className="text-sm text-muted-foreground">
                      Create a QR code for events, trade shows, or print materials for easy mobile access
                    </p>
                  </div>
                </div>

                {/* Email Campaigns */}
                <div className="flex gap-3 p-4 border rounded-lg hover:border-[#9a132d]/50 transition-colors">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-[#9a132d]/10 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-[#9a132d]" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Email Campaigns</h3>
                    <p className="text-sm text-muted-foreground">
                      Use in newsletters or promotional emails to drive referrals from your network
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Benefits Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Benefits of Using Your Public URL
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">Automatic Attribution:</span>
                    <span className="text-muted-foreground ml-1">
                      All leads submitted through this URL are automatically credited to your account
                    </span>
                  </div>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">No Login Required:</span>
                    <span className="text-muted-foreground ml-1">
                      Your leads can submit their information without creating an account
                    </span>
                  </div>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">Real-Time Sync:</span>
                    <span className="text-muted-foreground ml-1">
                      Leads appear instantly in your dashboard and sync to Zoho CRM automatically
                    </span>
                  </div>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">Professional Branding:</span>
                    <span className="text-muted-foreground ml-1">
                      The form is branded with USA Payments logo for a professional appearance
                    </span>
                  </div>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">Mobile Optimized:</span>
                    <span className="text-muted-foreground ml-1">
                      Works perfectly on all devices - desktop, tablet, and mobile
                    </span>
                  </div>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">Track Performance:</span>
                    <span className="text-muted-foreground ml-1">
                      All submissions are marked with "Public Form" source for easy tracking
                    </span>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Example Usage Section */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="text-lg">💡 Example Usage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="font-medium">Email Signature Example:</p>
                <div className="bg-white p-4 rounded border text-sm space-y-1">
                  <p className="font-semibold">John Smith</p>
                  <p className="text-muted-foreground">Strategic Partner | USA Payments</p>
                  <p className="text-muted-foreground">john@example.com | (555) 123-4567</p>
                  <div className="pt-2 border-t mt-2">
                    <a href="#" className="text-[#9a132d] hover:underline font-medium">
                      → Submit a Business Referral
                    </a>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-medium">Social Media Bio Example:</p>
                <div className="bg-white p-4 rounded border text-sm">
                  <p>
                    Strategic Partner @USAPayments | Helping businesses grow with payment solutions 💳
                  </p>
                  <p className="text-[#9a132d] mt-2 font-medium">
                    Know a business that needs payment processing? Submit a referral: [Your URL]
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex gap-2">
                  <span className="text-[#9a132d]">•</span>
                  <span>Shorten your URL using services like Bitly or TinyURL for easier sharing</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#9a132d]">•</span>
                  <span>Test the form yourself before sharing to ensure everything works correctly</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#9a132d]">•</span>
                  <span>Use UTM parameters to track which marketing channels drive the most leads</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#9a132d]">•</span>
                  <span>Check your Leads dashboard regularly to follow up with new submissions</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

