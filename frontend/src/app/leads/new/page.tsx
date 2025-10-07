'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ProtectedRoute } from '@/components/protected-route'
import { zohoService } from '@/services/zohoService'
import { toast } from 'react-hot-toast'
import { activityTracker } from '@/lib/activity-tracker'

// Validation schema
const leadSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  company: z.string().min(1, 'Company name is required'),
  businessType: z.string().min(1, 'Business type is required'),
  industry: z.string().optional(),
  annualRevenue: z.string().optional(),
  employeeCount: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  notes: z.string().optional(),
  source: z.string().min(1, 'Lead source is required')
})

type LeadFormData = z.infer<typeof leadSchema>

export default function NewLeadPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema)
  })

  const onSubmit = async (data: LeadFormData) => {
    setIsSubmitting(true)
    setError('')

    try {
      // Submit lead to backend (which syncs to Zoho)
      await zohoService.leads.create({
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        company: data.company,
        business_type: data.businessType,
        description: data.notes || `
Lead Source: ${data.source}
Industry: ${data.industry || 'N/A'}
Annual Revenue: ${data.annualRevenue || 'N/A'}
Employee Count: ${data.employeeCount || 'N/A'}
Website: ${data.website || 'N/A'}
        `.trim()
      })
      
      toast.success('Lead created successfully!')
      
      // Track activity
      activityTracker.addActivity('lead_created', `Created lead for ${data.firstName} ${data.lastName}`)
      
      // Redirect to leads list on success
      router.push('/leads')
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create lead'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push('/leads')
  }

  return (
    <ProtectedRoute allowedRoles={['admin', 'user']}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  onClick={() => router.push('/leads')}
                  className="mr-4"
                >
                  ← Back to Leads
                </Button>
                <h1 className="text-xl font-semibold text-gray-900">
                  Create New Lead
                </h1>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Lead Information</CardTitle>
              <CardDescription>
                Enter the details for the new lead
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        {...register('firstName')}
                        className={errors.firstName ? 'border-red-500' : ''}
                      />
                      {errors.firstName && (
                        <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        {...register('lastName')}
                        className={errors.lastName ? 'border-red-500' : ''}
                      />
                      {errors.lastName && (
                        <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        {...register('email')}
                        className={errors.email ? 'border-red-500' : ''}
                      />
                      {errors.email && (
                        <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        {...register('phone')}
                        className={errors.phone ? 'border-red-500' : ''}
                      />
                      {errors.phone && (
                        <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Company Information */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Company Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="company">Company Name *</Label>
                      <Input
                        id="company"
                        {...register('company')}
                        className={errors.company ? 'border-red-500' : ''}
                      />
                      {errors.company && (
                        <p className="text-red-500 text-sm mt-1">{errors.company.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="businessType">Business Type *</Label>
                      <select
                        id="businessType"
                        {...register('businessType')}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.businessType ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select business type</option>
                        <option value="retail">Retail</option>
                        <option value="restaurant">Restaurant</option>
                        <option value="ecommerce">E-commerce</option>
                        <option value="service">Service Business</option>
                        <option value="professional">Professional Services</option>
                        <option value="manufacturing">Manufacturing</option>
                        <option value="other">Other</option>
                      </select>
                      {errors.businessType && (
                        <p className="text-red-500 text-sm mt-1">{errors.businessType.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="industry">Industry</Label>
                      <Input
                        id="industry"
                        {...register('industry')}
                      />
                    </div>

                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        type="url"
                        placeholder="https://example.com"
                        {...register('website')}
                        className={errors.website ? 'border-red-500' : ''}
                      />
                      {errors.website && (
                        <p className="text-red-500 text-sm mt-1">{errors.website.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="annualRevenue">Annual Revenue</Label>
                      <select
                        id="annualRevenue"
                        {...register('annualRevenue')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select revenue range</option>
                        <option value="under_100k">Under $100K</option>
                        <option value="100k_500k">$100K - $500K</option>
                        <option value="500k_1m">$500K - $1M</option>
                        <option value="1m_5m">$1M - $5M</option>
                        <option value="5m_10m">$5M - $10M</option>
                        <option value="over_10m">Over $10M</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="employeeCount">Number of Employees</Label>
                      <select
                        id="employeeCount"
                        {...register('employeeCount')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select employee count</option>
                        <option value="1_5">1-5</option>
                        <option value="6_25">6-25</option>
                        <option value="26_100">26-100</option>
                        <option value="101_500">101-500</option>
                        <option value="over_500">Over 500</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Lead Source */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Lead Source</h3>
                  <div>
                    <Label htmlFor="source">How did you hear about us? *</Label>
                    <select
                      id="source"
                      {...register('source')}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.source ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select source</option>
                      <option value="website">Website</option>
                      <option value="referral">Referral</option>
                      <option value="social_media">Social Media</option>
                      <option value="google">Google Search</option>
                      <option value="cold_call">Cold Call</option>
                      <option value="trade_show">Trade Show</option>
                      <option value="advertisement">Advertisement</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.source && (
                      <p className="text-red-500 text-sm mt-1">{errors.source.message}</p>
                    )}
                  </div>
                </div>

                {/* Additional Notes */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Additional Information</h3>
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <textarea
                      id="notes"
                      rows={4}
                      {...register('notes')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Any additional notes about this lead..."
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-4 pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Creating Lead...' : 'Create Lead'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  )
} 