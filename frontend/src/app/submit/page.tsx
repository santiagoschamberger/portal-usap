'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ProtectedRoute } from '@/components/protected-route'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'react-hot-toast'
import { CheckCircle } from 'lucide-react'

// Validation schema matching the Contact Us form
const contactFormSchema = z.object({
  corporationName: z.string().min(1, 'Corporation name is required'),
  businessName: z.string().min(1, 'Business name is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  message: z.string().optional(),
  verificationCode: z.string().min(1, 'Verification code is required'),
})

type ContactFormData = z.infer<typeof contactFormSchema>

function SubmitReferralForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [captchaCode, setCaptchaCode] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema)
  })

  // Generate a simple captcha code
  const generateCaptcha = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setCaptchaCode(code)
  }

  // Generate captcha on mount
  useEffect(() => {
    generateCaptcha()
  }, [])

  const onSubmit = async (data: ContactFormData) => {
    // Verify captcha
    if (data.verificationCode.toUpperCase() !== captchaCode) {
      toast.error('Verification code is incorrect')
      return
    }

    setIsSubmitting(true)

    try {
      const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '')
      
      const response = await fetch(`${API_URL}/api/referrals/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          corporation_name: data.corporationName,
          business_name: data.businessName,
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          phone: data.phone,
          message: data.message || '',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to submit referral')
      }

      setIsSuccess(true)
      reset()
      toast.success('Thank you! Your referral has been submitted successfully.')
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to submit. Please try again.'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-12 pb-12">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Thank You!
            </h2>
            <p className="text-gray-600 mb-6">
              Your referral has been submitted successfully. We'll be in touch soon.
            </p>
            <Button 
              onClick={() => {
                setIsSuccess(false)
                generateCaptcha()
              }}
              className="bg-[#9a132d] hover:bg-[#7d0f24]"
            >
              Submit Another Referral
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Contact Us</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Corporation Name */}
            <div>
              <Label htmlFor="corporationName">Corporation Name *</Label>
              <Input
                id="corporationName"
                {...register('corporationName')}
                className={errors.corporationName ? 'border-red-500' : ''}
              />
              {errors.corporationName && (
                <p className="text-red-500 text-sm mt-1">{errors.corporationName.message}</p>
              )}
            </div>

            {/* Business Name */}
            <div>
              <Label htmlFor="businessName">Business Name *</Label>
              <Input
                id="businessName"
                {...register('businessName')}
                className={errors.businessName ? 'border-red-500' : ''}
              />
              {errors.businessName && (
                <p className="text-red-500 text-sm mt-1">{errors.businessName.message}</p>
              )}
            </div>

            {/* First Name */}
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

            {/* Last Name */}
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

            {/* Email */}
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

            {/* Phone */}
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

            {/* Message */}
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                rows={4}
                {...register('message')}
                className="resize-none"
              />
            </div>

            {/* Verification Code */}
            <div>
              <Label htmlFor="verificationCode">Verification Code *</Label>
              <p className="text-xs text-gray-500 mb-2">Enter the text in the box below</p>
              <div className="flex items-center gap-4 mb-2">
                <div className="bg-gray-100 border-2 border-gray-300 px-6 py-3 rounded font-mono text-2xl tracking-wider select-none">
                  {captchaCode}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateCaptcha}
                  className="text-xs"
                >
                  Refresh
                </Button>
              </div>
              <Input
                id="verificationCode"
                {...register('verificationCode')}
                className={errors.verificationCode ? 'border-red-500' : ''}
                placeholder="Enter code"
              />
              {errors.verificationCode && (
                <p className="text-red-500 text-sm mt-1">{errors.verificationCode.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#9a132d] hover:bg-[#7d0f24]"
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SubmitPage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'user']}>
      <div className="container mx-auto py-8 px-4">
        <SubmitReferralForm />
      </div>
    </ProtectedRoute>
  )
}

