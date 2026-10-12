import { useState } from 'react'
import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Compass, Crosshair, Search, ShapesIcon } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Table, THead, TH, TBody, TR, TD } from '../../components/ui/Table'
import { TableSkeleton } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { Pagination } from '../../components/ui/Pagination'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { Input } from '../../components/ui/Input'
import { FormField } from '../../components/ui/FormField'
import { Breadcrumbs } from '../../components/ui/Breadcrumbs'
import { GeoCascadePicker } from '../../components/geo/GeoCascadePicker'
import { ToleLabel } from '../../components/geo/GeoLabel'
import { listNearbyHouseholds, searchHouseholdsWithinPolygon } from '../../lib/api/households'
import { listToles } from '../../lib/api/geo'
import { parsePolygonInput } from '../../lib/geojson'
import { queryKeys } from '../../lib/queryKeys'
import { getApiErrorMessage } from '../../lib/api/client'
import { cn } from '../../lib/utils'
import type { GeoJsonPolygon, Household } from '../../lib/types'

const emptyPicker = { provinceId: '', districtId: '', municipalityId: '', wardId: '' }

function formatDistance(meters: number): string {
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(2)} km`
}

function HouseholdRow({ household, extra }: { household: Household; extra?: ReactNode }) {
  return (
    <TR>
      <TD>
        <p className="font-medium">{household.address}</p>
        {household.landmark && <p className="text-[12.5px] text-text-secondary">{household.landmark}</p>}
      </TD>
      <TD className="text-text-secondary">{household.toleId ? <ToleLabel toleId={household.toleId} /> : '—'}</TD>
      {extra !== undefined && <TD className="text-text-secondary">{extra}</TD>}
    </TR>
  )
}

export function HouseholdSearchPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'nearby' | 'polygon'>('nearby')

  return (
    <div>
      <PageHeader
        title="Spatial search"
        breadcrumb={<Breadcrumbs items={[{ label: 'Households', onClick: () => navigate('/households') }, { label: 'Search' }]} />}
        description="Find households by proximity, or everything inside a hand-drawn area — see docs/modules/03-household-gis.md."
      />

      <div className="mb-4 inline-flex rounded-md border border-border bg-card p-1">
        <button
          type="button"
          onClick={() => setTab('nearby')}
          className={cn(
            'flex items-center gap-1.5 rounded-sm px-3.5 py-1.5 text-[13px] font-medium transition-colors focus-ring',
            tab === 'nearby' ? 'bg-brand text-white' : 'text-text-secondary hover:text-text',
          )}
        >
          <Crosshair className="size-3.5" />
          Nearby a point
        </button>
        <button
          type="button"
          onClick={() => setTab('polygon')}
          className={cn(
            'flex items-center gap-1.5 rounded-sm px-3.5 py-1.5 text-[13px] font-medium transition-colors focus-ring',
            tab === 'polygon' ? 'bg-brand text-white' : 'text-text-secondary hover:text-text',
          )}
        >
          <ShapesIcon className="size-3.5" />
          Within a polygon
        </button>
      </div>

      {tab === 'nearby' ? <NearbySearch /> : <PolygonSearch />}
    </div>
  )
}

function NearbySearch() {
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [radius, setRadius] = useState('500')
  const [errors, setErrors] = useState<{ lat?: string; lng?: string; radius?: string }>({})
  const [page, setPage] = useState(1)
  const [params, setParams] = useState<{ lat: number; lng: number; radiusMeters: number } | null>(null)

  const query = useQuery({
    queryKey: queryKeys.householdsNearby({ ...params, page }),
    queryFn: () => listNearbyHouseholds({ ...params!, page, pageSize: 20 }),
    enabled: !!params,
    placeholderData: (prev) => prev,
  })

  const submit = () => {
    const latNum = Number(lat)
    const lngNum = Number(lng)
    const radiusNum = Number(radius)
    const next: typeof errors = {}
    if (!lat || Number.isNaN(latNum) || latNum < -90 || latNum > 90) next.lat = 'Between -90 and 90'
    if (!lng || Number.isNaN(lngNum) || lngNum < -180 || lngNum > 180) next.lng = 'Between -180 and 180'
    if (!radius || Number.isNaN(radiusNum) || radiusNum <= 0) next.radius = 'Enter meters'
    else if (radiusNum > 5000) next.radius = 'Capped at 5000m'
    setErrors(next)
    if (Object.keys(next).length) return
    setPage(1)
    setParams({ lat: latNum, lng: lngNum, radiusMeters: radiusNum })
  }

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader title="Search around a point" description="Radius is capped at 5,000m server-side." />
        <CardBody>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField label="Latitude" htmlFor="nb-lat" error={errors.lat} required>
              <Input id="nb-lat" type="number" step="any" placeholder="27.6994" value={lat} onChange={(e) => setLat(e.target.value)} />
            </FormField>
            <FormField label="Longitude" htmlFor="nb-lng" error={errors.lng} required>
              <Input id="nb-lng" type="number" step="any" placeholder="85.3245" value={lng} onChange={(e) => setLng(e.target.value)} />
            </FormField>
            <FormField label="Radius (meters)" htmlFor="nb-radius" error={errors.radius} required>
              <Input id="nb-radius" type="number" step="1" min="1" max="5000" value={radius} onChange={(e) => setRadius(e.target.value)} />
            </FormField>
          </div>
          <div className="mt-4 flex justify-end">
            <Button icon={<Search className="size-4" />} loading={query.isFetching && !!params} onClick={submit}>
              Search
            </Button>
          </div>
        </CardBody>
      </Card>

      {params && (
        <Card>
          {query.isLoading ? (
            <TableSkeleton cols={3} />
          ) : query.isError ? (
            <EmptyState title="Could not run this search" description={getApiErrorMessage(query.error)} />
          ) : !query.data?.items.length ? (
            <EmptyState icon={<Compass className="size-6" />} title="No households in range" description="Try a wider radius or a different point." />
          ) : (
            <>
              <Table>
                <THead>
                  <TH>Address</TH>
                  <TH>Tole</TH>
                  <TH>Distance</TH>
                </THead>
                <TBody>
                  {query.data.items.map((h) => (
                    <HouseholdRow key={h.id} household={h} extra={formatDistance(h.distanceMeters)} />
                  ))}
                </TBody>
              </Table>
              <Pagination pagination={query.data.pagination} onPageChange={setPage} />
            </>
          )}
        </Card>
      )}
    </div>
  )
}

function PolygonSearch() {
  const [picker, setPicker] = useState(emptyPicker)
  const [polygonText, setPolygonText] = useState('')
  const [wardError, setWardError] = useState<string | undefined>()
  const [polygonError, setPolygonError] = useState<string | undefined>()
  const [page, setPage] = useState(1)
  const [submitted, setSubmitted] = useState<{ wardId: string; polygon: GeoJsonPolygon } | null>(null)

  const toles = useQuery({
    queryKey: queryKeys.toles({ wardId: picker.wardId }),
    queryFn: () => listToles({ wardId: picker.wardId, pageSize: 200 }),
    enabled: !!picker.wardId,
  })
  const tolesWithBoundary = toles.data?.items.filter((t) => t.boundary) ?? []

  const query = useQuery({
    queryKey: queryKeys.householdsWithinPolygon({ ...submitted, page }),
    queryFn: () => searchHouseholdsWithinPolygon({ ...submitted!, page, pageSize: 20 }),
    enabled: !!submitted,
    placeholderData: (prev) => prev,
  })

  const submit = () => {
    let ok = true
    if (!picker.wardId) {
      setWardError('Select a ward')
      ok = false
    } else {
      setWardError(undefined)
    }
    const result = parsePolygonInput(polygonText)
    if (!result.ok) {
      setPolygonError(result.error)
      ok = false
    } else {
      setPolygonError(undefined)
    }
    if (!ok || !result.ok) return
    setPage(1)
    setSubmitted({ wardId: picker.wardId, polygon: result.polygon })
  }

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader title="Search inside a drawn area" description="Scoped to a single ward. Paste a closed GeoJSON Polygon." />
        <CardBody className="flex flex-col gap-4">
          <GeoCascadePicker
            provinceId={picker.provinceId}
            districtId={picker.districtId}
            municipalityId={picker.municipalityId}
            wardId={picker.wardId}
            onChange={(next) => {
              setPicker(next)
              setWardError(undefined)
            }}
            errors={{ wardId: wardError }}
          />

          {tolesWithBoundary.length > 0 && (
            <FormField label="Prefill from a tole's boundary (optional)" htmlFor="ps-prefill" hint="Copies that tole's saved boundary into the polygon field below">
              <Select
                id="ps-prefill"
                defaultValue=""
                onChange={(e) => {
                  const tole = tolesWithBoundary.find((t) => t.id === e.target.value)
                  if (tole?.boundary) {
                    setPolygonText(JSON.stringify(tole.boundary, null, 2))
                    setPolygonError(undefined)
                  }
                }}
              >
                <option value="">Choose a tole...</option>
                {tolesWithBoundary.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </FormField>
          )}

          <FormField label="Polygon (GeoJSON)" htmlFor="ps-polygon" error={polygonError} required>
            <textarea
              id="ps-polygon"
              rows={6}
              placeholder='{"type":"Polygon","coordinates":[[[85.32,27.70],[85.33,27.70],[85.33,27.71],[85.32,27.71],[85.32,27.70]]]}'
              className="w-full resize-y rounded-md border border-border bg-card px-3 py-2 font-mono text-[12.5px] text-text placeholder:text-text-muted transition-colors focus-ring hover:border-border-strong focus:border-brand"
              value={polygonText}
              onChange={(e) => {
                setPolygonText(e.target.value)
                setPolygonError(undefined)
              }}
            />
          </FormField>

          <div className="flex justify-end">
            <Button icon={<Search className="size-4" />} loading={query.isFetching && !!submitted} onClick={submit}>
              Search
            </Button>
          </div>
        </CardBody>
      </Card>

      {submitted && (
        <Card>
          {query.isLoading ? (
            <TableSkeleton cols={2} />
          ) : query.isError ? (
            <EmptyState title="Could not run this search" description={getApiErrorMessage(query.error)} />
          ) : !query.data?.items.length ? (
            <EmptyState icon={<ShapesIcon className="size-6" />} title="No households inside this area" />
          ) : (
            <>
              <Table>
                <THead>
                  <TH>Address</TH>
                  <TH>Tole</TH>
                </THead>
                <TBody>
                  {query.data.items.map((h) => (
                    <HouseholdRow key={h.id} household={h} />
                  ))}
                </TBody>
              </Table>
              <Pagination pagination={query.data.pagination} onPageChange={setPage} />
            </>
          )}
        </Card>
      )}
    </div>
  )
}
