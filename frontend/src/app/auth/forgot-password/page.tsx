'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AuthService } from '@/services/authService'
import { ForgotPasswordFormData } from '@/types'

// Validation schema
const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address')
})

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema)
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsLoading(true)
      setError('')
      
      await AuthService.forgotPassword(data)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">USA Payments</h1>
            <p className="mt-2 text-sm text-gray-600">Partner Portal</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Check your email</CardTitle>
              <CardDescription>
                We've sent password reset instructions to your email address.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
                <p>If you don't see the email in your inbox, please check your spam folder.</p>
              </div>
            </CardContent>

            <CardFooter>
              <Link 
                href="/auth/login"
                className="w-full"
              >
                <Button variant="outline" className="w-full">
                  Back to sign in
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">USA Payments</h1>
          <p className="mt-2 text-sm text-gray-600">Partner Portal</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Forgot your password?</CardTitle>
            <CardDescription>
              Enter your email address and we'll send you a link to reset your password.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email"
                  {...register('email')}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send reset email'}
              </Button>

              <div className="text-center">
                <Link 
                  href="/auth/login"
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Back to sign in
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        <div className="text-center text-xs text-gray-500">
          <p>© 2024 USA Payments. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
} 