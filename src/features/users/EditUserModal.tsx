import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { FormField } from '../../components/ui/FormField'
import { editUserSchema, type EditUserValues } from './schemas'
import { updateUser } from '../../lib/api/users'
import { queryKeys } from '../../lib/queryKeys'
import { toast } from '../../store/toastStore'
import { getApiErrorMessage } from '../../lib/api/client'
import { useCurrentUser } from '../../hooks/usePermission'
import { ROLE_LABELS } from '../../lib/permissions'
import { genderOptions, GENDER_LABELS } from '../voters/schemas'
import type { User, UserRole } from '../../lib/types'

const ASSIGNABLE_ROLES: UserRole[] = [
  'CAMPAIGN_ADMIN',
  'WARD_MANAGER',
  'TOLE_COORDINATOR',
  'FIELD_WORKER',
  'VOLUNTEER',
  'ANALYST',
  'VIEW_ONLY',
]

const BIO_FIELD_ROLES: UserRole[] = ['FIELD_WORKER', 'VOLUNTEER']

export function EditUserModal({ user, onClose }: { user: User | null; onClose: () => void }) {
  const queryClient = useQueryClient()
  const currentUser = useCurrentUser()
  const roleOptions = currentUser?.role === 'SUPER_ADMIN' ? ['SUPER_ADMIN', ...ASSIGNABLE_ROLES] : ASSIGNABLE_ROLES
  const isSelf = currentUser?.id === user?.id

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EditUserValues>({ resolver: zodResolver(editUserSchema) })
  const showBioFields = BIO_FIELD_ROLES.includes(watch('role'))

  useEffect(() => {
    if (user)
      reset({
        name: user.name,
        phone: user.phone ?? '',
        role: user.role,
        status: user.status,
        address: user.address ?? '',
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.slice(0, 10) : '',
        gender: user.gender ?? '',
      })
  }, [user, reset])

  const mutation = useMutation({
    mutationFn: (values: EditUserValues) =>
      updateUser(user!.id, {
        ...values,
        phone: values.phone || null,
        address: values.address || null,
        dateOfBirth: values.dateOfBirth || null,
        gender: values.gender || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      if (user) queryClient.invalidateQueries({ queryKey: queryKeys.user(user.id) })
      toast.success('User updated')
      onClose()
    },
    onError: (err) => toast.error('Could not update user', getApiErrorMessage(err)),
  })

  return (
    <Modal
      open={!!user}
      onClose={onClose}
      title="Edit user"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit((v) => mutation.mutate(v))} loading={isSubmitting}>
            Save changes
          </Button>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit((v) => mutation.mutate(v))}>
        <FormField label="Email" htmlFor="eu-email">
          <Input id="eu-email" value={user?.email ?? ''} disabled />
        </FormField>
        <FormField label="Full name" htmlFor="eu-name" error={errors.name?.message} required>
          <Input id="eu-name" {...register('name')} />
        </FormField>
        <FormField label="Phone" htmlFor="eu-phone" error={errors.phone?.message}>
          <Input id="eu-phone" type="tel" {...register('phone')} />
        </FormField>
        <FormField label="Role" htmlFor="eu-role" error={errors.role?.message} required>
          <Select id="eu-role" disabled={isSelf} {...register('role')}>
            {roleOptions.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r as UserRole]}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Status" htmlFor="eu-status" error={errors.status?.message} required>
          <Select id="eu-status" disabled={isSelf} {...register('status')}>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="INVITED">Invited</option>
          </Select>
        </FormField>
        {isSelf && <p className="text-xs text-text-secondary">You can&apos;t change your own role or status.</p>}
        {showBioFields && (
          <>
            <FormField label="Address" htmlFor="eu-address" error={errors.address?.message}>
              <Input id="eu-address" {...register('address')} />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Date of birth" htmlFor="eu-dob" error={errors.dateOfBirth?.message}>
                <Input id="eu-dob" type="date" {...register('dateOfBirth')} />
              </FormField>
              <FormField label="Gender" htmlFor="eu-gender" error={errors.gender?.message}>
                <Select id="eu-gender" {...register('gender')}>
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
