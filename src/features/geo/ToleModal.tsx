import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { FormField } from '../../components/ui/FormField'
import { toleSchema, type ToleValues } from './schemas'
import { createTole, updateTole } from '../../lib/api/geo'
import { parsePolygonInput } from '../../lib/geojson'
import { toast } from '../../store/toastStore'
import { getApiErrorMessage } from '../../lib/api/client'
import type { Tole } from '../../lib/types'

const BOUNDARY_PLACEHOLDER = `{
  "type": "Polygon",
  "coordinates": [[[85.32, 27.70], [85.33, 27.70], [85.33, 27.71], [85.32, 27.71], [85.32, 27.70]]]
}`

export function ToleModal({
  open,
  tole,
  wardId,
  wardName,
  onClose,
}: {
  open: boolean
  tole: Tole | null
  wardId: string
  wardName: string
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const isEdit = !!tole

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ToleValues>({ resolver: zodResolver(toleSchema) })

  useEffect(() => {
    if (open) {
      reset(
        tole
          ? {
              name: tole.name,
              nameNepali: tole.nameNepali ?? '',
              centerLat: tole.centerLat != null ? String(tole.centerLat) : '',
              centerLng: tole.centerLng != null ? String(tole.centerLng) : '',
              boundary: tole.boundary ? JSON.stringify(tole.boundary, null, 2) : '',
            }
          : { name: '', nameNepali: '', centerLat: '', centerLng: '', boundary: '' },
      )
    }
  }, [open, tole, reset])

  const mutation = useMutation({
    mutationFn: (values: ToleValues) => {
      const boundaryResult = values.boundary ? parsePolygonInput(values.boundary) : null
      const payload = {
        name: values.name,
        nameNepali: values.nameNepali || undefined,
        centerLat: values.centerLat === '' || values.centerLat == null ? undefined : Number(values.centerLat),
        centerLng: values.centerLng === '' || values.centerLng == null ? undefined : Number(values.centerLng),
        boundary: boundaryResult?.ok ? boundaryResult.polygon : undefined,
      }
      return isEdit ? updateTole(tole!.id, payload) : createTole({ wardId, ...payload })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['toles'] })
      toast.success(isEdit ? 'Tole updated' : 'Tole created')
      onClose()
    },
    onError: (err) => toast.error(isEdit ? 'Could not update tole' : 'Could not create tole', getApiErrorMessage(err)),
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit tole' : 'New tole'}
      description={`In ${wardName}`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit((v) => mutation.mutate(v))} loading={isSubmitting}>
            {isEdit ? 'Save changes' : 'Create tole'}
          </Button>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit((v) => mutation.mutate(v))}>
        <FormField label="Name" htmlFor="t-name" error={errors.name?.message} required>
          <Input id="t-name" placeholder="Baneshwor Chowk" {...register('name')} />
        </FormField>
        <FormField label="Nepali name" htmlFor="t-name-np" error={errors.nameNepali?.message}>
          <Input id="t-name-np" lang="ne" className="font-nepali" {...register('nameNepali')} />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Center latitude" htmlFor="t-lat" error={errors.centerLat?.message}>
            <Input id="t-lat" type="number" step="any" placeholder="27.6994" {...register('centerLat')} />
          </FormField>
          <FormField label="Center longitude" htmlFor="t-lng" error={errors.centerLng?.message}>
            <Input id="t-lng" type="number" step="any" placeholder="85.3245" {...register('centerLng')} />
          </FormField>
        </div>
        <FormField
          label="Boundary (optional)"
          htmlFor="t-boundary"
          error={errors.boundary?.message}
          hint="A closed GeoJSON Polygon. Needed for the tole's boundary-check report under Households."
        >
          <textarea
            id="t-boundary"
            rows={5}
            placeholder={BOUNDARY_PLACEHOLDER}
            className="w-full resize-y rounded-md border border-border bg-card px-3 py-2 font-mono text-[12.5px] text-text placeholder:text-text-muted transition-colors focus-ring hover:border-border-strong focus:border-brand"
            {...register('boundary')}
          />
        </FormField>
      </form>
    </Modal>
  )
}
