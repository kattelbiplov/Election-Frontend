import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { FormField } from '../../components/ui/FormField'
import { wardSchema, type WardValues } from './schemas'
import { createWard, updateWard } from '../../lib/api/geo'
import { toast } from '../../store/toastStore'
import { getApiErrorMessage } from '../../lib/api/client'
import type { Ward } from '../../lib/types'

export function WardModal({
  open,
  ward,
  municipalityId,
  municipalityName,
  onClose,
}: {
  open: boolean
  ward: Ward | null
  municipalityId: string
  municipalityName: string
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const isEdit = !!ward

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WardValues>({ resolver: zodResolver(wardSchema) })

  useEffect(() => {
    if (open) {
      reset(
        ward
          ? { wardNumber: String(ward.wardNumber), name: ward.name ?? '', population: ward.population != null ? String(ward.population) : '' }
          : { wardNumber: '', name: '', population: '' },
      )
    }
  }, [open, ward, reset])

  const mutation = useMutation({
    mutationFn: (values: WardValues) =>
      isEdit
        ? updateWard(ward!.id, {
            name: values.name || undefined,
            population: values.population === '' || values.population == null ? undefined : Number(values.population),
          })
        : createWard({
            municipalityId,
            wardNumber: Number(values.wardNumber),
            name: values.name || undefined,
            population: values.population === '' || values.population == null ? undefined : Number(values.population),
          }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wards'] })
      toast.success(isEdit ? 'Ward updated' : 'Ward created')
      onClose()
    },
    onError: (err) => toast.error(isEdit ? 'Could not update ward' : 'Could not create ward', getApiErrorMessage(err)),
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit ward' : 'New ward'}
      description={`In ${municipalityName}`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit((v) => mutation.mutate(v))} loading={isSubmitting}>
            {isEdit ? 'Save changes' : 'Create ward'}
          </Button>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit((v) => mutation.mutate(v))}>
        <FormField label="Ward number" htmlFor="w-number" error={errors.wardNumber?.message} required>
          <Input id="w-number" type="number" disabled={isEdit} {...register('wardNumber')} />
        </FormField>
        <FormField label="Name" htmlFor="w-name" error={errors.name?.message} hint="Optional local name">
          <Input id="w-name" {...register('name')} />
        </FormField>
        <FormField label="Population" htmlFor="w-population" error={errors.population?.message}>
          <Input id="w-population" type="number" {...register('population')} />
        </FormField>
      </form>
    </Modal>
  )
}
