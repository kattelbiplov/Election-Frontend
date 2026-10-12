import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Compass, Home, Map, Pencil, Plus, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Table, THead, TH, TBody, TR, TD } from '../../components/ui/Table'
import { TableSkeleton } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { Pagination } from '../../components/ui/Pagination'
import { SearchInput } from '../../components/ui/SearchInput'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { WardLabel, ToleLabel } from '../../components/geo/GeoLabel'
import { HouseholdModal } from './HouseholdModal'
import { listHouseholds, deleteHousehold } from '../../lib/api/households'
import { queryKeys } from '../../lib/queryKeys'
import { useDebounce } from '../../hooks/useDebounce'
import { usePermission } from '../../hooks/usePermission'
import { toast } from '../../store/toastStore'
import { getApiErrorMessage } from '../../lib/api/client'
import type { Household } from '../../lib/types'

export function HouseholdsListPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search)

  const [editing, setEditing] = useState<Household | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<Household | null>(null)

  const canCreate = usePermission('household:create')
  const canUpdate = usePermission('household:update')
  const canDelete = usePermission('household:delete')
  const queryClient = useQueryClient()

  const params = { page, pageSize: 20, search: debouncedSearch || undefined }
  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: queryKeys.households(params),
    queryFn: () => listHouseholds(params),
    placeholderData: (prev) => prev,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteHousehold(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['households'] })
      toast.success('Household deleted')
      setDeleting(null)
    },
    onError: (err) => toast.error('Could not delete household', getApiErrorMessage(err)),
  })

  return (
    <div>
      <PageHeader
        title="Households"
        description="Addresses your team has recorded — voters can optionally link to one."
        actions={
          <>
            <Link to="/map">
              <Button variant="secondary" icon={<Map className="size-4" />}>
                Map view
              </Button>
            </Link>
            <Link to="/households/search">
              <Button variant="secondary" icon={<Compass className="size-4" />}>
                Spatial search
              </Button>
            </Link>
            {canCreate && (
              <Button icon={<Plus className="size-4" />} onClick={() => setCreating(true)}>
                New household
              </Button>
            )}
          </>
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Search by address..." />
        </div>

        {isLoading ? (
          <TableSkeleton cols={4} />
        ) : !data?.items.length ? (
          <EmptyState
            icon={<Home className="size-6" />}
            title="No households found"
            description={search ? 'Try a different search.' : 'Add your first household to get started.'}
          />
        ) : (
          <div className={isPlaceholderData ? 'opacity-60 transition-opacity' : ''}>
            <Table>
              <THead>
                <TH>Address</TH>
                <TH>Location</TH>
                <TH>Coordinates</TH>
                <TH className="text-right">Actions</TH>
              </THead>
              <TBody>
                {data.items.map((household) => (
                  <TR key={household.id}>
                    <TD>
                      <p className="font-medium">{household.address}</p>
                      {household.landmark && <p className="text-[12.5px] text-text-secondary">{household.landmark}</p>}
                    </TD>
                    <TD className="text-text-secondary">
                      <WardLabel wardId={household.wardId} />
                      {household.toleId && (
                        <span>
                          {' '}
                          · <ToleLabel toleId={household.toleId} />
                        </span>
                      )}
                    </TD>
                    <TD className="text-text-secondary">
                      {household.centerLat != null && household.centerLng != null
                        ? `${household.centerLat.toFixed(4)}, ${household.centerLng.toFixed(4)}`
                        : '—'}
                    </TD>
                    <TD>
                      <div className="flex justify-end gap-1.5">
                        {canUpdate && (
                          <Button variant="ghost" size="sm" icon={<Pencil className="size-3.5" />} onClick={() => setEditing(household)}>
                            Edit
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Trash2 className="size-3.5" />}
                            className="text-danger hover:bg-danger-bg"
                            onClick={() => setDeleting(household)}
                          >
                            Delete
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

      <HouseholdModal open={creating} household={null} onClose={() => setCreating(false)} />
      <HouseholdModal open={!!editing} household={editing} onClose={() => setEditing(null)} />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        title="Delete household?"
        description={`"${deleting?.address}" will be removed. Voters linked to it keep their own address and aren't deleted.`}
        confirmLabel="Delete"
        destructive
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
