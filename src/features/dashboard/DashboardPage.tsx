import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Users, MapPinned, ScrollText, Building2, ArrowRight, LandPlot, Building, Home, IdCard, Upload, ClipboardList } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card, CardBody } from '../../components/ui/Card'
import { Skeleton } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { useCurrentUser, usePermission } from '../../hooks/usePermission'
import { listUsers } from '../../lib/api/users'
import { listWards, listToles } from '../../lib/api/geo'
import { listOrganizations } from '../../lib/api/organizations'
import { listAuditLogs } from '../../lib/api/auditLogs'
import { listHouseholds } from '../../lib/api/households'
import { listVoters } from '../../lib/api/voters'
import { listTasks } from '../../lib/api/tasks'
import { queryKeys } from '../../lib/queryKeys'
import { formatRelativeTime } from '../../lib/utils'
import { ROLE_LABELS } from '../../lib/permissions'

function StatCard({
  icon: Icon,
  label,
  value,
  loading,
  to,
}: {
  icon: typeof Users
  label: string
  value: number | undefined
  loading: boolean
  to: string
}) {
  return (
    <Link to={to}>
      <Card className="transition-shadow hover:shadow-elevated">
        <CardBody className="flex items-center gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-brand-light text-brand">
            <Icon className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[12.5px] text-text-secondary">{label}</p>
            {loading ? (
              <Skeleton className="mt-1.5 h-6 w-14" />
            ) : (
              <p className="mt-0.5 text-[22px] font-semibold leading-none text-text">{value ?? '—'}</p>
            )}
          </div>
        </CardBody>
      </Card>
    </Link>
  )
}

function QuickAction({ icon: Icon, label, description, to }: { icon: typeof Users; label: string; description: string; to: string }) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3.5 rounded-lg border border-border bg-card p-4 transition-all hover:border-brand/40 hover:shadow-card"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-bg text-text-secondary transition-colors group-hover:bg-brand-light group-hover:text-brand">
        <Icon className="size-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-semibold text-text">{label}</p>
        <p className="truncate text-[12.5px] text-text-secondary">{description}</p>
      </div>
      <ArrowRight className="size-4 shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
    </Link>
  )
}

