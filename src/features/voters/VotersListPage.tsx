import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { IdCard, Pencil, Plus, Trash2, Upload } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Table, THead, TH, TBody, TR, TD } from '../../components/ui/Table'
import { TableSkeleton } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { Pagination } from '../../components/ui/Pagination'
import { SearchInput } from '../../components/ui/SearchInput'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { Badge, StatusBadge } from '../../components/ui/Badge'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { WardLabel, ToleLabel } from '../../components/geo/GeoLabel'
import { VoterModal } from './VoterModal'
import {
  GENDER_LABELS,
  VOTER_STATUS_LABELS,
  SUPPORT_LEVEL_LABELS,
  SUPPORT_LEVEL_TONE,
  genderOptions,
  voterStatusOptions,
  supportLevelOptions,
} from './schemas'
import { listVoters, deleteVoter } from '../../lib/api/voters'
import { queryKeys } from '../../lib/queryKeys'
import { useDebounce } from '../../hooks/useDebounce'
import { usePermission } from '../../hooks/usePermission'
import { formatDate } from '../../lib/utils'
import { toast } from '../../store/toastStore'
import { getApiErrorMessage } from '../../lib/api/client'
import type { Gender, SupportLevel, Voter, VoterStatus } from '../../lib/types'

export function VotersListPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [gender, setGender] = useState<Gender | ''>('')
  const [status, setStatus] = useState<VoterStatus | ''>('')
  const [supportLevel, setSupportLevel] = useState<SupportLevel | ''>('')
  const debouncedSearch = useDebounce(search)

  const [editing, setEditing] = useState<Voter | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<Voter | null>(null)

  const canCreate = usePermission('voter:create')
  const canUpdate = usePermission('voter:update')
  const canDelete = usePermission('voter:delete')
  const canImport = usePermission('voter:import_read')
  const queryClient = useQueryClient()

  const params = {
    page,
    pageSize: 20,
    search: debouncedSearch || undefined,
    gender: gender || undefined,
    status: status || undefined,
    supportLevel: supportLevel || undefined,
  }
  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: queryKeys.voters(params),
    queryFn: () => listVoters(params),
    placeholderData: (prev) => prev,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteVoter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voters'] })
      toast.success('Voter deleted')
      setDeleting(null)
    },
    onError: (err) => toast.error('Could not delete voter', getApiErrorMessage(err)),
  })

  return (
    <div>
      <PageHeader
        title="Voters"
        description="The voter roll for your organization's assigned wards and toles."
        actions={
          <>
            {canImport && (
              <Link to="/voters/import">
                <Button variant="secondary" icon={<Upload className="size-4" />}>
                  Import
                </Button>
              </Link>
            )}
            {canCreate && (
              <Button icon={<Plus className="size-4" />} onClick={() => setCreating(true)}>
                New voter
              </Button>
            )}
          </>
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Search by name..." />
          <div className="flex gap-2">
            <Select value={gender} onChange={(e) => { setGender(e.target.value as Gender | ''); setPage(1) }} className="sm:w-36">
              <option value="">All genders</option>
              {genderOptions.map((g) => (
                <option key={g} value={g}>
                  {GENDER_LABELS[g]}
                </option>
              ))}
            </Select>
            <Select value={status} onChange={(e) => { setStatus(e.target.value as VoterStatus | ''); setPage(1) }} className="sm:w-36">
              <option value="">All statuses</option>
              {voterStatusOptions.map((s) => (
                <option key={s} value={s}>
                  {VOTER_STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
            <Select value={supportLevel} onChange={(e) => { setSupportLevel(e.target.value as SupportLevel | ''); setPage(1) }} className="sm:w-44">
              <option value="">All support levels</option>
              {supportLevelOptions.map((s) => (
                <option key={s} value={s}>
                  {SUPPORT_LEVEL_LABELS[s]}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {isLoading ? (
          <TableSkeleton cols={7} />
        ) : !data?.items.length ? (
          <EmptyState
            icon={<IdCard className="size-6" />}
            title="No voters found"
            description={search || gender || status || supportLevel ? 'Try adjusting your filters.' : 'Add your first voter, or import a ward roll from a spreadsheet.'}
          />
        ) : (
          <div className={isPlaceholderData ? 'opacity-60 transition-opacity' : ''}>
            <Table>
              <THead>
                <TH>Name</TH>
                <TH>Date of birth</TH>
                <TH>Gender</TH>
                <TH>Location</TH>
                <TH>Status</TH>
                <TH>Support</TH>
                <TH>Source</TH>
                <TH className="text-right">Actions</TH>
              </THead>
              <TBody>
                {data.items.map((voter) => (
                  <TR key={voter.id} onClick={() => navigate(`/voters/${voter.id}`)}>
                    <TD>
                      <p className="font-medium">{voter.fullName}</p>
                      {voter.fatherOrSpouseName && <p className="text-[12.5px] text-text-secondary">{voter.fatherOrSpouseName}</p>}
                    </TD>
                    <TD className="text-text-secondary">{formatDate(voter.dateOfBirth)}</TD>
                    <TD className="text-text-secondary">{voter.gender ? GENDER_LABELS[voter.gender] : '—'}</TD>
                    <TD className="text-text-secondary">
                      <WardLabel wardId={voter.wardId} />
                      {voter.toleId && (
                        <span>
                          {' '}
                          · <ToleLabel toleId={voter.toleId} />
                        </span>
                      )}
                    </TD>
                    <TD>
                      <StatusBadge status={voter.status} />
                    </TD>
                    <TD>
                      <Badge tone={SUPPORT_LEVEL_TONE[voter.supportLevel]}>{SUPPORT_LEVEL_LABELS[voter.supportLevel]}</Badge>
                    </TD>
                    <TD>
                      <Badge tone={voter.source === 'IMPORT' ? 'info' : 'neutral'}>
                        {voter.source === 'IMPORT' ? 'Imported' : 'Manual'}
                      </Badge>
                    </TD>
                    <TD onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1.5">
                        {canUpdate && (
                          <Button variant="ghost" size="sm" icon={<Pencil className="size-3.5" />} onClick={() => setEditing(voter)}>
                            Edit
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Trash2 className="size-3.5" />}
                            className="text-danger hover:bg-danger-bg"
                            onClick={() => setDeleting(voter)}
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

      <VoterModal open={creating} voter={null} onClose={() => setCreating(false)} />
      <VoterModal open={!!editing} voter={editing} onClose={() => setEditing(null)} />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        title="Delete voter?"
        description={`"${deleting?.fullName}" will be removed from the roll. To mark someone deceased or moved instead, edit their status.`}
        confirmLabel="Delete"
        destructive
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
