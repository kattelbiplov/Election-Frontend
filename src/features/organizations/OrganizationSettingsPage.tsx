import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Building } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { PageSpinner } from '../../components/ui/Spinner'
import { Input } from '../../components/ui/Input'
import { FormField } from '../../components/ui/FormField'
import { Button } from '../../components/ui/Button'
import { StatusBadge } from '../../components/ui/Badge'
import { editOrganizationSchema, type EditOrganizationValues } from './schemas'
import { getOrganization, updateOrganization } from '../../lib/api/organizations'
import { queryKeys } from '../../lib/queryKeys'
import { useCurrentUser } from '../../hooks/usePermission'
import { toast } from '../../store/toastStore'
import { getApiErrorMessage } from '../../lib/api/client'
import { formatDate } from '../../lib/utils'

export function OrganizationSettingsPage() {
  const user = useCurrentUser()
  const queryClient = useQueryClient()
  const { data: organization, isLoading } = useQuery({
    queryKey: queryKeys.organization(user!.organizationId),
    queryFn: () => getOrganization(user!.organizationId),
    enabled: !!user,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<EditOrganizationValues>({ resolver: zodResolver(editOrganizationSchema) })

  useEffect(() => {
    if (organization) reset({ name: organization.name })
  }, [organization, reset])

  const mutation = useMutation({
    mutationFn: (values: EditOrganizationValues) => updateOrganization(user!.organizationId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organization(user!.organizationId) })
      toast.success('Organization updated')
    },
    onError: (err) => toast.error('Could not update organization', getApiErrorMessage(err)),
  })

  if (isLoading || !organization) return <PageSpinner />

  return (
    <div>
      <PageHeader title="Organization" description="Your campaign's name and status on the platform." />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="General" description="Visible to your team across the platform." />
          <CardBody>
            <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="flex max-w-md flex-col gap-4">
              <FormField label="Organization name" htmlFor="org-name" error={errors.name?.message} required>
                <Input id="org-name" {...register('name')} />
              </FormField>
              <FormField label="Slug" htmlFor="org-slug" hint="Contact platform support to change this">
                <Input id="org-slug" value={organization.slug} disabled />
              </FormField>
              <Button type="submit" className="w-fit" loading={isSubmitting} disabled={!isDirty}>
                Save changes
              </Button>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Status" />
          <CardBody className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-md bg-brand-light text-brand">
                <Building className="size-5" />
              </span>
              <StatusBadge status={organization.status} />
            </div>
            <p className="text-[12.5px] text-text-secondary">On the platform since {formatDate(organization.createdAt)}.</p>
            {organization.status === 'SUSPENDED' && (
              <p className="rounded-md bg-danger-bg px-3 py-2 text-[12.5px] text-danger">
                Your organization is suspended. Contact the platform operator to restore access.
              </p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
