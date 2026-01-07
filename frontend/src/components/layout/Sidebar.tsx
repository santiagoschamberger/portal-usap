'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/auth-store'
import {
  LayoutDashboard,
  Users,
  FileText,
  Briefcase,
  DollarSign,
  BookOpen,
  Settings,
  UserPlus,
  Shield,
  MessageCircle,
  Link2,
} from 'lucide-react'

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles?: string[] // If specified, only show for these roles
  external?: boolean // If true, opens in new tab
}

const navigationItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Submit Referral',
    href: '/submit',
    icon: UserPlus,
  },
  {
    title: 'Leads',
    href: '/leads',
    icon: FileText,
  },
  {
    title: 'Deals',
    href: '/deals',
    icon: Briefcase,
  },
  {
    title: 'Public URL',
    href: '/public-url',
    icon: Link2,
    roles: ['admin', 'user'], // Only main partners, not sub-accounts
  },
  {
    title: 'Compensation',
    href: '/compensation',
    icon: DollarSign,
  },
  {
    title: 'Sub-Accounts',
    href: '/sub-accounts',
    icon: Users,
    roles: ['admin'], // Only main accounts can manage sub-accounts
  },
  {
    title: 'Tutorials',
    href: '/tutorials',
    icon: BookOpen,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
  {
    title: 'Contact Us',
    href: 'https://bookings.usapayments.com/#/usapaymentsstrategicpartnership',
    icon: MessageCircle,
    external: true,
  },
]

const adminNavigationItems: NavItem[] = [
  {
    title: 'Admin Dashboard',
    href: '/admin',
    icon: Shield,
    roles: ['admin'],
  },
  {
    title: 'User Management',
    href: '/admin/users',
    icon: Users,
    roles: ['admin'],
  },
  {
    title: 'Tutorial Management',
    href: '/admin/tutorials',
    icon: BookOpen,
    roles: ['admin'],
  },
  {
    title: 'Payarc Report',
    href: '/admin/payarc',
    icon: DollarSign,
    roles: ['admin'],
  },
  {
    title: 'Cliq Report',
    href: '/admin/cliq',
    icon: Briefcase,
    roles: ['admin'],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, isAgent } = useAuthStore()

  // Get user role from either user_metadata or direct role property
  const userRole = user?.user_metadata?.role || (user as any)?.role || ''
  const isAdmin = userRole === 'admin'

  const shouldShowItem = (item: NavItem) => {
    // Hide certain items for agents/ISOs
    if (isAgent) {
      // Agents can only see Dashboard, Leads, Deals, Tutorials, Settings
      // They CANNOT see: Submit Referral, Public URL, Compensation, Sub-Accounts
      const allowedForAgents = ['/dashboard', '/leads', '/deals', '/tutorials', '/settings']
      if (!allowedForAgents.includes(item.href)) {
        return false
      }
    }
    
    if (!item.roles) return true
    return item.roles.includes(userRole)
  }

  // Get dynamic label for leads based on agent status
  const getLeadsLabel = () => {
    return isAgent ? 'Assigned Leads' : 'Leads'
  }

  const getDealsLabel = () => {
    return isAgent ? 'Assigned Deals' : 'Deals'
  }

  return (
    <aside className="fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r bg-background">
      <div className="flex h-full flex-col gap-2">
        <div className="flex-1 overflow-auto py-4">
          {/* Main Navigation */}
          <nav className="grid gap-1 px-4">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              if (!shouldShowItem(item)) return null

              if (item.external) {
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    <Icon className="h-4 w-4" />
                    {item.title}
                  </a>
                )
              }

              // Get dynamic label for leads/deals if agent
              const displayTitle = item.href === '/leads' ? getLeadsLabel() :
                                  item.href === '/deals' ? getDealsLabel() :
                                  item.title

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {displayTitle}
                </Link>
              )
            })}
          </nav>

          {/* Admin Navigation */}
          {isAdmin && (
            <>
              <div className="my-4 px-4">
                <div className="border-t" />
              </div>
              <div className="px-4 py-2">
                <h3 className="mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Admin
                </h3>
                <nav className="grid gap-1">
                  {adminNavigationItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href

                    if (!shouldShowItem(item)) return null

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {item.title}
                      </Link>
                    )
                  })}
                </nav>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4">
          <div className="text-xs text-muted-foreground">
            <p>Partner Portal v1.0</p>
            <p className="mt-1">© 2025 USA Payments</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

