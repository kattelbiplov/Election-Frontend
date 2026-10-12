import { useState } from 'react'
import type { ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, Pencil, Trash2, XCircle } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Table, THead, TH, TBody, TR, TD } from '../../components/ui/Table'
import { TableSkeleton, Skeleton } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { Pagination } from '../../components/ui/Pagination'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Breadcrumbs } from '../../components/ui/Breadcrumbs'
import { WardLabel, ToleLabel } from '../../components/geo/GeoLabel'
import { UserLabel } from '../../components/users/UserLabel'
import { HouseholdLabel } from '../../components/households/HouseholdLabel'
import { TaskModal } from './TaskModal'
import { VisitModal } from './VisitModal'
import { TASK_STATUS_LABELS, TASK_STATUS_TONE, VISIT_OUTCOME_LABELS, VISIT_OUTCOME_TONE, visitOutcomeOptions } from './schemas'
import { getTask, listVisits, updateTask, deleteTask } from '../../lib/api/tasks'
import { queryKeys } from '../../lib/queryKeys'
import { usePermission } from '../../hooks/usePermission'
import { formatDate, formatDateTime } from '../../lib/utils'
import { toast } from '../../store/toastStore'
import { getApiErrorMessage } from '../../lib/api/client'
import type { CanvassingVisit, VisitOutcome } from '../../lib/types'

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const canUpdate = usePermission('task:update')
  const canDelete = usePermission('task:delete')
  const canRecordVisit = usePermission('task:visit_update')

  const [page, setPage] = useState(1)
  const [outcome, setOutcome] = useState<VisitOutcome | ''>('')
  const [editing, setEditing] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [recordingVisit, setRecordingVisit] = useState<CanvassingVisit | null>(null)

  const task = useQuery({
    queryKey: queryKeys.task(id!),
    queryFn: () => getTask(id!),
  })

  const visitsParams = { page, pageSize: 25, outcome: outcome || undefined }
  const visits = useQuery({
    queryKey: queryKeys.taskVisits(id!, visitsParams),
    queryFn: () => listVisits(id!, visitsParams),
    placeholderData: (prev) => prev,
  })

  const cancelMutation = useMutation({
    mutationFn: () => updateTask(id!, { status: 'CANCELLED' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.task(id!) })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task cancelled')
      setCancelling(false)
    },
    onError: (err) => toast.error('Could not cancel task', getApiErrorMessage(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteTask(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task deleted')
      navigate('/tasks')
    },
    onError: (err) => toast.error('Could not delete task', getApiErrorMessage(err)),
  })

  const canCancel = task.data && task.data.status !== 'CANCELLED' && task.data.status !== 'COMPLETED'

  return (
    <div>
      <PageHeader
        title={task.data?.title ?? 'Task'}
        breadcrumb={
          <Breadcrumbs items={[{ label: 'Tasks', onClick: () => navigate('/tasks') }, { label: task.data?.title ?? '…' }]} />
        }
        actions={
          task.data && (
            <>
              {canUpdate && canCancel && (
                <Button variant="secondary" icon={<XCircle className="size-4" />} onClick={() => setCancelling(true)}>
                  Cancel task
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
            action={task.data && <Badge tone={TASK_STATUS_TONE[task.data.status]}>{TASK_STATUS_LABELS[task.data.status]}</Badge>}
          />
          <CardBody>
            {task.isLoading ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : !task.data ? (
              <EmptyState icon={<AlertTriangle className="size-6" />} title="Task not found" />
            ) : (
              <div className="flex flex-col gap-5">
                {task.data.description && <p className="text-[13.5px] text-text-secondary">{task.data.description}</p>}
                <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
                  <Field label="Ward">
                    <WardLabel wardId={task.data.wardId} />
                  </Field>
                  <Field label="Tole">{task.data.toleId ? <ToleLabel toleId={task.data.toleId} /> : 'Whole ward'}</Field>
                  <Field label="Assignee">
                    <UserLabel userId={task.data.assignedToId} />
                  </Field>
                  <Field label="Due date">{task.data.dueDate ? formatDate(task.data.dueDate) : '—'}</Field>
                  <Field label="Total households">{task.data.visitSummary.total}</Field>
                  <Field label="Visited">
                    <span className="text-success">{task.data.visitSummary.visited}</span>
                  </Field>
                  <Field label="Not home / Refused">
                    <span className="text-warning">
                      {task.data.visitSummary.notHome} / {task.data.visitSummary.refused}
                    </span>
                  </Field>
                  <Field label="Pending">{task.data.visitSummary.pending}</Field>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-[13.5px] font-semibold text-text">Households</h2>
            <Select
              value={outcome}
              onChange={(e) => {
                setOutcome(e.target.value as VisitOutcome | '')
                setPage(1)
              }}
              className="sm:w-52"
            >
              <option value="">All outcomes</option>
              {visitOutcomeOptions.map((o) => (
                <option key={o} value={o}>
                  {VISIT_OUTCOME_LABELS[o]}
                </option>
              ))}
            </Select>
          </div>

          {visits.isLoading ? (
            <TableSkeleton cols={5} />
          ) : !visits.data?.items.length ? (
            <EmptyState title="No households" description="Nothing matches this filter." />
          ) : (
            <>
              <Table>
                <THead>
                  <TH>Household</TH>
                  <TH>Outcome</TH>
                  <TH>Notes</TH>
                  <TH>Visited</TH>
                  {canRecordVisit && <TH className="text-right">Actions</TH>}
                </THead>
                <TBody>
                  {visits.data.items.map((visit) => (
                    <TR key={visit.id}>
                      <TD className="font-medium">
                        <HouseholdLabel householdId={visit.householdId} />
                      </TD>
                      <TD>
                        <Badge tone={VISIT_OUTCOME_TONE[visit.outcome]}>{VISIT_OUTCOME_LABELS[visit.outcome]}</Badge>
                      </TD>
                      <TD className="max-w-xs truncate text-text-secondary">{visit.notes ?? '—'}</TD>
                      <TD className="text-text-secondary">
                        {visit.visitedAt ? (
                          <>
                            {formatDateTime(visit.visitedAt)}
                            {visit.visitedById && (
                              <>
                                {' '}
                                · <UserLabel userId={visit.visitedById} />
                              </>
                            )}
                          </>
                        ) : (
                          '—'
                        )}
                      </TD>
                      {canRecordVisit && (
                        <TD>
                          <div className="flex justify-end">
                            <Button variant="ghost" size="sm" onClick={() => setRecordingVisit(visit)}>
                              Update
                            </Button>
                          </div>
                        </TD>
                      )}
                    </TR>
                  ))}
                </TBody>
              </Table>
              <Pagination pagination={visits.data.pagination} onPageChange={setPage} />
            </>
          )}
        </Card>
      </div>

      {task.data && <TaskModal open={editing} task={task.data} onClose={() => setEditing(false)} />}
      <VisitModal taskId={id!} visit={recordingVisit} onClose={() => setRecordingVisit(null)} />
      <ConfirmDialog
        open={cancelling}
        onClose={() => setCancelling(false)}
        onConfirm={() => cancelMutation.mutate()}
        title="Cancel task?"
        description="Visit updates on it will stop being accepted. This can't be undone — create a new task if the work still needs doing."
        confirmLabel="Cancel task"
        destructive
        loading={cancelMutation.isPending}
      />
      <ConfirmDialog
        open={deleting}
        onClose={() => setDeleting(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete task?"
        description="This task and its visit records will be removed. This can't be undone."
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
