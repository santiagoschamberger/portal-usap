'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

const schema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must include uppercase, lowercase and a number'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})
type FormData = z.infer<typeof schema>

type PageState = 'loading' | 'ready' | 'invalid' | 'success'

function ResetPasswordForm() {
  const router = useRouter()
  const [pageState, setPageState] = useState<PageState>('loading')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    // Supabase automatically picks up the #access_token hash and creates a session.
    // We just need to confirm there IS a session before showing the form.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setPageState(session ? 'ready' : 'invalid')
    })

    // Also listen in case the session arrives slightly after mount
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPageState(session ? 'ready' : 'invalid')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true)
      setError('')
      const { error } = await supabase.auth.updateUser({ password: data.password })
      if (error) throw error
      setPageState('success')
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (pageState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9a132d]" />
      </div>
    )
  }

  if (pageState === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">USA Payments</h1>
            <p className="mt-2 text-sm text-gray-600">Partner Portal</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Invalid Reset Link</CardTitle>
              <CardDescription>This link is invalid or has expired.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                Please request a new password reset link.
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Link href="/auth/forgot-password" className="w-full">
                <Button className="w-full bg-[#9a132d] hover:bg-[#7d0f24]">Request new link</Button>
              </Link>
              <Link href="/auth/login" className="w-full">
                <Button variant="outline" className="w-full">Back to sign in</Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  if (pageState === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">USA Payments</h1>
            <p className="mt-2 text-sm text-gray-600">Partner Portal</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Password updated</CardTitle>
              <CardDescription>Your password has been successfully reset.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
                You can now sign in with your new password.
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full bg-[#9a132d] hover:bg-[#7d0f24]" onClick={() => router.push('/auth/login')}>
                Sign in
              </Button>
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
            <CardTitle>Set new password</CardTitle>
            <CardDescription>Enter your new password below.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter new password"
                  {...register('password')}
                  className={errors.password ? 'border-red-500' : ''}
                />
                {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
                <p className="text-xs text-gray-500">At least 8 characters with uppercase, lowercase, and number.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  {...register('confirmPassword')}
                  className={errors.confirmPassword ? 'border-red-500' : ''}
                />
                {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full bg-[#9a132d] hover:bg-[#7d0f24]" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update password'}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9a132d]" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
