import { useState } from 'react'
import type { ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, MessageSquarePlus, Pencil, Trash2 } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Table, THead, TH, TBody, TR, TD } from '../../components/ui/Table'
import { TableSkeleton, Skeleton } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { Pagination } from '../../components/ui/Pagination'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { Badge, StatusBadge } from '../../components/ui/Badge'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Breadcrumbs } from '../../components/ui/Breadcrumbs'
import { WardLabel, ToleLabel } from '../../components/geo/GeoLabel'
import { UserLabel } from '../../components/users/UserLabel'
import { HouseholdLabel } from '../../components/households/HouseholdLabel'
import { VoterModal } from './VoterModal'
import { ContactModal } from './ContactModal'
import {
  GENDER_LABELS,
  SUPPORT_LEVEL_LABELS,
  SUPPORT_LEVEL_TONE,
  CONTACT_METHOD_LABELS,
  CONTACT_OUTCOME_LABELS,
  CONTACT_OUTCOME_TONE,
  contactMethodOptions,
  contactOutcomeOptions,
} from './schemas'
import { getVoter, deleteVoter, listVoterContacts } from '../../lib/api/voters'
import { queryKeys } from '../../lib/queryKeys'
import { usePermission } from '../../hooks/usePermission'
import { formatDate, formatDateTime } from '../../lib/utils'
import { toast } from '../../store/toastStore'
import { getApiErrorMessage } from '../../lib/api/client'
import type { ContactMethod, ContactOutcome } from '../../lib/types'

