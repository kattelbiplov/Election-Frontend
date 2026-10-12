import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { FormField } from '../../components/ui/FormField'
import { createUserSchema, type CreateUserValues } from './schemas'
import { createUser } from '../../lib/api/users'
import { toast } from '../../store/toastStore'
import { getApiErrorMessage } from '../../lib/api/client'
import { useCurrentUser } from '../../hooks/usePermission'
import { ROLE_LABELS } from '../../lib/permissions'
import { genderOptions, GENDER_LABELS } from '../voters/schemas'
import type { UserRole } from '../../lib/types'

const ASSIGNABLE_ROLES: UserRole[] = [
  'CAMPAIGN_ADMIN',
  'WARD_MANAGER',
  'TOLE_COORDINATOR',
  'FIELD_WORKER',
  'VOLUNTEER',
  'ANALYST',
  'VIEW_ONLY',
]

// Bio fields are plain nullable columns any role may carry, but they're only meaningful for
// people doing fieldwork — showing them for every role would just be clutter.
const BIO_FIELD_ROLES: UserRole[] = ['FIELD_WORKER', 'VOLUNTEER']

export function CreateUserModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()
  const currentUser = useCurrentUser()
  const roleOptions = currentUser?.role === 'SUPER_ADMIN' ? ['SUPER_ADMIN', ...ASSIGNABLE_ROLES] : ASSIGNABLE_ROLES

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserValues>({ resolver: zodResolver(createUserSchema), defaultValues: { role: 'FIELD_WORKER' } })
  const showBioFields = BIO_FIELD_ROLES.includes(watch('role'))

  useEffect(() => {
    if (open) reset({ role: 'FIELD_WORKER', name: '', email: '', phone: '', password: '', address: '', dateOfBirth: '', gender: '' })
  }, [open, reset])

  const mutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('User created')
      onClose()
    },
    onError: (err) => toast.error('Could not create user', getApiErrorMessage(err)),
  })

  const onSubmit = (values: CreateUserValues) =>
    mutation.mutate({
      ...values,
      phone: values.phone || undefined,
      address: values.address || undefined,
      dateOfBirth: values.dateOfBirth || undefined,
      gender: values.gender || undefined,
    })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New user"
      description="They'll be created with the password below — share it securely."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
            Create user
          </Button>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        <FormField label="Full name" htmlFor="u-name" error={errors.name?.message} required>
          <Input id="u-name" placeholder="Ram Bahadur" {...register('name')} />
        </FormField>
        <FormField label="Email" htmlFor="u-email" error={errors.email?.message} required>
          <Input id="u-email" type="email" placeholder="ram@campaign.org" {...register('email')} />
        </FormField>
        <FormField label="Phone" htmlFor="u-phone" error={errors.phone?.message}>
          <Input id="u-phone" type="tel" placeholder="98XXXXXXXX" {...register('phone')} />
        </FormField>
        <FormField label="Role" htmlFor="u-role" error={errors.role?.message} required>
          <Select id="u-role" {...register('role')}>
            {roleOptions.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r as UserRole]}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField
          label="Temporary password"
          htmlFor="u-password"
          error={errors.password?.message}
          hint="At least 10 characters, with a letter and a digit or symbol"
          required
        >
          <Input id="u-password" type="password" autoComplete="new-password" {...register('password')} />
        </FormField>
        {showBioFields && (
          <>
            <FormField label="Address" htmlFor="u-address" error={errors.address?.message}>
              <Input id="u-address" {...register('address')} />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Date of birth" htmlFor="u-dob" error={errors.dateOfBirth?.message}>
                <Input id="u-dob" type="date" {...register('dateOfBirth')} />
              </FormField>
              <FormField label="Gender" htmlFor="u-gender" error={errors.gender?.message}>
                <Select id="u-gender" {...register('gender')}>
                  <option value="">Unspecified</option>
                  {genderOptions.map((g) => (
                    <option key={g} value={g}>
                      {GENDER_LABELS[g]}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>
          </>
        )}
      </form>
    </Modal>
  )
}
