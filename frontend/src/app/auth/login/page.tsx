'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/lib/auth-store'
import { LoginFormData } from '@/types'

// Validation schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
})

export default function LoginPage() {
  const router = useRouter()
  const { signIn, loading } = useAuthStore()
  const [error, setError] = useState<string>('')

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError('')
      const { error } = await signIn(data.email, data.password)
      if (error) {
        setError(error.message || 'Login failed. Please try again.')
      } else {
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Image 
              src="/usa-payments-logo.png" 
              alt="USA Payments Logo" 
              width={250} 
              height={150}
              priority
              className="h-auto w-auto max-h-24"
            />
          </div>
          <p className="mt-2 text-sm text-gray-600">Partner Portal</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign in to your account</CardTitle>
            <CardDescription>
              Enter your credentials to access the partner portal
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

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  {...register('password')}
                  className={errors.password ? 'border-red-500' : ''}
                />
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full bg-[#9a132d] hover:bg-[#7d0f24]" 
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>

              <div className="text-center space-y-2">
                <div>
                  <Link 
                    href="/auth/forgot-password"
                    className="text-sm text-[#9a132d] hover:text-[#7d0f24]"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Don't have an account? </span>
                  <Link 
                    href="/auth/signup"
                    className="text-sm text-[#9a132d] hover:text-[#7d0f24]"
                  >
                    Sign up
                  </Link>
                </div>
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