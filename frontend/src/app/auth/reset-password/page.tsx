'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AuthService } from '@/services/authService'
import { ResetPasswordFormData } from '@/types'

// Validation schema
const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string(),
  token: z.string().min(1, 'Reset token is required')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState(false)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)

  const token = searchParams.get('token') || ''

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token
    }
  })

  // Verify token on component mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setTokenValid(false)
        return
      }

      try {
        const isValid = await AuthService.verifyResetToken(token)
        setTokenValid(isValid)
        setValue('token', token)
      } catch (error) {
        setTokenValid(false)
      }
    }

    verifyToken()
  }, [token, setValue])

  const onSubmit = async (data: ResetPasswordForm) => {
    try {
      setIsLoading(true)
      setError('')
      
      await AuthService.resetPassword({
        password: data.password,
        confirmPassword: data.confirmPassword,
        token: data.token
      })
      
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Loading state while verifying token
  if (tokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Verifying reset token...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Invalid token
  if (tokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">USA Payments</h1>
            <p className="mt-2 text-sm text-gray-600">Partner Portal</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Invalid Reset Link</CardTitle>
              <CardDescription>
                This password reset link is invalid or has expired.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                <p>Please request a new password reset link.</p>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-2">
              <Link 
                href="/auth/forgot-password"
                className="w-full"
              >
                <Button className="w-full">
                  Request new reset link
                </Button>
              </Link>
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

  // Success state
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
              <CardTitle>Password reset successful</CardTitle>
              <CardDescription>
                Your password has been successfully reset.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
                <p>You can now sign in with your new password.</p>
              </div>
            </CardContent>

            <CardFooter>
              <Link 
                href="/auth/login"
                className="w-full"
              >
                <Button className="w-full">
                  Sign in
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  // Reset password form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">USA Payments</h1>
          <p className="mt-2 text-sm text-gray-600">Partner Portal</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Reset your password</CardTitle>
            <CardDescription>
              Enter your new password below.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <input type="hidden" {...register('token')} />

              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter new password"
                  {...register('password')}
                  className={errors.password ? 'border-red-500' : ''}
                />
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
                <p className="text-xs text-gray-500">
                  Password must be at least 8 characters with uppercase, lowercase, and number.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  {...register('confirmPassword')}
                  className={errors.confirmPassword ? 'border-red-500' : ''}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? 'Resetting...' : 'Reset password'}
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