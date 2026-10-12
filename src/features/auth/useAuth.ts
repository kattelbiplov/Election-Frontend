import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import * as authApi from '../../lib/api/auth'
import { useAuthStore } from '../../store/authStore'
import { toast } from '../../store/toastStore'

export function useAuth() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const setSession = useAuthStore((s) => s.setSession)
  const clear = useAuthStore((s) => s.clear)

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { user, accessToken, refreshToken } = await authApi.login(email, password)
      setSession({ user, accessToken, refreshToken })
      const params = new URLSearchParams(window.location.search)
      navigate(params.get('redirect') || '/dashboard', { replace: true })
    },
    [navigate, setSession],
  )

  const signOut = useCallback(async () => {
    const refreshToken = useAuthStore.getState().refreshToken
    clear()
    queryClient.clear()
    navigate('/login', { replace: true })
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken)
      } catch {
        // best-effort — the local session is already cleared either way
      }
    }
    toast.info('Signed out')
  }, [clear, navigate, queryClient])

  return { signIn, signOut }
}
