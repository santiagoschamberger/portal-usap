/**
 * Fetch wrapper that automatically includes impersonation headers
 * Use this instead of raw fetch() calls to ensure impersonation works correctly
 */

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>
}

/**
 * Get impersonation headers if impersonation is active
 */
function getImpersonationHeaders(): Record<string, string> {
  try {
    const persisted = localStorage.getItem('auth-store')
    if (!persisted) return {}

    const parsed = JSON.parse(persisted) as { state?: any }
    const state = parsed?.state
    const isImpersonating = Boolean(state?.isImpersonating)
    const impersonatedUserId = state?.user?.id as string | undefined

    if (isImpersonating && impersonatedUserId) {
      return { 'X-Impersonate-User-Id': impersonatedUserId }
    }
  } catch {
    // Ignore malformed state
  }

  return {}
}

/**
 * Fetch with automatic impersonation header support
 * Merges impersonation headers with provided headers
 */
export async function fetchWithImpersonation(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const impersonationHeaders = getImpersonationHeaders()
  
  const mergedOptions: FetchOptions = {
    ...options,
    headers: {
      ...options.headers,
      ...impersonationHeaders,
    },
  }

  return fetch(url, mergedOptions)
}

/**
 * Get auth headers including token and impersonation
 */
export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('token')
  const impersonationHeaders = getImpersonationHeaders()

  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...impersonationHeaders,
  }
}
