import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Eye, EyeOff, KeyRound } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { FormField } from '../../components/ui/FormField'
import { Button } from '../../components/ui/Button'
import { Avatar } from '../../components/ui/Avatar'
import { RoleBadge, StatusBadge } from '../../components/ui/Badge'
import { changePasswordSchema, type ChangePasswordValues } from './schemas'
import { changePassword } from '../../lib/api/auth'
import { useCurrentUser } from '../../hooks/usePermission'
import { ROLE_LABELS } from '../../lib/permissions'
import { GENDER_LABELS } from '../voters/schemas'
import { formatDate, formatDateTime } from '../../lib/utils'
import { toast } from '../../store/toastStore'
import { getApiErrorMessage } from '../../lib/api/client'

function PasswordField({
  id,
  label,
  error,
  hint,
  registration,
}: {
  id: string
  label: string
  error?: string
  hint?: string
  registration: ReturnType<ReturnType<typeof useForm<ChangePasswordValues>>['register']>
}) {
  const [show, setShow] = useState(false)
  return (
    <FormField label={label} htmlFor={id} error={error} hint={hint} required>
      <Input
        id={id}
        type={show ? 'text' : 'password'}
        rightSlot={
          <button type="button" tabIndex={-1} onClick={() => setShow((v) => !v)} className="focus-ring rounded p-0.5 hover:text-text">
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        }
        error={!!error}
        {...registration}
      />
    </FormField>
  )
}

export function ProfilePage() {
  const user = useCurrentUser()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordValues>({ resolver: zodResolver(changePasswordSchema) })

  const mutation = useMutation({
    mutationFn: (values: ChangePasswordValues) => changePassword(values.currentPassword, values.newPassword),
    onSuccess: () => {
      toast.success('Password changed', "You've been signed out of all other devices.")
      reset()
    },
    onError: (err) => toast.error('Could not change password', getApiErrorMessage(err)),
  })

  if (!user) return null

  return (
    <div>
      <PageHeader title="Profile" description="Your account details and security settings." />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardBody className="flex flex-col items-center gap-3 text-center">
            <Avatar name={user.name} size="lg" />
            <div>
              <p className="text-[15px] font-semibold text-text">{user.name}</p>
              <p className="text-[13px] text-text-secondary">{user.email}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <RoleBadge role={user.role} label={ROLE_LABELS[user.role]} />
              <StatusBadge status={user.status} />
            </div>
            {user.phone && <p className="text-[12.5px] text-text-secondary">{user.phone}</p>}
            {(user.address || user.dateOfBirth || user.gender) && (
              <dl className="w-full space-y-1 border-t border-border pt-3 text-left text-[12.5px]">
                {user.address && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-text-secondary">Address</dt>
                    <dd className="text-right text-text">{user.address}</dd>
                  </div>
                )}
                {user.dateOfBirth && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-text-secondary">Date of birth</dt>
                    <dd className="text-text">{formatDate(user.dateOfBirth)}</dd>
                  </div>
                )}
                {user.gender && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-text-secondary">Gender</dt>
                    <dd className="text-text">{GENDER_LABELS[user.gender]}</dd>
                  </div>
                )}
              </dl>
            )}
            <div className="mt-2 w-full border-t border-border pt-3 text-[12px] text-text-secondary">
              Last signed in {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'this session'}
            </div>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Change password"
            description="Changing your password signs you out on every other device."
            action={
              <span className="flex size-9 items-center justify-center rounded-md bg-brand-light text-brand">
                <KeyRound className="size-4" />
              </span>
            }
          />
          <CardBody>
            <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="flex max-w-md flex-col gap-4">
              <PasswordField id="currentPassword" label="Current password" error={errors.currentPassword?.message} registration={register('currentPassword')} />
              <PasswordField
                id="newPassword"
                label="New password"
                error={errors.newPassword?.message}
                hint="At least 10 characters, with a letter and a digit or symbol"
                registration={register('newPassword')}
              />
              <PasswordField id="confirmPassword" label="Confirm new password" error={errors.confirmPassword?.message} registration={register('confirmPassword')} />
              <Button type="submit" className="w-fit" loading={isSubmitting}>
                Update password
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
