'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const { user, loading } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard')
      }
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Partner Portal
          </h1>
          <p className="text-xl text-muted-foreground">
            Manage your leads and track your progress with ease
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Welcome to the Portal</CardTitle>
              <CardDescription>
                Sign in to access your dashboard and manage your leads.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                className="w-full" 
                onClick={() => router.push('/auth/login')}
              >
                Sign In
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
              <CardDescription>
                What you can do with the portal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm">
                <li>• Create and manage leads</li>
                <li>• Track lead status in real-time</li>
                <li>• Generate detailed reports</li>
                <li>• Sync with Zoho CRM</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}