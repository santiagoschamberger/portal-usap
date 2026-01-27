import type { User } from '@/types'

export type UserRole = 'admin' | 'user' | 'contact' | 'sub_account'

/**
 * Normalize the current user's role across different auth payload shapes.
 *
 * Sources (in priority order):
 * - Supabase style: user.user_metadata.role
 * - Our API/local storage: user.role
 * - Legacy: user.user_metadata?.user_role
 *
 * Returns null if unknown/missing.
 */
export function getUserRole(user: User | null | undefined): UserRole | null {
  if (!user) return null

  const anyUser = user as any
  const raw =
    anyUser?.user_metadata?.role ??
    anyUser?.role ??
    anyUser?.user_metadata?.user_role ??
    null

  if (typeof raw !== 'string') return null

  const normalized = raw.trim().toLowerCase()

  // Common legacy values
  if (normalized === 'sub') return 'sub_account'

  if (
    normalized === 'admin' ||
    normalized === 'user' ||
    normalized === 'contact' ||
    normalized === 'sub_account'
  ) {
    return normalized
  }

  return null
}

