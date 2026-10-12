import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { FormField } from '../../components/ui/FormField'
import { municipalitySchema, municipalityTypes, municipalityLabels, type MunicipalityValues } from './schemas'
import { createMunicipality, updateMunicipality } from '../../lib/api/geo'
import { toast } from '../../store/toastStore'
import { getApiErrorMessage } from '../../lib/api/client'
import type { Municipality } from '../../lib/types'

export function MunicipalityModal({
  open,
  municipality,
  districtId,
  districtName,
  onClose,
}: {
  open: boolean
  municipality: Municipality | null
  districtId: string
  districtName: string
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const isEdit = !!municipality

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MunicipalityValues>({ resolver: zodResolver(municipalitySchema) })

  useEffect(() => {
    if (open) {
      reset(
        municipality
          ? {
              code: municipality.code,
              name: municipality.name,
              nameNepali: municipality.nameNepali ?? '',
              type: municipality.type,
              totalWards: String(municipality.totalWards),
            }
          : { code: '', name: '', nameNepali: '', type: 'MUNICIPALITY', totalWards: '' },
      )
    }
  }, [open, municipality, reset])

  const mutation = useMutation({
    mutationFn: (values: MunicipalityValues) =>
      isEdit
        ? updateMunicipality(municipality!.id, {
            name: values.name,
            nameNepali: values.nameNepali || undefined,
            type: values.type,
            totalWards: Number(values.totalWards),
          })
        : createMunicipality({
            districtId,
            code: values.code,
            name: values.name,
            nameNepali: values.nameNepali || undefined,
            type: values.type,
            totalWards: Number(values.totalWards),
          }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['municipalities'] })
      toast.success(isEdit ? 'Municipality updated' : 'Municipality created')
      onClose()
    },
    onError: (err) => toast.error(isEdit ? 'Could not update municipality' : 'Could not create municipality', getApiErrorMessage(err)),
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit municipality' : 'New municipality'}
      description={`In ${districtName}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit((v) => mutation.mutate(v))} loading={isSubmitting}>
            {isEdit ? 'Save changes' : 'Create municipality'}
          </Button>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit((v) => mutation.mutate(v))}>
        <FormField label="Code" htmlFor="m-code" error={errors.code?.message} required>
          <Input id="m-code" disabled={isEdit} {...register('code')} />
        </FormField>
        <FormField label="Name" htmlFor="m-name" error={errors.name?.message} required>
          <Input id="m-name" placeholder="Kathmandu Metropolitan City" {...register('name')} />
        </FormField>
        <FormField label="Nepali name" htmlFor="m-name-np" error={errors.nameNepali?.message}>
          <Input id="m-name-np" lang="ne" className="font-nepali" {...register('nameNepali')} />
        </FormField>
        <FormField label="Type" htmlFor="m-type" error={errors.type?.message} required>
          <Select id="m-type" {...register('type')}>
            {municipalityTypes.map((t) => (
              <option key={t} value={t}>
                {municipalityLabels[t]}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Total wards" htmlFor="m-wards" error={errors.totalWards?.message} required>
          <Input id="m-wards" type="number" {...register('totalWards')} />
        </FormField>
      </form>
    </Modal>
  )
}
