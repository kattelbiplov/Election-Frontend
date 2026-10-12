import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { FormField } from '../../components/ui/FormField'
import { GeoCascadePicker } from '../../components/geo/GeoCascadePicker'
import { WardLabel } from '../../components/geo/GeoLabel'
import { householdSchema, type HouseholdValues } from './schemas'
import { createHousehold, updateHousehold } from '../../lib/api/households'
import { listToles } from '../../lib/api/geo'
import { queryKeys } from '../../lib/queryKeys'
import { toast } from '../../store/toastStore'
import { getApiErrorMessage } from '../../lib/api/client'
import type { Household } from '../../lib/types'

const emptyPicker = { provinceId: '', districtId: '', municipalityId: '', wardId: '' }

export function HouseholdModal({
  open,
  household,
  onClose,
  initialCoords,
  onManageFamily,
  onDelete,
}: {
  open: boolean
  household: Household | null
  onClose: () => void
  /** Prefills lat/lng when creating — e.g. from a map click. Ignored when editing. */
  initialCoords?: { lat: number; lng: number }
  /** Shows a "Manage family & owner" link when editing (Module 09) — omit to hide it entirely. */
  onManageFamily?: () => void
  /** Shows a "Delete" button when editing — omit to hide it. Caller owns the confirm + mutation. */
  onDelete?: () => void
}) {
  const queryClient = useQueryClient()
  const isEdit = !!household

  const [picker, setPicker] = useState(emptyPicker)
  const [toleId, setToleId] = useState('')
  const [pickerError, setPickerError] = useState<string | undefined>()

  const wardId = isEdit ? household!.wardId : picker.wardId

  const toles = useQuery({
    queryKey: queryKeys.toles({ wardId }),
    queryFn: () => listToles({ wardId, pageSize: 200 }),
    enabled: !!wardId,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<HouseholdValues>({ resolver: zodResolver(householdSchema) })

  useEffect(() => {
    if (!open) return
    setPickerError(undefined)
    if (household) {
      setPicker({ ...emptyPicker, wardId: household.wardId })
      setToleId(household.toleId ?? '')
      reset({
        address: household.address,
        landmark: household.landmark ?? '',
        centerLat: household.centerLat != null ? String(household.centerLat) : '',
        centerLng: household.centerLng != null ? String(household.centerLng) : '',
      })
    } else {
      setPicker(emptyPicker)
      setToleId('')
      reset({
        address: '',
        landmark: '',
        centerLat: initialCoords ? String(initialCoords.lat) : '',
        centerLng: initialCoords ? String(initialCoords.lng) : '',
      })
    }
  }, [open, household, reset, initialCoords])

  const mutation = useMutation({
    mutationFn: (values: HouseholdValues) => {
      const payload = {
        toleId: toleId || undefined,
        address: values.address,
        landmark: values.landmark || undefined,
        centerLat: values.centerLat === '' || values.centerLat == null ? undefined : Number(values.centerLat),
        centerLng: values.centerLng === '' || values.centerLng == null ? undefined : Number(values.centerLng),
      }
      return isEdit ? updateHousehold(household!.id, payload) : createHousehold({ wardId: picker.wardId, ...payload })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['households'] })
      toast.success(isEdit ? 'Household updated' : 'Household created')
      onClose()
    },
    onError: (err) => toast.error(isEdit ? 'Could not update household' : 'Could not create household', getApiErrorMessage(err)),
  })

  const onSubmit = (values: HouseholdValues) => {
    if (!isEdit && !picker.wardId) {
      setPickerError('Select a ward')
      return
    }
    mutation.mutate(values)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit household' : 'New household'}
      size="lg"
      footer={
        <>
          {isEdit && (onManageFamily || onDelete) && (
            <div className="mr-auto flex gap-2">
              {onManageFamily && (
                <Button variant="ghost" onClick={onManageFamily}>
                  Manage family &amp; owner
                </Button>
              )}
              {onDelete && (
                <Button variant="ghost" className="text-danger hover:bg-danger-bg" onClick={onDelete}>
                  Delete
                </Button>
              )}
            </div>
          )}
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
            {isEdit ? 'Save changes' : 'Create household'}
          </Button>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        {isEdit ? (
          <FormField label="Ward" htmlFor="hh-ward">
            <div className="flex h-10 items-center rounded-md border border-border bg-bg px-3 text-sm text-text-secondary">
              <WardLabel wardId={household!.wardId} />
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

        <FormField label="Tole (optional)" htmlFor="hh-tole" hint="Toles are informal, campaign-defined areas within a ward">
          <Select id="hh-tole" value={toleId} disabled={!wardId || toles.isLoading} onChange={(e) => setToleId(e.target.value)}>
            <option value="">No tole</option>
            {toles.data?.items.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Address" htmlFor="hh-address" error={errors.address?.message} required>
          <Input id="hh-address" placeholder="House no. 12, Main Road" {...register('address')} />
        </FormField>

        <FormField label="Landmark" htmlFor="hh-landmark" error={errors.landmark?.message}>
          <Input id="hh-landmark" placeholder="Near the water tank" {...register('landmark')} />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Center latitude" htmlFor="hh-lat" error={errors.centerLat?.message}>
            <Input id="hh-lat" type="number" step="any" placeholder="27.6994" {...register('centerLat')} />
          </FormField>
          <FormField label="Center longitude" htmlFor="hh-lng" error={errors.centerLng?.message}>
            <Input id="hh-lng" type="number" step="any" placeholder="85.3245" {...register('centerLng')} />
          </FormField>
        </div>
      </form>
    </Modal>
  )
}
