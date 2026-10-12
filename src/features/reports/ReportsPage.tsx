import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Home, IdCard, ClipboardList, MessageSquare, MapPin } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Skeleton } from '../../components/ui/Skeleton'
import { Button } from '../../components/ui/Button'
import { BarList, type BarListItem } from '../../components/ui/BarList'
import { GeoCascadePicker } from '../../components/geo/GeoCascadePicker'
import { WardLabel, ToleLabel } from '../../components/geo/GeoLabel'
import { genderOptions, voterStatusOptions, supportLevelOptions, contactMethodOptions, contactOutcomeOptions } from '../voters/schemas'
import { GENDER_LABELS, VOTER_STATUS_LABELS, SUPPORT_LEVEL_LABELS, CONTACT_METHOD_LABELS, CONTACT_OUTCOME_LABELS } from '../voters/schemas'
import { taskStatusOptions, visitOutcomeOptions, TASK_STATUS_LABELS, VISIT_OUTCOME_LABELS } from '../tasks/schemas'
import { getDashboardReport } from '../../lib/api/reports'
import { queryKeys } from '../../lib/queryKeys'
import { getApiErrorMessage } from '../../lib/api/client'
import type { EnumCountMap } from '../../lib/types'

const emptyPicker = { provinceId: '', districtId: '', municipalityId: '', wardId: '' }

function toBarItems<T extends string>(
  counts: EnumCountMap<T> | undefined,
  options: readonly T[],
  labels: Record<T, string>,
): BarListItem[] {
  if (!counts) return []
  return [
    ...options.map((key) => ({ label: labels[key], value: counts[key] })),
    { label: 'Not set', value: counts.UNSET },
  ]
}

function StatTile({ icon: Icon, label, value, loading }: { icon: typeof Home; label: string; value: number | undefined; loading: boolean }) {
  return (
    <Card>
      <CardBody className="flex items-center gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-brand-light text-brand">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[12.5px] text-text-secondary">{label}</p>
          {loading ? (
            <Skeleton className="mt-1.5 h-6 w-14" />
          ) : (
            <p className="mt-0.5 text-[22px] font-semibold leading-none text-text">{(value ?? 0).toLocaleString()}</p>
          )}
        </div>
      </CardBody>
    </Card>
  )
}

function BreakdownCard({ title, loading, items }: { title: string; loading: boolean; items: BarListItem[] }) {
  return (
    <Card>
      <CardHeader title={title} />
      <CardBody>
        {loading ? (
          <div className="flex flex-col gap-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ) : items.every((i) => i.value === 0) ? (
          <p className="text-[13px] text-text-secondary">No data in this scope yet.</p>
        ) : (
          <BarList items={items} total={items.reduce((sum, i) => sum + i.value, 0)} />
        )}
      </CardBody>
    </Card>
  )
}

export function ReportsPage() {
  const [picker, setPicker] = useState(emptyPicker)
  const [toleId, setToleId] = useState('')

  const params = { wardId: picker.wardId || undefined, toleId: toleId || undefined }
  const { data, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.dashboardReport(params),
    queryFn: () => getDashboardReport(params),
    placeholderData: (prev) => prev,
  })

  const hasScope = !!picker.wardId

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        description="Live counts across your organization's accessible wards and toles — every call re-aggregates, nothing here is cached."
      />

      <Card className="mb-5">
        <CardHeader
          title="Scope"
          description="Optional — narrows every number below to one ward or tole. A ward/tole outside your own access returns all zeros, not an error."
          action={
            hasScope && (
              <Button
                variant="secondary"
                size="sm"
                icon={<MapPin className="size-3.5" />}
                onClick={() => {
                  setPicker(emptyPicker)
                  setToleId('')
                }}
              >
                Clear scope
              </Button>
            )
          }
        />
        <CardBody className="flex flex-col gap-4">
          <GeoCascadePicker
            provinceId={picker.provinceId}
            districtId={picker.districtId}
            municipalityId={picker.municipalityId}
            wardId={picker.wardId}
            onChange={(next) => {
              setPicker(next)
              setToleId('')
            }}
          />
          {picker.wardId && (
            <div className="text-[12.5px] text-text-secondary">
              Showing: <WardLabel wardId={picker.wardId} />
              {toleId && (
                <>
                  {' '}
                  · <ToleLabel toleId={toleId} />
                </>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {isError && (
        <Card className="mb-5 border-danger/30 bg-danger-bg">
          <CardBody className="text-[13px] text-danger">{getApiErrorMessage(error)}</CardBody>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3.5 sm:gap-4 lg:grid-cols-4">
        <StatTile icon={Home} label="Households" value={data?.households.total} loading={isLoading} />
        <StatTile icon={IdCard} label="Voters" value={data?.voters.total} loading={isLoading} />
        <StatTile icon={ClipboardList} label="Canvassing tasks" value={data?.canvassing.tasks.total} loading={isLoading} />
        <StatTile icon={MessageSquare} label="Voter contacts" value={data?.contacts.total} loading={isLoading} />
      </div>

      <div className="mt-5">
        <Card>
          <CardHeader
            title="Household geocoding"
            description={
              data ? `${data.households.withCoordinates.toLocaleString()} of ${data.households.total.toLocaleString()} households have coordinates` : undefined
            }
          />
          <CardBody>
            {isLoading ? (
              <Skeleton className="h-4 w-full" />
            ) : (
              <BarList
                items={[{ label: 'With coordinates', value: data?.households.withCoordinates ?? 0 }]}
                total={data?.households.total ?? 0}
              />
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <BreakdownCard title="Voters by status" loading={isLoading} items={toBarItems(data?.voters.byStatus, voterStatusOptions, VOTER_STATUS_LABELS)} />
        <BreakdownCard title="Voters by gender" loading={isLoading} items={toBarItems(data?.voters.byGender, genderOptions, GENDER_LABELS)} />
        <BreakdownCard
          title="Voters by support level"
          loading={isLoading}
          items={toBarItems(data?.voters.bySupportLevel, supportLevelOptions, SUPPORT_LEVEL_LABELS)}
        />
        <BreakdownCard
          title="Tasks by status"
          loading={isLoading}
          items={toBarItems(data?.canvassing.tasks.byStatus, taskStatusOptions, TASK_STATUS_LABELS)}
        />
        <BreakdownCard
          title="Household visits by outcome"
          loading={isLoading}
          items={toBarItems(data?.canvassing.visits.byOutcome, visitOutcomeOptions, VISIT_OUTCOME_LABELS)}
        />
        <BreakdownCard
          title="Contacts by method"
          loading={isLoading}
          items={toBarItems(data?.contacts.byMethod, contactMethodOptions, CONTACT_METHOD_LABELS)}
        />
        <BreakdownCard
          title="Contacts by outcome"
          loading={isLoading}
          items={toBarItems(data?.contacts.byOutcome, contactOutcomeOptions, CONTACT_OUTCOME_LABELS)}
        />
      </div>
    </div>
  )
}
