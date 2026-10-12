import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckSquare, Square } from 'lucide-react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { FormField } from '../../components/ui/FormField'
import { SearchInput } from '../../components/ui/SearchInput'
import { GeoCascadePicker } from '../../components/geo/GeoCascadePicker'
import { WardLabel } from '../../components/geo/GeoLabel'
import { taskSchema, type TaskValues } from './schemas'
import { createTask, updateTask } from '../../lib/api/tasks'
import { listToles } from '../../lib/api/geo'
import { listUsers } from '../../lib/api/users'
import { listHouseholds } from '../../lib/api/households'
import { queryKeys } from '../../lib/queryKeys'
import { toast } from '../../store/toastStore'
import { getApiErrorMessage } from '../../lib/api/client'
import { cn } from '../../lib/utils'
import type { CanvassingTask } from '../../lib/types'

const emptyPicker = { provinceId: '', districtId: '', municipalityId: '', wardId: '' }
const ASSIGNABLE_ROLES = ['FIELD_WORKER', 'VOLUNTEER']

export function TaskModal({
  open,
  task,
  onClose,
}: {
  open: boolean
  task: CanvassingTask | null
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const isEdit = !!task

  const [picker, setPicker] = useState(emptyPicker)
  const [toleId, setToleId] = useState('')
  const [pickerError, setPickerError] = useState<string | undefined>()
  const [householdMode, setHouseholdMode] = useState<'all' | 'specific'>('all')
  const [selectedHouseholdIds, setSelectedHouseholdIds] = useState<Set<string>>(new Set())
  const [householdSearch, setHouseholdSearch] = useState('')
  const [householdError, setHouseholdError] = useState<string | undefined>()

  const wardId = isEdit ? task!.wardId : picker.wardId

  // This modal is kept mounted (with open=false) by its parent pages even for roles that can't
  // open it — e.g. TaskDetailPage always renders it so FIELD_WORKER/VOLUNTEER can be on the page
  // at all. Every query here must gate on `open`, or e.g. listUsers (needs users:read, which
  // those roles don't have) fires on mount and 403s before the modal is ever opened.
  const toles = useQuery({
    queryKey: queryKeys.toles({ wardId }),
    queryFn: () => listToles({ wardId, pageSize: 200 }),
    enabled: open && !!wardId,
  })

  const eligibleUsers = useQuery({
    queryKey: queryKeys.users({ wardId, pageSize: 200 }),
    queryFn: () => listUsers({ wardId, pageSize: 200 }),
    enabled: open && !!wardId,
  })
  const assignableUsers = (eligibleUsers.data?.items ?? []).filter(
    (u) => ASSIGNABLE_ROLES.includes(u.role) && u.status === 'ACTIVE',
  )

  const households = useQuery({
    queryKey: queryKeys.households({ wardId: picker.wardId, toleId, pageSize: 200 }),
    queryFn: () => listHouseholds({ wardId: picker.wardId, toleId: toleId || undefined, pageSize: 200 }),
    enabled: open && !isEdit && householdMode === 'specific' && !!picker.wardId,
  })
  const visibleHouseholds = (households.data?.items ?? []).filter((h) =>
    h.address.toLowerCase().includes(householdSearch.toLowerCase()),
  )

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskValues>({ resolver: zodResolver(taskSchema) })

  useEffect(() => {
    if (!open) return
    setPickerError(undefined)
    setHouseholdError(undefined)
    setHouseholdSearch('')
    if (task) {
      setPicker({ ...emptyPicker, wardId: task.wardId })
      setToleId(task.toleId ?? '')
      reset({
        title: task.title,
        description: task.description ?? '',
        dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
        assignedToId: task.assignedToId,
      })
    } else {
      setPicker(emptyPicker)
      setToleId('')
      setHouseholdMode('all')
      setSelectedHouseholdIds(new Set())
      reset({ title: '', description: '', dueDate: '', assignedToId: '' })
    }
  }, [open, task, reset])

  const mutation = useMutation({
    mutationFn: (values: TaskValues) => {
      const shared = {
        title: values.title,
        description: values.description || undefined,
        dueDate: values.dueDate || undefined,
        assignedToId: values.assignedToId,
      }
      if (isEdit) {
        return updateTask(task!.id, {
          ...shared,
          description: values.description || null,
          dueDate: values.dueDate || null,
        })
      }
      return createTask({
        wardId: picker.wardId,
        toleId: toleId || undefined,
        ...shared,
        householdIds: householdMode === 'specific' ? Array.from(selectedHouseholdIds) : undefined,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success(isEdit ? 'Task updated' : 'Task created')
      onClose()
    },
    onError: (err) => toast.error(isEdit ? 'Could not update task' : 'Could not create task', getApiErrorMessage(err)),
  })

  const onSubmit = (values: TaskValues) => {
    if (!isEdit) {
      if (!picker.wardId) {
        setPickerError('Select a ward')
        return
      }
      if (householdMode === 'specific' && selectedHouseholdIds.size === 0) {
        setHouseholdError('Select at least one household, or switch to "Every household in this area"')
        return
      }
    }
    mutation.mutate(values)
  }

  const toggleHousehold = (id: string) => {
    setSelectedHouseholdIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setHouseholdError(undefined)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit task' : 'New canvassing task'}
      description={isEdit ? undefined : 'Assign a set of households to a field worker or volunteer.'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
            {isEdit ? 'Save changes' : 'Create task'}
          </Button>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        {isEdit ? (
          <FormField label="Ward" htmlFor="tk-ward">
            <div className="flex h-10 items-center rounded-md border border-border bg-bg px-3 text-sm text-text-secondary">
              <WardLabel wardId={task!.wardId} />
            </div>
          </FormField>
        ) : (
          <GeoCascadePicker
            provinceId={picker.provinceId}
            districtId={picker.districtId}
            municipalityId={picker.municipalityId}
            wardId={picker.wardId}
            onChange={(next) => {
              setPicker(next)
              setToleId('')
              setPickerError(undefined)
            }}
            errors={{ wardId: pickerError }}
          />
        )}

        {!isEdit && (
          <FormField label="Tole (optional)" htmlFor="tk-tole" hint="Leave blank to cover the whole ward">
            <Select id="tk-tole" value={toleId} disabled={!wardId || toles.isLoading} onChange={(e) => setToleId(e.target.value)}>
              <option value="">Whole ward</option>
              {toles.data?.items.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </FormField>
        )}

        <FormField
          label="Assignee"
          htmlFor="tk-assignee"
          error={errors.assignedToId?.message}
          hint={wardId && !eligibleUsers.isLoading && assignableUsers.length === 0 ? 'No active field worker or volunteer is assigned to this ward yet' : undefined}
          required
        >
          <Select id="tk-assignee" disabled={!wardId || eligibleUsers.isLoading} {...register('assignedToId')}>
            <option value="">{wardId ? 'Select assignee' : 'Select a ward first'}</option>
            {assignableUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role === 'VOLUNTEER' ? 'Volunteer' : 'Field Worker'})
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Title" htmlFor="tk-title" error={errors.title?.message} required>
          <Input id="tk-title" placeholder="Door-to-door — East Tole" {...register('title')} />
        </FormField>

        <FormField label="Description" htmlFor="tk-description" error={errors.description?.message}>
          <textarea
            id="tk-description"
            rows={3}
            className="w-full resize-y rounded-md border border-border bg-card px-3 py-2 text-sm text-text placeholder:text-text-muted transition-colors focus-ring hover:border-border-strong focus:border-brand"
            {...register('description')}
          />
        </FormField>

        <FormField label="Due date (optional)" htmlFor="tk-due" error={errors.dueDate?.message}>
          <Input id="tk-due" type="date" {...register('dueDate')} />
        </FormField>

        {!isEdit && (
          <FormField label="Households" htmlFor="tk-household-mode" error={householdError} required>
            <div className="inline-flex rounded-md border border-border bg-bg p-1">
              <button
                type="button"
                onClick={() => setHouseholdMode('all')}
                className={cn(
                  'rounded-sm px-3 py-1.5 text-[13px] font-medium transition-colors focus-ring',
                  householdMode === 'all' ? 'bg-brand text-white' : 'text-text-secondary hover:text-text',
                )}
              >
                Every household in this area
              </button>
              <button
                type="button"
                onClick={() => setHouseholdMode('specific')}
                className={cn(
                  'rounded-sm px-3 py-1.5 text-[13px] font-medium transition-colors focus-ring',
                  householdMode === 'specific' ? 'bg-brand text-white' : 'text-text-secondary hover:text-text',
                )}
              >
                Choose specific households
              </button>
            </div>

            {householdMode === 'specific' && (
              <div className="mt-3 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3">
                  <SearchInput value={householdSearch} onChange={setHouseholdSearch} placeholder="Search by address..." />
                  <span className="shrink-0 text-[12.5px] text-text-secondary">{selectedHouseholdIds.size} selected</span>
                </div>
                <div className="max-h-56 overflow-y-auto rounded-md border border-border">
                  {households.isLoading ? (
                    <p className="px-3 py-4 text-[13px] text-text-secondary">Loading households…</p>
                  ) : !visibleHouseholds.length ? (
                    <p className="px-3 py-4 text-[13px] text-text-secondary">No households found.</p>
                  ) : (
                    <ul className="divide-y divide-border">
                      {visibleHouseholds.map((h) => {
                        const checked = selectedHouseholdIds.has(h.id)
                        return (
                          <li key={h.id}>
                            <button
                              type="button"
                              onClick={() => toggleHousehold(h.id)}
                              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] hover:bg-bg focus-ring"
                            >
                              {checked ? (
                                <CheckSquare className="size-4 shrink-0 text-brand" />
                              ) : (
                                <Square className="size-4 shrink-0 text-text-muted" />
                              )}
                              <span className="truncate">{h.address}</span>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
                {households.data && households.data.pagination.totalItems > 200 && (
                  <p className="text-[12px] text-text-muted">
                    Showing the first 200 of {households.data.pagination.totalItems} households — narrow by tole to see the rest.
                  </p>
                )}
              </div>
            )}
          </FormField>
        )}
      </form>
    </Modal>
  )
}