export function VoterDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const canUpdate = usePermission('voter:update')
  const canDelete = usePermission('voter:delete')

  const [page, setPage] = useState(1)
  const [method, setMethod] = useState<ContactMethod | ''>('')
  const [outcome, setOutcome] = useState<ContactOutcome | ''>('')
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [loggingContact, setLoggingContact] = useState(false)

  const voter = useQuery({
    queryKey: queryKeys.voter(id!),
    queryFn: () => getVoter(id!),
  })

  const contactsParams = { page, pageSize: 20, method: method || undefined, outcome: outcome || undefined }
  const contacts = useQuery({
    queryKey: queryKeys.voterContacts(id!, contactsParams),
    queryFn: () => listVoterContacts(id!, contactsParams),
    placeholderData: (prev) => prev,
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteVoter(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voters'] })
      toast.success('Voter deleted')
      navigate('/voters')
    },
    onError: (err) => toast.error('Could not delete voter', getApiErrorMessage(err)),
  })

  return (
    <div>
      <PageHeader
        title={voter.data?.fullName ?? 'Voter'}
        breadcrumb={
          <Breadcrumbs items={[{ label: 'Voters', onClick: () => navigate('/voters') }, { label: voter.data?.fullName ?? '…' }]} />
        }
        actions={
          voter.data && (
            <>
              {canUpdate && (
                <Button variant="secondary" icon={<MessageSquarePlus className="size-4" />} onClick={() => setLoggingContact(true)}>
                  Log contact
                </Button>
              )}
              {canUpdate && (
                <Button variant="secondary" icon={<Pencil className="size-4" />} onClick={() => setEditing(true)}>
                  Edit
                </Button>
              )}
              {canDelete && (
                <Button variant="danger" icon={<Trash2 className="size-4" />} onClick={() => setDeleting(true)}>
                  Delete
                </Button>
              )}
            </>
          )
        }
      />

      <div className="flex flex-col gap-5">
        <Card>
          <CardHeader
            title="Summary"
            action={
              voter.data && (
                <div className="flex items-center gap-2">
                  <StatusBadge status={voter.data.status} />
                  <Badge tone={SUPPORT_LEVEL_TONE[voter.data.supportLevel]}>{SUPPORT_LEVEL_LABELS[voter.data.supportLevel]}</Badge>
                </div>
              )
            }
          />
          <CardBody>
            {voter.isLoading ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : !voter.data ? (
              <EmptyState icon={<AlertTriangle className="size-6" />} title="Voter not found" />
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
                <Field label="Date of birth">{formatDate(voter.data.dateOfBirth)}</Field>
                <Field label="Gender">{voter.data.gender ? GENDER_LABELS[voter.data.gender] : '—'}</Field>
                <Field label="Ward">
                  <WardLabel wardId={voter.data.wardId} />
                </Field>
                <Field label="Tole">{voter.data.toleId ? <ToleLabel toleId={voter.data.toleId} /> : '—'}</Field>
                <Field label="Household">{voter.data.householdId ? <HouseholdLabel householdId={voter.data.householdId} /> : '—'}</Field>
                <Field label="Father / spouse">{voter.data.fatherOrSpouseName ?? '—'}</Field>
                <Field label="Phone">{voter.data.phone ?? '—'}</Field>
                <Field label="Occupation">{voter.data.occupation ?? '—'}</Field>
                <Field label="Address">{voter.data.address ?? '—'}</Field>
                <Field label="Citizenship number">{voter.data.citizenshipNumber ?? '—'}</Field>
                <Field label="Voter ID number">{voter.data.voterIdNumber ?? '—'}</Field>
                <Field label="Source">{voter.data.source === 'IMPORT' ? 'Imported' : 'Manual'}</Field>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-[13.5px] font-semibold text-text">Contact history</h2>
            <div className="flex gap-2">
              <Select
                value={method}
                onChange={(e) => {
                  setMethod(e.target.value as ContactMethod | '')
                  setPage(1)
                }}
                className="sm:w-40"
              >
                <option value="">All methods</option>
                {contactMethodOptions.map((m) => (
                  <option key={m} value={m}>
                    {CONTACT_METHOD_LABELS[m]}
                  </option>
                ))}
              </Select>
              <Select
                value={outcome}
                onChange={(e) => {
                  setOutcome(e.target.value as ContactOutcome | '')
                  setPage(1)
                }}
                className="sm:w-44"
              >
                <option value="">All outcomes</option>
                {contactOutcomeOptions.map((o) => (
                  <option key={o} value={o}>
                    {CONTACT_OUTCOME_LABELS[o]}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {contacts.isLoading ? (
            <TableSkeleton cols={5} />
          ) : !contacts.data?.items.length ? (
            <EmptyState
              title="No contacts logged"
              description={method || outcome ? 'Try a different filter.' : "Nothing's been logged for this voter yet."}
            />
          ) : (
            <>
              <Table>
                <THead>
                  <TH>When</TH>
                  <TH>Method</TH>
                  <TH>Outcome</TH>
                  <TH>Support observed</TH>
                  <TH>Notes</TH>
                  <TH>Logged by</TH>
                </THead>
                <TBody>
                  {contacts.data.items.map((contact) => (
                    <TR key={contact.id}>
                      <TD className="text-text-secondary">{formatDateTime(contact.contactedAt)}</TD>
                      <TD>{CONTACT_METHOD_LABELS[contact.method]}</TD>
                      <TD>
                        <Badge tone={CONTACT_OUTCOME_TONE[contact.outcome]}>{CONTACT_OUTCOME_LABELS[contact.outcome]}</Badge>
                      </TD>
                      <TD className="text-text-secondary">
                        {contact.supportLevelObserved ? SUPPORT_LEVEL_LABELS[contact.supportLevelObserved] : '—'}
                      </TD>
                      <TD className="max-w-xs truncate text-text-secondary">{contact.notes ?? '—'}</TD>
                      <TD className="text-text-secondary">
                        <UserLabel userId={contact.contactedById} />
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
              <Pagination pagination={contacts.data.pagination} onPageChange={setPage} />
            </>
          )}
        </Card>
      </div>

      {voter.data && <VoterModal open={editing} voter={voter.data} onClose={() => setEditing(false)} />}
      {id && <ContactModal voterId={id} open={loggingContact} onClose={() => setLoggingContact(false)} />}
      <ConfirmDialog
        open={deleting}
        onClose={() => setDeleting(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete voter?"
        description={`"${voter.data?.fullName}" will be removed from the roll. To mark someone deceased or moved instead, edit their status.`}
        confirmLabel="Delete"
        destructive
        loading={deleteMutation.isPending}
      />
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-[12px] text-text-secondary">{label}</p>
      <p className="mt-0.5 text-[13.5px] font-medium text-text">{children}</p>
    </div>
  )
}
