import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { FormField } from '../../components/ui/FormField'
import { provinceSchema, type ProvinceValues } from './schemas'
import { createProvince, updateProvince } from '../../lib/api/geo'
import { toast } from '../../store/toastStore'
import { getApiErrorMessage } from '../../lib/api/client'
import type { Province } from '../../lib/types'

export function ProvinceModal({
  open,
  province,
  onClose,
}: {
  open: boolean
  province: Province | null
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const isEdit = !!province

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProvinceValues>({ resolver: zodResolver(provinceSchema) })

  useEffect(() => {
    if (open) {
      reset(
        province
          ? { code: String(province.code), name: province.name, nameNepali: province.nameNepali ?? '' }
          : { code: '', name: '', nameNepali: '' },
      )
    }
  }, [open, province, reset])

  const mutation = useMutation({
    mutationFn: (values: ProvinceValues) =>
      isEdit
        ? updateProvince(province!.id, { name: values.name, nameNepali: values.nameNepali || undefined })
        : createProvince({ code: Number(values.code), name: values.name, nameNepali: values.nameNepali || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provinces'] })
      toast.success(isEdit ? 'Province updated' : 'Province created')
      onClose()
    },
    onError: (err) => toast.error(isEdit ? 'Could not update province' : 'Could not create province', getApiErrorMessage(err)),
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit province' : 'New province'}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit((v) => mutation.mutate(v))} loading={isSubmitting}>
            {isEdit ? 'Save changes' : 'Create province'}
          </Button>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit((v) => mutation.mutate(v))}>
        <FormField label="Code" htmlFor="p-code" error={errors.code?.message} required>
          <Input id="p-code" type="number" disabled={isEdit} {...register('code')} />
        </FormField>
        <FormField label="Name" htmlFor="p-name" error={errors.name?.message} required>
          <Input id="p-name" placeholder="Bagmati" {...register('name')} />
        </FormField>
        <FormField label="Nepali name" htmlFor="p-name-np" error={errors.nameNepali?.message}>
          <Input id="p-name-np" lang="ne" className="font-nepali" placeholder="बागमती" {...register('nameNepali')} />
        </FormField>
      </form>
    </Modal>
  )
}
