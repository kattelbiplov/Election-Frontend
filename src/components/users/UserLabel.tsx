import { useQuery } from '@tanstack/react-query'
import { getUser } from '../../lib/api/users'
import { queryKeys } from '../../lib/queryKeys'
import { usePermission, useCurrentUser } from '../../hooks/usePermission'
import { Skeleton } from '../ui/Skeleton'

// GET /users/{id} requires `users:read`, which FIELD_WORKER/VOLUNTEER/VIEW_ONLY don't have —
// they'd 403 fetching even their own record. Since a FIELD_WORKER/VOLUNTEER's tasks are always
// assigned to themselves, resolve that case from the session instead of calling the API.
export function UserLabel({ userId }: { userId: string }) {
  const canRead = usePermission('users:read')
  const currentUser = useCurrentUser()
  const isSelf = currentUser?.id === userId

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.user(userId),
    queryFn: () => getUser(userId),
    staleTime: 5 * 60_000,
    enabled: canRead && !isSelf,
  })

  if (isSelf && currentUser) return <span>{currentUser.name} (you)</span>
  if (!canRead) return <span className="text-text-muted">—</span>
  if (isLoading) return <Skeleton className="h-4 w-20" />
  if (!data) return <span className="text-text-muted">Unknown user</span>
  return <span>{data.name}</span>
}
