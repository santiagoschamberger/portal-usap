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

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
})
type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true)
      setError('')
      await AuthService.forgotPassword(data.email)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">USA Payments</h1>
            <p className="mt-2 text-sm text-gray-600">Partner Portal</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Check your email</CardTitle>
              <CardDescription>We've sent a password reset link to your email address.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
                If you don't see it, check your spam folder.
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/auth/login" className="w-full">
                <Button variant="outline" className="w-full">Back to sign in</Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">USA Payments</h1>
          <p className="mt-2 text-sm text-gray-600">Partner Portal</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Forgot your password?</CardTitle>
            <CardDescription>Enter your email and we'll send you a reset link.</CardDescription>
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
                {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full bg-[#9a132d] hover:bg-[#7d0f24]" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send reset email'}
              </Button>
              <div className="text-center">
                <Link href="/auth/login" className="text-sm text-[#9a132d] hover:text-[#7d0f24]">
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
