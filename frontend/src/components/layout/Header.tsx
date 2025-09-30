'use client'

import { useAuthStore } from '@/lib/auth-store'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Bell, User, LogOut, Settings } from 'lucide-react'

export function Header() {
  const { user, signOut } = useAuthStore()
  const router = useRouter()

  const handleLogout = async () => {
    await signOut()
    router.push('/auth/login')
  }

  const getUserInitials = () => {
    if (!user) return 'U'
    const firstName = user.user_metadata?.first_name || user.email?.charAt(0) || 'U'
    const lastName = user.user_metadata?.last_name || ''
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const getUserName = () => {
    if (!user) return 'User'
    const firstName = user.user_metadata?.first_name
    const lastName = user.user_metadata?.last_name
    if (firstName && lastName) {
      return `${firstName} ${lastName}`
    }
    return user.email || 'User'
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 font-bold text-xl">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              UP
            </div>
            <span>USA Payments</span>
          </div>
        </div>

        {/* Right side - Notifications and User Menu */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{getUserName()}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground capitalize">
                    {user?.user_metadata?.role || 'Partner'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/settings')}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

