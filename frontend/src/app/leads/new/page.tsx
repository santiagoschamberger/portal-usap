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
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { StateDropdown } from '@/components/leads/StateDropdown'
import { zohoService } from '@/services/zohoService'
import { toast } from 'react-hot-toast'
import { activityTracker } from '@/lib/activity-tracker'

/**
 * Simplified Lead Form - Phase 2
 * 
 * Only 6 fields as per requirements:
 * 1. Business Name (required)
 * 2. Contact Name (required)
 * 3. Email (required)
 * 4. Phone Number (required)
 * 5. State (required)
 * 6. Additional Information (optional)
 */

// Simplified validation schema - only 6 fields
const leadSchema = z.object({
  businessName: z.string().min(1, 'Business name is required'),
  contactName: z.string().min(1, 'Contact name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  state: z.string().min(1, 'State is required'),
  additionalInfo: z.string().optional(),
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
    setValue,
    watch,
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      businessName: '',
      contactName: '',
      email: '',
      phone: '',
      state: '',
      additionalInfo: '',
    }
  })

  const stateValue = watch('state')

  const onSubmit = async (data: LeadFormData) => {
    setIsSubmitting(true)
    setError('')

    try {
      // Map simplified form fields to Zoho CRM fields
      // Based on ZOHO_FIELD_FINDINGS.md:
      // - businessName → Company
      // - contactName → Full_Name (Zoho will split to First/Last)
      // - email → Email
      // - phone → Phone
      // - state → State (text field)
      // - additionalInfo → Lander_Message (textarea)
      
      await zohoService.leads.create({
        company: data.businessName,
        full_name: data.contactName,
        email: data.email,
        phone: data.phone,
        state: data.state,
        lander_message: data.additionalInfo || '',
      })
      
      toast.success('Lead created successfully!')
      
      // Track activity
      activityTracker.addActivity('lead_created', `Created lead for ${data.contactName} at ${data.businessName}`)
      
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
      <DashboardLayout>
        <div className="space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold">Create New Lead</h1>
            <p className="text-muted-foreground mt-2">
              Enter the basic information for the new lead
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lead Information</CardTitle>
              <CardDescription>
                All fields marked with * are required
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                {/* Simplified Form - Only 6 Fields */}
                <div className="space-y-4">
                  {/* Business Name */}
                  <div>
                    <Label htmlFor="businessName">Business Name *</Label>
                    <Input
                      id="businessName"
                      placeholder="Enter business name"
                      {...register('businessName')}
                      className={errors.businessName ? 'border-red-500' : ''}
                    />
                    {errors.businessName && (
                      <p className="text-red-500 text-sm mt-1">{errors.businessName.message}</p>
                    )}
                  </div>

                  {/* Contact Name */}
                  <div>
                    <Label htmlFor="contactName">Contact Name *</Label>
                    <Input
                      id="contactName"
                      placeholder="Enter contact name"
                      {...register('contactName')}
                      className={errors.contactName ? 'border-red-500' : ''}
                    />
                    {errors.contactName && (
                      <p className="text-red-500 text-sm mt-1">{errors.contactName.message}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@example.com"
                      {...register('email')}
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                    )}
                  </div>

                  {/* Phone Number */}
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(555) 123-4567"
                      {...register('phone')}
                      className={errors.phone ? 'border-red-500' : ''}
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                    )}
                  </div>

                  {/* State */}
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <StateDropdown
                      value={stateValue}
                      onChange={(value) => setValue('state', value)}
                      error={errors.state?.message}
                      required
                    />
                  </div>

                  {/* Additional Information (Optional) */}
                  <div>
                    <Label htmlFor="additionalInfo">Additional Information</Label>
                    <textarea
                      id="additionalInfo"
                      rows={4}
                      {...register('additionalInfo')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Any additional notes about this lead (optional)..."
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Optional: Add any relevant details about the lead
                    </p>
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

          {/* Help Text */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-blue-900">Quick Lead Submission</h3>
                  <p className="mt-1 text-sm text-blue-700">
                    This simplified form allows you to quickly submit leads with just the essential information. 
                    The lead will be automatically synced to Zoho CRM and you'll be able to track its progress.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
