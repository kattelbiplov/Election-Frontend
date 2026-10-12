import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { FormField } from '../../components/ui/FormField'
import { HouseholdLabel } from '../../components/households/HouseholdLabel'
import { visitUpdateSchema, VISIT_OUTCOME_LABELS, visitOutcomeOptions, type VisitUpdateValues } from './schemas'
import { updateVisit } from '../../lib/api/tasks'
import { queryKeys } from '../../lib/queryKeys'
import { toast } from '../../store/toastStore'
import { getApiErrorMessage } from '../../lib/api/client'
import type { CanvassingVisit } from '../../lib/types'

export function VisitModal({
  taskId,
  visit,
  onClose,
}: {
  taskId: string
  visit: CanvassingVisit | null
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VisitUpdateValues>({ resolver: zodResolver(visitUpdateSchema) })

  useEffect(() => {
    if (visit) reset({ outcome: visit.outcome, notes: visit.notes ?? '' })
  }, [visit, reset])

  const mutation = useMutation({
    mutationFn: (values: VisitUpdateValues) => updateVisit(taskId, visit!.id, { outcome: values.outcome, notes: values.notes || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taskVisits', taskId] })
      queryClient.invalidateQueries({ queryKey: queryKeys.task(taskId) })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Visit updated')
      onClose()
    },
    onError: (err) => toast.error('Could not update visit', getApiErrorMessage(err)),
  })

  return (
    <Modal
      open={!!visit}
      onClose={onClose}
      title="Record visit outcome"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit((v) => mutation.mutate(v))} loading={isSubmitting}>
            Save
          </Button>
        </>
      }
    >
      {visit && (
        <form className="flex flex-col gap-4" onSubmit={handleSubmit((v) => mutation.mutate(v))}>
          <div className="text-[13.5px] font-medium text-text">
            <HouseholdLabel householdId={visit.householdId} />
          </div>
          <FormField label="Outcome" htmlFor="vs-outcome" error={errors.outcome?.message} required>
            <Select id="vs-outcome" {...register('outcome')}>
              {visitOutcomeOptions.map((o) => (
                <option key={o} value={o}>
                  {VISIT_OUTCOME_LABELS[o]}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Notes (optional)" htmlFor="vs-notes" error={errors.notes?.message}>
            <textarea
              id="vs-notes"
              rows={3}
              className="w-full resize-y rounded-md border border-border bg-card px-3 py-2 text-sm text-text placeholder:text-text-muted transition-colors focus-ring hover:border-border-strong focus:border-brand"
              {...register('notes')}
            />
          </FormField>
        </form>
      )}
    </Modal>
  )
}
