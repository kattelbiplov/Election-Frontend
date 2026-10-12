import { useAuthStore } from '../store/authStore'
import { hasPermission, type Permission } from '../lib/permissions'

export function usePermission(permission: Permission): boolean {
  const role = useAuthStore((state) => state.user?.role)
  return hasPermission(role, permission)
}

export function useCurrentUser() {
  return useAuthStore((state) => state.user)
}
