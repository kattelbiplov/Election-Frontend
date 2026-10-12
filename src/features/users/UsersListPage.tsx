import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MapPinned, Pencil, Plus, UserX, Users as UsersIcon } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Table, THead, TH, TBody, TR, TD } from '../../components/ui/Table'
import { TableSkeleton } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { Pagination } from '../../components/ui/Pagination'
import { SearchInput } from '../../components/ui/SearchInput'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { StatusBadge, RoleBadge } from '../../components/ui/Badge'
import { Avatar } from '../../components/ui/Avatar'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { CreateUserModal } from './CreateUserModal'
import { EditUserModal } from './EditUserModal'
import { AssignmentsModal } from './AssignmentsModal'
import { listUsers, deactivateUser } from '../../lib/api/users'
import { queryKeys } from '../../lib/queryKeys'
import { useDebounce } from '../../hooks/useDebounce'
import { usePermission, useCurrentUser } from '../../hooks/usePermission'
import { ROLE_LABELS } from '../../lib/permissions'
import { formatRelativeTime } from '../../lib/utils'
import { toast } from '../../store/toastStore'
import { getApiErrorMessage } from '../../lib/api/client'
import type { User, UserRole, UserStatus } from '../../lib/types'

export function UsersListPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState<UserRole | ''>('')
  const [status, setStatus] = useState<UserStatus | ''>('')
  const debouncedSearch = useDebounce(search)

  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [assigning, setAssigning] = useState<User | null>(null)
  const [deactivating, setDeactivating] = useState<User | null>(null)

  const currentUser = useCurrentUser()
  const canManage = usePermission('users:manage')
  const canAssign = usePermission('users:assign')
  const queryClient = useQueryClient()

  const params = {
    page,
    pageSize: 20,
    search: debouncedSearch || undefined,
    role: role || undefined,
    status: status || undefined,
  }
  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: queryKeys.users(params),
    queryFn: () => listUsers(params),
    placeholderData: (prev) => prev,
  })

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => deactivateUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('User deactivated')
      setDeactivating(null)
    },
    onError: (err) => toast.error('Could not deactivate user', getApiErrorMessage(err)),
  })

  return (
    <div>
      <PageHeader
        title="Users"
        description="Everyone with access to your organization."
        actions={
          canManage && (
            <Button icon={<Plus className="size-4" />} onClick={() => setCreateOpen(true)}>
              New user
            </Button>
          )
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Search by name or email..." />
          <div className="flex gap-2">
            <Select value={role} onChange={(e) => { setRole(e.target.value as UserRole | ''); setPage(1) }} className="sm:w-44">
              <option value="">All roles</option>
              {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </Select>
            <Select value={status} onChange={(e) => { setStatus(e.target.value as UserStatus | ''); setPage(1) }} className="sm:w-36">
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="INVITED">Invited</option>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <TableSkeleton cols={5} />
        ) : !data?.items.length ? (
          <EmptyState
            icon={<UsersIcon className="size-6" />}
            title="No users found"
            description={search || role || status ? 'Try adjusting your filters.' : 'Add your first team member to get started.'}
          />
        ) : (
          <div className={isPlaceholderData ? 'opacity-60 transition-opacity' : ''}>
            <Table>
              <THead>
                <TH>Name</TH>
                <TH>Role</TH>
                <TH>Status</TH>
                <TH>Last login</TH>
                <TH className="text-right">Actions</TH>
              </THead>
              <TBody>
                {data.items.map((user) => (
                  <TR key={user.id}>
                    <TD>
                      <div className="flex items-center gap-3">
                        <Avatar name={user.name} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{user.name}</p>
                          <p className="truncate text-[12.5px] text-text-secondary">{user.email}</p>
                        </div>
                      </div>
                    </TD>
                    <TD>
                      <RoleBadge role={user.role} label={ROLE_LABELS[user.role]} />
                    </TD>
                    <TD>
                      <StatusBadge status={user.status} />
                    </TD>
                    <TD className="text-text-secondary">{formatRelativeTime(user.lastLoginAt)}</TD>
                    <TD>
                      <div className="flex justify-end gap-1.5">
                        {canAssign && ['WARD_MANAGER', 'TOLE_COORDINATOR', 'FIELD_WORKER', 'VOLUNTEER'].includes(user.role) && (
                          <Button variant="ghost" size="sm" icon={<MapPinned className="size-3.5" />} onClick={() => setAssigning(user)}>
                            Assign
                          </Button>
                        )}
                        {canManage && (
                          <Button variant="ghost" size="sm" icon={<Pencil className="size-3.5" />} onClick={() => setEditing(user)}>
                            Edit
                          </Button>
                        )}
                        {canManage && user.id !== currentUser?.id && user.status !== 'SUSPENDED' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<UserX className="size-3.5" />}
                            className="text-danger hover:bg-danger-bg"
                            onClick={() => setDeactivating(user)}
                          >
                            Deactivate
                          </Button>
                        )}
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <Pagination pagination={data.pagination} onPageChange={setPage} />
          </div>
        )}
      </Card>

      <CreateUserModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <EditUserModal user={editing} onClose={() => setEditing(null)} />
      <AssignmentsModal user={assigning} onClose={() => setAssigning(null)} />
      <ConfirmDialog
        open={!!deactivating}
        onClose={() => setDeactivating(null)}
        onConfirm={() => deactivating && deactivateMutation.mutate(deactivating.id)}
        title="Deactivate user?"
        description={`${deactivating?.name} will immediately lose the ability to sign in. This can be reversed by setting their status back to Active.`}
        confirmLabel="Deactivate"
        destructive
        loading={deactivateMutation.isPending}
      />
    </div>
  )
}
