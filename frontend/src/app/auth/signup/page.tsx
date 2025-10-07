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
import { supabase } from '@/lib/supabase'

const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type SignupFormData = z.infer<typeof signupSchema>

export default function SignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema)
  })

  const onSubmit = async (data: SignupFormData) => {
    try {
      setLoading(true)
      setError('')

      const { data: signUpData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: 'Test User',
            role: 'admin'
          }
        }
      })

      if (error) {
        setError(error.message || 'Signup failed. Please try again.')
      } else {
        setSuccess(true)
        // Redirect to login after successful signup
        setTimeout(() => {
          router.push('/auth/login')
        }, 2000)
      }
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.')
    } finally {
      setLoading(false)
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
            <CardTitle className="text-2xl font-bold text-center">
              Create your account
            </CardTitle>
            <CardDescription className="text-center">
              Sign up to access the partner portal
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="text-center">
                <div className="text-green-600 font-medium mb-2">
                  Account created successfully!
                </div>
                <div className="text-sm text-gray-600">
                  Redirecting to login...
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                <div>
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    className="mt-1"
                    placeholder="Enter your email"
                  />
                  {errors.email && (
                    <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    {...register('password')}
                    className="mt-1"
                    placeholder="Enter your password"
                  />
                  {errors.password && (
                    <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...register('confirmPassword')}
                    className="mt-1"
                    placeholder="Confirm your password"
                  />
                  {errors.confirmPassword && (
                    <p className="text-red-600 text-sm mt-1">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#9a132d] hover:bg-[#7d0f24]"
                  disabled={loading}
                >
                  {loading ? 'Creating account...' : 'Create account'}
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="justify-center">
            <div className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-[#9a132d] hover:text-[#7d0f24]">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
} 