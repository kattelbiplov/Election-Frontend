import { fetchMe, refreshSession } from '../../lib/api/auth'
import { useAuthStore } from '../../store/authStore'

async function runBootstrap(): Promise<void> {
  const { refreshToken, setSession, setAccessToken, clear, setHydrated } = useAuthStore.getState()

  if (!refreshToken) {
    setHydrated(true)
    return
  }

  try {
    const next = await refreshSession(refreshToken)
    setAccessToken(next.accessToken)
    const user = await fetchMe()
    setSession({ user, accessToken: next.accessToken, refreshToken: next.refreshToken })
  } catch {
    clear()
  } finally {
    setHydrated(true)
  }
}

// React StrictMode double-invokes effects in dev, so App.tsx's `useEffect(() => bootstrapAuth())`
// can fire twice back to back. Refresh tokens are single-use (they rotate on every call), so two
// concurrent calls would both read the same stored token — one 200s and rotates it, the other
// 401s on the now-stale token and clears the session the first call just established. Share one
// in-flight bootstrap the same way client.ts dedupes concurrent 401 retries.
let bootstrapPromise: Promise<void> | null = null

/**
 * Runs once on app boot. Only the refreshToken survives a hard refresh (see authStore.ts), so
 * we exchange it for a fresh accessToken, then fetch the user (the refresh endpoint itself
 * returns tokens only, no user payload).
 */
export function bootstrapAuth(): Promise<void> {
  bootstrapPromise ??= runBootstrap().finally(() => {
    bootstrapPromise = null
  })
  return bootstrapPromise
}