export function DashboardPage() {
  const user = useCurrentUser()
  const canReadUsers = usePermission('users:read')
  const canReadAudit = usePermission('audit:read')
  const canListOrgs = usePermission('org:list')
  const canReadHouseholds = usePermission('household:read')
  const canReadVoters = usePermission('voter:read')
  const canImportVoters = usePermission('voter:import')
  const canReadTasks = usePermission('task:read')
  const canCreateTasks = usePermission('task:create')
  const canManageOwnOrg = user?.role === 'CAMPAIGN_ADMIN'

  const usersCount = useQuery({
    queryKey: queryKeys.users({ pageSize: 1 }),
    queryFn: () => listUsers({ pageSize: 1 }),
    enabled: canReadUsers,
  })
  const wardsCount = useQuery({
    queryKey: queryKeys.wards({ pageSize: 1 }),
    queryFn: () => listWards({ pageSize: 1 }),
  })
  const tolesCount = useQuery({
    queryKey: queryKeys.toles({ pageSize: 1 }),
    queryFn: () => listToles({ pageSize: 1 }),
  })
  const orgsCount = useQuery({
    queryKey: queryKeys.organizations({ pageSize: 1 }),
    queryFn: () => listOrganizations({ pageSize: 1 }),
    enabled: canListOrgs,
  })
  const householdsCount = useQuery({
    queryKey: queryKeys.households({ pageSize: 1 }),
    queryFn: () => listHouseholds({ pageSize: 1 }),
    enabled: canReadHouseholds,
  })
  const votersCount = useQuery({
    queryKey: queryKeys.voters({ pageSize: 1 }),
    queryFn: () => listVoters({ pageSize: 1 }),
    enabled: canReadVoters,
  })
  const tasksCount = useQuery({
    queryKey: queryKeys.tasks({ pageSize: 1, status: 'PENDING' }),
    queryFn: () => listTasks({ pageSize: 1, status: 'PENDING' }),
    enabled: canReadTasks,
  })
  const recentAudit = useQuery({
    queryKey: queryKeys.auditLogs({ pageSize: 6 }),
    queryFn: () => listAuditLogs({ pageSize: 6 }),
    enabled: canReadAudit,
  })

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.name.split(' ')[0]}`}
        description={`${ROLE_LABELS[user?.role ?? 'VIEW_ONLY']} · signed in as ${user?.email}`}
      />

      <div className="grid grid-cols-2 gap-3.5 sm:gap-4 lg:grid-cols-4">
        {canListOrgs && (
          <StatCard icon={Building2} label="Organizations" value={orgsCount.data?.pagination.totalItems} loading={orgsCount.isLoading} to="/organizations" />
        )}
        {canReadUsers && (
          <StatCard icon={Users} label="Team members" value={usersCount.data?.pagination.totalItems} loading={usersCount.isLoading} to="/users" />
        )}
        {canReadHouseholds && (
          <StatCard icon={Home} label="Households" value={householdsCount.data?.pagination.totalItems} loading={householdsCount.isLoading} to="/households" />
        )}
        {canReadVoters && (
          <StatCard icon={IdCard} label="Voters" value={votersCount.data?.pagination.totalItems} loading={votersCount.isLoading} to="/voters" />
        )}
        {canReadTasks && (
          <StatCard
            icon={ClipboardList}
            label={canCreateTasks ? 'Pending tasks' : 'My pending tasks'}
            value={tasksCount.data?.pagination.totalItems}
            loading={tasksCount.isLoading}
            to="/tasks"
          />
        )}
        <StatCard icon={LandPlot} label="Wards" value={wardsCount.data?.pagination.totalItems} loading={wardsCount.isLoading} to="/geo" />
        <StatCard icon={MapPinned} label="Toles" value={tolesCount.data?.pagination.totalItems} loading={tolesCount.isLoading} to="/geo" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-[13.5px] font-semibold text-text">Quick actions</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {canReadUsers && (
              <QuickAction icon={Users} label="Manage team" description="Users, roles & geo assignments" to="/users" />
            )}
            {canReadVoters && (
              <QuickAction icon={IdCard} label="Voters" description="Search and edit the voter roll" to="/voters" />
            )}
            {canReadHouseholds && (
              <QuickAction icon={Home} label="Households" description="Addresses your team has recorded" to="/households" />
            )}
            {canReadTasks && (
              <QuickAction
                icon={ClipboardList}
                label={canCreateTasks ? 'Canvassing tasks' : 'My tasks'}
                description={canCreateTasks ? 'Assign households and track visit progress' : 'Record outcomes for your assigned households'}
                to="/tasks"
              />
            )}
            {canImportVoters && (
              <QuickAction icon={Upload} label="Import voters" description="Bulk-add a ward roll from a file" to="/voters/import" />
            )}
            <QuickAction icon={MapPinned} label="Geo structure" description="Provinces, wards & toles" to="/geo" />
            {canManageOwnOrg && (
              <QuickAction icon={Building} label="Organization" description="Campaign name & settings" to="/organization" />
            )}
            {canListOrgs && (
              <QuickAction icon={Building2} label="Organizations" description="Manage campaign tenants" to="/organizations" />
            )}
            {canReadAudit && (
              <QuickAction icon={ScrollText} label="Audit logs" description="Track every change" to="/audit-logs" />
            )}
          </div>
        </div>

        {canReadAudit && (
          <div>
            <h2 className="mb-3 text-[13.5px] font-semibold text-text">Recent activity</h2>
            <Card>
              {recentAudit.isLoading ? (
                <CardBody className="flex flex-col gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </CardBody>
              ) : !recentAudit.data?.items.length ? (
                <EmptyState title="No activity yet" description="Changes to users and geo data will show up here." />
              ) : (
                <ul className="divide-y divide-border">
                  {recentAudit.data.items.map((log) => (
                    <li key={log.id} className="flex items-start justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium text-text">{log.action}</p>
                        <p className="truncate text-[12px] text-text-secondary">
                          {log.entityType} · {log.actorName ?? 'System'}
                        </p>
                      </div>
                      <span className="shrink-0 text-[11.5px] text-text-muted">{formatRelativeTime(log.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
              <Link
                to="/audit-logs"
                className="focus-ring flex items-center justify-center gap-1.5 border-t border-border py-2.5 text-[12.5px] font-medium text-brand hover:bg-brand-light"
              >
                View all activity
                <ArrowRight className="size-3.5" />
              </Link>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
