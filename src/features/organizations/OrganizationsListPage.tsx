import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, Pencil, Plus, ShieldOff, ShieldCheck } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Table, THead, TH, TBody, TR, TD } from '../../components/ui/Table'
import { TableSkeleton } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { Pagination } from '../../components/ui/Pagination'
import { SearchInput } from '../../components/ui/SearchInput'
import { Button } from '../../components/ui/Button'
import { StatusBadge } from '../../components/ui/Badge'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { CreateOrganizationModal } from './CreateOrganizationModal'
import { EditOrganizationModal } from './EditOrganizationModal'
import { listOrganizations, updateOrganization } from '../../lib/api/organizations'
import { queryKeys } from '../../lib/queryKeys'
import { useDebounce } from '../../hooks/useDebounce'
import { formatDate } from '../../lib/utils'
import { toast } from '../../store/toastStore'
import { getApiErrorMessage } from '../../lib/api/client'
import type { Organization } from '../../lib/types'

export function OrganizationsListPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search)
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Organization | null>(null)
  const [statusTarget, setStatusTarget] = useState<Organization | null>(null)

  const queryClient = useQueryClient()
  const params = { page, pageSize: 20, search: debouncedSearch || undefined }
  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: queryKeys.organizations(params),
    queryFn: () => listOrganizations(params),
    placeholderData: (prev) => prev,
  })

  const statusMutation = useMutation({
    mutationFn: (org: Organization) =>
      updateOrganization(org.id, { status: org.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' }),
    onSuccess: (_data, org) => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      toast.success(org.status === 'ACTIVE' ? 'Organization suspended' : 'Organization activated')
      setStatusTarget(null)
    },
    onError: (err) => toast.error('Could not update status', getApiErrorMessage(err)),
  })

  return (
    <div>
      <PageHeader
        title="Organizations"
        description="Every campaign tenant on the platform."
        actions={
          <Button icon={<Plus className="size-4" />} onClick={() => setCreateOpen(true)}>
            New organization
          </Button>
        }
      />

      <Card>
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Search organizations..." />
        </div>

        {isLoading ? (
          <TableSkeleton cols={4} />
        ) : !data?.items.length ? (
          <EmptyState
            icon={<Building2 className="size-6" />}
            title="No organizations found"
            description={search ? 'Try a different search term.' : 'Create the first campaign organization to get started.'}
          />
        ) : (
          <div className={isPlaceholderData ? 'opacity-60 transition-opacity' : ''}>
            <Table>
              <THead>
                <TH>Name</TH>
                <TH>Slug</TH>
                <TH>Status</TH>
                <TH>Created</TH>
                <TH className="text-right">Actions</TH>
              </THead>
              <TBody>
                {data.items.map((org) => (
                  <TR key={org.id}>
                    <TD className="font-medium">{org.name}</TD>
                    <TD className="font-mono text-[12.5px] text-text-secondary">{org.slug}</TD>
                    <TD>
                      <StatusBadge status={org.status} />
                    </TD>
                    <TD className="text-text-secondary">{formatDate(org.createdAt)}</TD>
                    <TD>
                      <div className="flex justify-end gap-1.5">
                        <Button variant="ghost" size="sm" icon={<Pencil className="size-3.5" />} onClick={() => setEditing(org)}>
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={org.status === 'ACTIVE' ? <ShieldOff className="size-3.5" /> : <ShieldCheck className="size-3.5" />}
                          onClick={() => setStatusTarget(org)}
                          className={org.status === 'ACTIVE' ? 'text-danger hover:bg-danger-bg' : 'text-success hover:bg-success-bg'}
                        >
                          {org.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                        </Button>
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

      <CreateOrganizationModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <EditOrganizationModal organization={editing} onClose={() => setEditing(null)} />
      <ConfirmDialog
        open={!!statusTarget}
        onClose={() => setStatusTarget(null)}
        onConfirm={() => statusTarget && statusMutation.mutate(statusTarget)}
        title={statusTarget?.status === 'ACTIVE' ? 'Suspend organization?' : 'Activate organization?'}
        description={
          statusTarget?.status === 'ACTIVE'
            ? `${statusTarget?.name} and its users will lose access immediately on their next token refresh.`
            : `${statusTarget?.name} will regain access to the platform.`
        }
        confirmLabel={statusTarget?.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
        destructive={statusTarget?.status === 'ACTIVE'}
        loading={statusMutation.isPending}
      />
    </div>
  )
}
