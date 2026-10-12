import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { usePermission } from '../../hooks/usePermission'
import { useCurrentUser } from '../../hooks/usePermission'
import type { Permission } from '../../lib/permissions'
import type { UserRole } from '../../lib/types'

export function RequirePermission({ permission, children }: { permission: Permission; children: ReactNode }) {
  const allowed = usePermission(permission)
  if (!allowed) return <Navigate to="/unauthorized" replace />
  return <>{children}</>
}

export function RequireRole({ roles, children }: { roles: UserRole[]; children: ReactNode }) {
  const user = useCurrentUser()
  if (!user || !roles.includes(user.role)) return <Navigate to="/unauthorized" replace />
  return <>{children}</>
}
