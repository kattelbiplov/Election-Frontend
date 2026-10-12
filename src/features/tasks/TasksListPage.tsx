import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, Pencil, Plus, Trash2, XCircle } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Table, THead, TH, TBody, TR, TD } from '../../components/ui/Table'
import { TableSkeleton } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { Pagination } from '../../components/ui/Pagination'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { WardLabel, ToleLabel } from '../../components/geo/GeoLabel'
import { UserLabel } from '../../components/users/UserLabel'
import { TaskModal } from './TaskModal'
import { TASK_STATUS_LABELS, TASK_STATUS_TONE, taskStatusOptions } from './schemas'
import { listTasks, updateTask, deleteTask } from '../../lib/api/tasks'
import { queryKeys } from '../../lib/queryKeys'
import { usePermission } from '../../hooks/usePermission'
import { formatDate } from '../../lib/utils'
import { toast } from '../../store/toastStore'
import { getApiErrorMessage } from '../../lib/api/client'
import type { CanvassingTask, TaskStatus } from '../../lib/types'

export function TasksListPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<TaskStatus | ''>('')

  const [editing, setEditing] = useState<CanvassingTask | null>(null)
  const [creating, setCreating] = useState(false)
  const [cancelling, setCancelling] = useState<CanvassingTask | null>(null)
  const [deleting, setDeleting] = useState<CanvassingTask | null>(null)

  const canCreate = usePermission('task:create')
  const canUpdate = usePermission('task:update')
  const canDelete = usePermission('task:delete')
  const queryClient = useQueryClient()

  const params = { page, pageSize: 20, status: status || undefined }
  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: queryKeys.tasks(params),
    queryFn: () => listTasks(params),
    placeholderData: (prev) => prev,
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => updateTask(id, { status: 'CANCELLED' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task cancelled')
      setCancelling(null)
    },
    onError: (err) => toast.error('Could not cancel task', getApiErrorMessage(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task deleted')
      setDeleting(null)
    },
    onError: (err) => toast.error('Could not delete task', getApiErrorMessage(err)),
  })

  return (
    <div>
      <PageHeader
        title="Canvassing Tasks"
        description={
          canCreate
            ? "Assign households to field workers and volunteers, and track who's visited whom."
            : "Your assigned canvassing work."
        }
        actions={
          canCreate && (
            <Button icon={<Plus className="size-4" />} onClick={() => setCreating(true)}>
              New task
            </Button>
          )
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-end">
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as TaskStatus | '')
              setPage(1)
            }}
            className="sm:w-48"
          >
            <option value="">All statuses</option>
            {taskStatusOptions.map((s) => (
              <option key={s} value={s}>
                {TASK_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </div>

        {isLoading ? (
          <TableSkeleton cols={6} />
        ) : !data?.items.length ? (
          <EmptyState
            icon={<ClipboardList className="size-6" />}
            title="No tasks found"
            description={status ? 'Try a different status.' : canCreate ? 'Create a task to get canvassing underway.' : "You don't have any assigned tasks yet."}
          />
        ) : (
          <div className={isPlaceholderData ? 'opacity-60 transition-opacity' : ''}>
            <Table>
              <THead>
                <TH>Title</TH>
                <TH>Location</TH>
                <TH>Assignee</TH>
                <TH>Progress</TH>
                <TH>Due</TH>
                <TH>Status</TH>
                <TH className="text-right">Actions</TH>
              </THead>
              <TBody>
                {data.items.map((task) => (
                  <TR key={task.id} onClick={() => navigate(`/tasks/${task.id}`)}>
                    <TD className="font-medium">{task.title}</TD>
                    <TD className="text-text-secondary">
                      <WardLabel wardId={task.wardId} />
                      {task.toleId && (
                        <span>
                          {' '}
                          · <ToleLabel toleId={task.toleId} />
                        </span>
                      )}
                    </TD>
                    <TD className="text-text-secondary">
                      <UserLabel userId={task.assignedToId} />
                    </TD>
                    <TD className="text-text-secondary">
                      {task.visitSummary.total - task.visitSummary.pending}/{task.visitSummary.total} visited
                    </TD>
                    <TD className="text-text-secondary">{task.dueDate ? formatDate(task.dueDate) : '—'}</TD>
                    <TD>
                      <Badge tone={TASK_STATUS_TONE[task.status]}>{TASK_STATUS_LABELS[task.status]}</Badge>
                    </TD>
                    <TD onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1.5">
                        {canUpdate && task.status !== 'CANCELLED' && task.status !== 'COMPLETED' && (
                          <Button variant="ghost" size="sm" icon={<XCircle className="size-3.5" />} onClick={() => setCancelling(task)}>
                            Cancel
                          </Button>
                        )}
                        {canUpdate && (
                          <Button variant="ghost" size="sm" icon={<Pencil className="size-3.5" />} onClick={() => setEditing(task)}>
                            Edit
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Trash2 className="size-3.5" />}
                            className="text-danger hover:bg-danger-bg"
                            onClick={() => setDeleting(task)}
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

      <TaskModal open={creating} task={null} onClose={() => setCreating(false)} />
      <TaskModal open={!!editing} task={editing} onClose={() => setEditing(null)} />
      <ConfirmDialog
        open={!!cancelling}
        onClose={() => setCancelling(null)}
        onConfirm={() => cancelling && cancelMutation.mutate(cancelling.id)}
        title="Cancel task?"
        description={`"${cancelling?.title}" will be marked cancelled and visit updates on it will stop being accepted. This can't be undone — create a new task if the work still needs doing.`}
        confirmLabel="Cancel task"
        destructive
        loading={cancelMutation.isPending}
      />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        title="Delete task?"
        description={`"${deleting?.title}" and its visit records will be removed. This can't be undone.`}
        confirmLabel="Delete"
        destructive
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
