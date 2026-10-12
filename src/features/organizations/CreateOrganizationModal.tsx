import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { FormField } from '../../components/ui/FormField'
import { createOrganizationSchema, type CreateOrganizationValues } from './schemas'
import { createOrganization } from '../../lib/api/organizations'
import { toast } from '../../store/toastStore'
import { getApiErrorMessage } from '../../lib/api/client'
import { slugify } from '../../lib/utils'

export function CreateOrganizationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting, touchedFields },
  } = useForm<CreateOrganizationValues>({ resolver: zodResolver(createOrganizationSchema) })

  useEffect(() => {
    if (open) reset()
  }, [open, reset])

  const name = watch('name')
  useEffect(() => {
    if (name && !touchedFields.slug) setValue('slug', slugify(name))
  }, [name, setValue, touchedFields.slug])

  const mutation = useMutation({
    mutationFn: createOrganization,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      toast.success('Organization created', 'The campaign admin can now sign in.')
      onClose()
    },
    onError: (err) => toast.error('Could not create organization', getApiErrorMessage(err)),
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New organization"
      description="Creates a campaign tenant and its first Campaign Admin."
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit((v) => mutation.mutate(v))} loading={isSubmitting}>
            Create organization
          </Button>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit((v) => mutation.mutate(v))}>
        <FormField label="Organization name" htmlFor="name" error={errors.name?.message} required>
          <Input id="name" placeholder="Kathmandu Ward 12 Campaign" {...register('name')} />
        </FormField>
        <FormField label="Slug" htmlFor="slug" error={errors.slug?.message} hint="Lowercase, kebab-case, unique" required>
          <Input id="slug" placeholder="ktm-ward-12-campaign" {...register('slug')} />
        </FormField>

        <div className="mt-1 border-t border-border pt-4">
          <p className="mb-3 text-[13px] font-semibold text-text">First Campaign Admin</p>
          <div className="flex flex-col gap-4">
            <FormField label="Admin name" htmlFor="adminName" error={errors.adminName?.message} required>
              <Input id="adminName" placeholder="Anita Sharma" {...register('adminName')} />
            </FormField>
            <FormField label="Admin email" htmlFor="adminEmail" error={errors.adminEmail?.message} required>
              <Input id="adminEmail" type="email" placeholder="anita@campaign.org" {...register('adminEmail')} />
            </FormField>
            <FormField
              label="Temporary password"
              htmlFor="adminPassword"
              error={errors.adminPassword?.message}
              hint="At least 10 characters, with a letter and a digit or symbol"
              required
            >
              <Input id="adminPassword" type="password" autoComplete="new-password" {...register('adminPassword')} />
            </FormField>
          </div>
        </div>
      </form>
    </Modal>
  )
}
