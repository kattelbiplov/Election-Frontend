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
import {
  genderOptions,
  voterSchema,
  voterStatusOptions,
  supportLevelOptions,
  GENDER_LABELS,
  VOTER_STATUS_LABELS,
  SUPPORT_LEVEL_LABELS,
  type VoterValues,
} from './schemas'
import { createVoter, updateVoter } from '../../lib/api/voters'
import { listToles } from '../../lib/api/geo'
import { listHouseholds } from '../../lib/api/households'
import { queryKeys } from '../../lib/queryKeys'
import { toast } from '../../store/toastStore'
import { getApiErrorMessage } from '../../lib/api/client'
import type { Voter } from '../../lib/types'

const emptyPicker = { provinceId: '', districtId: '', municipalityId: '', wardId: '' }

export function VoterModal({
  open,
  voter,
  onClose,
}: {
  open: boolean
  voter: Voter | null
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const isEdit = !!voter

  const [picker, setPicker] = useState(emptyPicker)
  const [toleId, setToleId] = useState('')
  const [householdId, setHouseholdId] = useState('')
  const [pickerError, setPickerError] = useState<string | undefined>()

  const wardId = isEdit ? voter!.wardId : picker.wardId

  // Gate on `open`, not just wardId — VoterDetailPage keeps this mounted (with open=false) so
  // its "Edit" button has something to open, and these would otherwise fire on every page visit.
  const toles = useQuery({
    queryKey: queryKeys.toles({ wardId }),
    queryFn: () => listToles({ wardId, pageSize: 200 }),
    enabled: open && !!wardId,
  })
  const households = useQuery({
    queryKey: queryKeys.households({ wardId, pageSize: 200 }),
    queryFn: () => listHouseholds({ wardId, pageSize: 200 }),
    enabled: open && !!wardId,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VoterValues>({ resolver: zodResolver(voterSchema) })

  useEffect(() => {
    if (!open) return
    setPickerError(undefined)
    if (voter) {
      setPicker({ ...emptyPicker, wardId: voter.wardId })
      setToleId(voter.toleId ?? '')
      setHouseholdId(voter.householdId ?? '')
      reset({
        fullName: voter.fullName,
        dateOfBirth: voter.dateOfBirth.slice(0, 10),
        gender: voter.gender ?? '',
        fatherOrSpouseName: voter.fatherOrSpouseName ?? '',
        citizenshipNumber: voter.citizenshipNumber ?? '',
        voterIdNumber: voter.voterIdNumber ?? '',
        phone: voter.phone ?? '',
        occupation: voter.occupation ?? '',
        address: voter.address ?? '',
        status: voter.status,
        supportLevel: voter.supportLevel,
      })
    } else {
      setPicker(emptyPicker)
      setToleId('')
      setHouseholdId('')
      reset({
        fullName: '',
        dateOfBirth: '',
        gender: '',
        fatherOrSpouseName: '',
        citizenshipNumber: '',
        voterIdNumber: '',
        phone: '',
        occupation: '',
        address: '',
        status: 'ACTIVE',
        supportLevel: 'UNKNOWN',
      })
    }
  }, [open, voter, reset])

  const mutation = useMutation({
    mutationFn: (values: VoterValues) => {
      const shared = {
        toleId: toleId || undefined,
        householdId: householdId || undefined,
        fullName: values.fullName,
        dateOfBirth: values.dateOfBirth,
        gender: values.gender || undefined,
        fatherOrSpouseName: values.fatherOrSpouseName || undefined,
        citizenshipNumber: values.citizenshipNumber || undefined,
        voterIdNumber: values.voterIdNumber || undefined,
        phone: values.phone || undefined,
        occupation: values.occupation || undefined,
        address: values.address || undefined,
        supportLevel: values.supportLevel,
      }
      return isEdit
        ? updateVoter(voter!.id, { ...shared, status: values.status })
        : createVoter({ wardId: picker.wardId, ...shared })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voters'] })
      toast.success(isEdit ? 'Voter updated' : 'Voter created')
      onClose()
    },
    onError: (err) => toast.error(isEdit ? 'Could not update voter' : 'Could not create voter', getApiErrorMessage(err)),
  })

  const onSubmit = (values: VoterValues) => {
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
      title={isEdit ? 'Edit voter' : 'New voter'}
      description={isEdit ? undefined : 'Duplicate check is by name + date of birth within the ward.'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
            {isEdit ? 'Save changes' : 'Create voter'}
          </Button>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        {isEdit ? (
          <FormField label="Ward" htmlFor="v-ward">
            <div className="flex h-10 items-center rounded-md border border-border bg-bg px-3 text-sm text-text-secondary">
              <WardLabel wardId={voter!.wardId} />
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
              setHouseholdId('')
              setPickerError(undefined)
            }}
            errors={{ wardId: pickerError }}
          />
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Tole (optional)" htmlFor="v-tole">
            <Select id="v-tole" value={toleId} disabled={!wardId || toles.isLoading} onChange={(e) => setToleId(e.target.value)}>
              <option value="">No tole</option>
              {toles.data?.items.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Household (optional)" htmlFor="v-household" hint="Bulk-imported voters aren't linked to one">
            <Select id="v-household" value={householdId} disabled={!wardId || households.isLoading} onChange={(e) => setHouseholdId(e.target.value)}>
              <option value="">No household</option>
              {households.data?.items.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.address}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Full name" htmlFor="v-name" error={errors.fullName?.message} required>
            <Input id="v-name" placeholder="Sita Sharma" {...register('fullName')} />
          </FormField>
          <FormField label="Date of birth" htmlFor="v-dob" error={errors.dateOfBirth?.message} required>
            <Input id="v-dob" type="date" {...register('dateOfBirth')} />
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Gender" htmlFor="v-gender" error={errors.gender?.message}>
            <Select id="v-gender" {...register('gender')}>
              <option value="">Unspecified</option>
              {genderOptions.map((g) => (
                <option key={g} value={g}>
                  {GENDER_LABELS[g]}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Father / spouse name" htmlFor="v-relative" error={errors.fatherOrSpouseName?.message}>
            <Input id="v-relative" {...register('fatherOrSpouseName')} />
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Citizenship number" htmlFor="v-citizenship" error={errors.citizenshipNumber?.message} hint="Informational only, not a dedup key">
            <Input id="v-citizenship" {...register('citizenshipNumber')} />
          </FormField>
          <FormField label="Voter ID number" htmlFor="v-voterid" error={errors.voterIdNumber?.message} hint="EC serial number, informational only">
            <Input id="v-voterid" {...register('voterIdNumber')} />
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Phone" htmlFor="v-phone" error={errors.phone?.message}>
            <Input id="v-phone" type="tel" {...register('phone')} />
          </FormField>
          <FormField label="Occupation" htmlFor="v-occupation" error={errors.occupation?.message}>
            <Input id="v-occupation" {...register('occupation')} />
          </FormField>
        </div>

        <FormField label="Address" htmlFor="v-address" error={errors.address?.message} hint="Free text — not linked to the household record">
          <Input id="v-address" {...register('address')} />
        </FormField>

        <FormField label="Support level" htmlFor="v-support" error={errors.supportLevel?.message} hint="A current classification, not a history — it just records the latest read on this voter" required>
          <Select id="v-support" {...register('supportLevel')}>
            {supportLevelOptions.map((s) => (
              <option key={s} value={s}>
                {SUPPORT_LEVEL_LABELS[s]}
              </option>
            ))}
          </Select>
        </FormField>

        {isEdit && (
          <FormField label="Status" htmlFor="v-status" error={errors.status?.message} required>
            <Select id="v-status" {...register('status')}>
              {voterStatusOptions.map((s) => (
                <option key={s} value={s}>
                  {VOTER_STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
          </FormField>
        )}
      </form>
    </Modal>
  )
}
