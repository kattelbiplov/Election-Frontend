import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../lib/types'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  /** True once the boot-time silent refresh has resolved (success or failure). */
  hydrated: boolean
  setSession: (session: { user: User; accessToken: string; refreshToken: string }) => void
  setAccessToken: (accessToken: string) => void
  setRefreshToken: (refreshToken: string) => void
  setHydrated: (hydrated: boolean) => void
  clear: () => void
}

// Per docs/00-overview.md's security note: access tokens are short-lived JWTs meant to sit in
// memory only. Only the refreshToken is persisted, and only it is used to silently re-establish
// a session (and a fresh accessToken) on app boot / hard refresh.
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      hydrated: false,
      setSession: ({ user, accessToken, refreshToken }) =>
        set({ user, accessToken, refreshToken }),
      setAccessToken: (accessToken) => set({ accessToken }),
      setRefreshToken: (refreshToken) => set({ refreshToken }),
      setHydrated: (hydrated) => set({ hydrated }),
      clear: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    {
      name: 'election-ops-auth',
      partialize: (state) => ({ refreshToken: state.refreshToken }),
    },
  ),
)
