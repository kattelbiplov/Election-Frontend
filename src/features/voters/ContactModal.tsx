import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { FormField } from '../../components/ui/FormField'
import {
  contactSchema,
  contactMethodOptions,
  contactOutcomeOptions,
  supportLevelOptions,
  CONTACT_METHOD_LABELS,
  CONTACT_OUTCOME_LABELS,
  SUPPORT_LEVEL_LABELS,
  type ContactValues,
} from './schemas'
import { createVoterContact } from '../../lib/api/voters'
import { queryKeys } from '../../lib/queryKeys'
import { toast } from '../../store/toastStore'
import { getApiErrorMessage } from '../../lib/api/client'

export function ContactModal({ voterId, open, onClose }: { voterId: string; open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactValues>({ resolver: zodResolver(contactSchema) })

  useEffect(() => {
    if (open) reset({ method: 'DOOR_KNOCK', outcome: 'REACHED', supportLevelObserved: '', notes: '', contactedAt: '' })
  }, [open, reset])

  const mutation = useMutation({
    mutationFn: (values: ContactValues) =>
      createVoterContact(voterId, {
        method: values.method,
        outcome: values.outcome,
        supportLevelObserved: values.supportLevelObserved || undefined,
        notes: values.notes || undefined,
        // datetime-local has no timezone; pin it to an absolute instant before sending rather
        // than relying on the server to interpret a bare "YYYY-MM-DDTHH:mm" string the same way.
        contactedAt: values.contactedAt ? new Date(values.contactedAt).toISOString() : undefined,
      }),
    onSuccess: () => {
      // A 2-element prefix, not queryKeys.voterContacts(voterId) — that appends an explicit
      // `undefined` params element, which fails to prefix-match the page's real 3-element key
      // (['voterContacts', voterId, {page, method, outcome}]) since undefined !== that object.
      queryClient.invalidateQueries({ queryKey: ['voterContacts', voterId] })
      queryClient.invalidateQueries({ queryKey: queryKeys.voter(voterId) })
      queryClient.invalidateQueries({ queryKey: ['voters'] })
      toast.success('Contact logged')
      onClose()
    },
    onError: (err) => toast.error('Could not log contact', getApiErrorMessage(err)),
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Log a contact"
      description="Append-only — a correction is a new entry, not an edit of this one."
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit((v) => mutation.mutate(v))} loading={isSubmitting}>
            Log contact
          </Button>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit((v) => mutation.mutate(v))}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Method" htmlFor="ct-method" error={errors.method?.message} required>
            <Select id="ct-method" {...register('method')}>
              {contactMethodOptions.map((m) => (
                <option key={m} value={m}>
                  {CONTACT_METHOD_LABELS[m]}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Outcome" htmlFor="ct-outcome" error={errors.outcome?.message} required>
            <Select id="ct-outcome" {...register('outcome')}>
              {contactOutcomeOptions.map((o) => (
                <option key={o} value={o}>
                  {CONTACT_OUTCOME_LABELS[o]}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <FormField
          label="Support level observed (optional)"
          htmlFor="ct-support"
          error={errors.supportLevelObserved?.message}
          hint="If set, this also updates the voter's current support level"
        >
          <Select id="ct-support" {...register('supportLevelObserved')}>
            <option value="">Don't update support level</option>
            {supportLevelOptions.map((s) => (
              <option key={s} value={s}>
                {SUPPORT_LEVEL_LABELS[s]}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="When (optional)" htmlFor="ct-when" error={errors.contactedAt?.message} hint="Defaults to now if left blank">
          <Input id="ct-when" type="datetime-local" max={new Date().toISOString().slice(0, 16)} {...register('contactedAt')} />
        </FormField>

        <FormField label="Notes (optional)" htmlFor="ct-notes" error={errors.notes?.message}>
          <textarea
            id="ct-notes"
            rows={3}
            className="w-full resize-y rounded-md border border-border bg-card px-3 py-2 text-sm text-text placeholder:text-text-muted transition-colors focus-ring hover:border-border-strong focus:border-brand"
            {...register('notes')}
          />
        </FormField>
      </form>
    </Modal>
  )
}
