import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { FormField } from '../../components/ui/FormField'
import { districtSchema, type DistrictValues } from './schemas'
import { createDistrict, updateDistrict } from '../../lib/api/geo'
import { toast } from '../../store/toastStore'
import { getApiErrorMessage } from '../../lib/api/client'
import type { District } from '../../lib/types'

export function DistrictModal({
  open,
  district,
  provinceId,
  provinceName,
  onClose,
}: {
  open: boolean
  district: District | null
  provinceId: string
  provinceName: string
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const isEdit = !!district

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DistrictValues>({ resolver: zodResolver(districtSchema) })

  useEffect(() => {
    if (open) {
      reset(district ? { code: district.code, name: district.name, nameNepali: district.nameNepali ?? '' } : { code: '', name: '', nameNepali: '' })
    }
  }, [open, district, reset])

  const mutation = useMutation({
    mutationFn: (values: DistrictValues) =>
      isEdit
        ? updateDistrict(district!.id, { name: values.name, nameNepali: values.nameNepali || undefined })
        : createDistrict({ provinceId, code: values.code, name: values.name, nameNepali: values.nameNepali || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['districts'] })
      toast.success(isEdit ? 'District updated' : 'District created')
      onClose()
    },
    onError: (err) => toast.error(isEdit ? 'Could not update district' : 'Could not create district', getApiErrorMessage(err)),
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit district' : 'New district'}
      description={`In ${provinceName}`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit((v) => mutation.mutate(v))} loading={isSubmitting}>
            {isEdit ? 'Save changes' : 'Create district'}
          </Button>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit((v) => mutation.mutate(v))}>
        <FormField label="Code" htmlFor="d-code" error={errors.code?.message} required>
          <Input id="d-code" disabled={isEdit} {...register('code')} />
        </FormField>
        <FormField label="Name" htmlFor="d-name" error={errors.name?.message} required>
          <Input id="d-name" placeholder="Kathmandu" {...register('name')} />
        </FormField>
        <FormField label="Nepali name" htmlFor="d-name-np" error={errors.nameNepali?.message}>
          <Input id="d-name-np" lang="ne" className="font-nepali" placeholder="काठमाडौं" {...register('nameNepali')} />
        </FormField>
      </form>
    </Modal>
  )
}
