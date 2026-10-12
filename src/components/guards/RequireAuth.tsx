import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { PageSpinner } from '../ui/Spinner'

export function RequireAuth() {
  const hydrated = useAuthStore((s) => s.hydrated)
  const user = useAuthStore((s) => s.user)
  const location = useLocation()

  if (!hydrated) return <PageSpinner />

  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?redirect=${redirect}`} replace />
  }

  return <Outlet />
}
