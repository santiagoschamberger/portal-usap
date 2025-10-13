'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'react-hot-toast'
import { CheckCircle } from 'lucide-react'

// Validation schema
const publicLeadSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  company: z.string().min(1, 'Company name is required'),
  businessType: z.string().min(1, 'Business type is required'),
  industry: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  notes: z.string().optional(),
})

type PublicLeadFormData = z.infer<typeof publicLeadSchema>

function PublicLeadFormContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [partnerId, setPartnerId] = useState<string | null>(null)
  const [error, setError] = useState<string>('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<PublicLeadFormData>({
    resolver: zodResolver(publicLeadSchema)
  })

  useEffect(() => {
    const partner = searchParams.get('partner')
    if (partner) {
      setPartnerId(partner)
    } else {
      setError('Invalid link. Please contact your USA Payments representative.')
    }
  }, [searchParams])

  const onSubmit = async (data: PublicLeadFormData) => {
    if (!partnerId) {
      toast.error('Invalid partner link')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '')
      
      const response = await fetch(`${API_URL}/api/leads/public`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          partner_id: partnerId,
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          phone: data.phone,
          company: data.company,
          business_type: data.businessType,
          industry: data.industry || '',
          website: data.website || '',
          notes: data.notes || '',
          source: 'Public Form'
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to submit lead')
      }

      setIsSuccess(true)
      reset()
      toast.success('Thank you! Your information has been submitted successfully.')
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to submit. Please try again.'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <Image 
              src="/usa-payments-logo.png" 
              alt="USA Payments Logo" 
              width={250} 
              height={150}
              priority
              className="h-auto w-auto max-h-24 mx-auto"
            />
          </div>

          <Card className="text-center">
            <CardContent className="pt-12 pb-12">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Thank You!
              </h2>
              <p className="text-gray-600 mb-6">
                Your information has been submitted successfully. A USA Payments representative will contact you soon.
              </p>
              <Button 
                onClick={() => {
                  setIsSuccess(false)
                  reset()
                }}
                className="bg-[#9a132d] hover:bg-[#7d0f24]"
              >
                Submit Another Lead
              </Button>
            </CardContent>
          </Card>

          <div className="text-center mt-6 text-xs text-gray-500">
            <p>© 2025 USA Payments. All rights reserved.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <Image 
            src="/usa-payments-logo.png" 
            alt="USA Payments Logo" 
            width={250} 
            height={150}
            priority
            className="h-auto w-auto max-h-24 mx-auto mb-6"
          />
          <h1 className="text-3xl font-bold text-gray-900">
            Get Started with USA Payments
          </h1>
          <p className="mt-2 text-gray-600">
            Fill out the form below and we'll be in touch shortly
          </p>
        </div>

        {error && !partnerId && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-700 text-center">{error}</p>
            </CardContent>
          </Card>
        )}

        {partnerId && (
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                Please provide your details so we can assist you
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
                        placeholder="John"
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
                        placeholder="Doe"
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
                        placeholder="john@company.com"
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
                        placeholder="(555) 123-4567"
                      />
                      {errors.phone && (
                        <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Business Information */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Business Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="company">Company Name *</Label>
                      <Input
                        id="company"
                        {...register('company')}
                        className={errors.company ? 'border-red-500' : ''}
                        placeholder="ABC Corporation"
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
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#9a132d] ${
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
                        placeholder="e.g., Healthcare, Technology"
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
                  </div>
                </div>

                {/* Additional Information */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Additional Information</h3>
                  <div>
                    <Label htmlFor="notes">Tell us about your payment processing needs</Label>
                    <textarea
                      id="notes"
                      rows={4}
                      {...register('notes')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9a132d]"
                      placeholder="What are you looking for in a payment processor?"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-6">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#9a132d] hover:bg-[#7d0f24]"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Information'}
                  </Button>
                  <p className="text-xs text-gray-500 text-center mt-4">
                    By submitting this form, you agree to be contacted by USA Payments regarding payment processing services.
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="text-center mt-6 text-xs text-gray-500">
          <p>© 2025 USA Payments. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}

export default function PublicLeadFormPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9a132d] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading form...</p>
        </div>
      </div>
    }>
      <PublicLeadFormContent />
    </Suspense>
  )
}

