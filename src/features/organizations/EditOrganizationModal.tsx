import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { FormField } from '../../components/ui/FormField'
import { editOrganizationSchema, type EditOrganizationValues } from './schemas'
import { updateOrganization } from '../../lib/api/organizations'
import { queryKeys } from '../../lib/queryKeys'
import { toast } from '../../store/toastStore'
import { getApiErrorMessage } from '../../lib/api/client'
import type { Organization } from '../../lib/types'

export function EditOrganizationModal({
  organization,
  onClose,
}: {
  organization: Organization | null
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditOrganizationValues>({ resolver: zodResolver(editOrganizationSchema) })

  useEffect(() => {
    if (organization) reset({ name: organization.name })
  }, [organization, reset])

  const mutation = useMutation({
    mutationFn: (values: EditOrganizationValues) => updateOrganization(organization!.id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      if (organization) queryClient.invalidateQueries({ queryKey: queryKeys.organization(organization.id) })
      toast.success('Organization updated')
      onClose()
    },
    onError: (err) => toast.error('Could not update organization', getApiErrorMessage(err)),
  })

  return (
    <Modal
      open={!!organization}
      onClose={onClose}
      title="Edit organization"
      size="sm"
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
        <FormField label="Organization name" htmlFor="edit-name" error={errors.name?.message} required>
          <Input id="edit-name" {...register('name')} />
        </FormField>
      </form>
    </Modal>
  )
}
