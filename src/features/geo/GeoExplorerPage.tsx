import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Landmark, MapPin, MapPinned, Pencil, Plus, ShieldAlert, Trash2, UploadCloud } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Table, THead, TH, TBody, TR, TD } from '../../components/ui/Table'
import { TableSkeleton } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { Pagination } from '../../components/ui/Pagination'
import { SearchInput } from '../../components/ui/SearchInput'
import { Button } from '../../components/ui/Button'
import { Breadcrumbs } from '../../components/ui/Breadcrumbs'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { ProvinceModal } from './ProvinceModal'
import { DistrictModal } from './DistrictModal'
import { MunicipalityModal } from './MunicipalityModal'
import { WardModal } from './WardModal'
import { ToleModal } from './ToleModal'
import { ToleBoundaryCheckModal } from './ToleBoundaryCheckModal'
import { municipalityLabels } from './schemas'
import {
  listProvinces,
  listDistricts,
  listMunicipalities,
  listWards,
  listToles,
  deleteTole,
} from '../../lib/api/geo'
import { queryKeys } from '../../lib/queryKeys'
import { useDebounce } from '../../hooks/useDebounce'
import { usePermission } from '../../hooks/usePermission'
import { toast } from '../../store/toastStore'
import { getApiErrorMessage } from '../../lib/api/client'
import type { District, Municipality, Province, Tole, Ward } from '../../lib/types'

type Level = 'provinces' | 'districts' | 'municipalities' | 'wards' | 'toles'

export function GeoExplorerPage() {
  const canManageAdminUnits = usePermission('geo:manage_admin_units')
  const canManageWard = usePermission('ward:manage')
  const canCreateTole = usePermission('tole:create')
  const canUpdateTole = usePermission('tole:update')
  const canDeleteTole = usePermission('tole:delete')
  // Boundary-check is gated on household:read, not geo:read — its response is household PII
  // (see docs/modules/03-household-gis.md), not tole metadata.
  const canCheckBoundary = usePermission('household:read')

  const [province, setProvince] = useState<Province | null>(null)
  const [district, setDistrict] = useState<District | null>(null)
  const [municipality, setMunicipality] = useState<Municipality | null>(null)
  const [ward, setWard] = useState<Ward | null>(null)

  const level: Level = !province ? 'provinces' : !district ? 'districts' : !municipality ? 'municipalities' : !ward ? 'wards' : 'toles'

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search)

  const resetBelow = (from: Level) => {
    setPage(1)
    setSearch('')
    if (from === 'provinces') {
      setDistrict(null)
      setMunicipality(null)
      setWard(null)
    } else if (from === 'districts') {
      setMunicipality(null)
      setWard(null)
    } else if (from === 'municipalities') {
      setWard(null)
    }
  }

  const provinces = useQuery({ queryKey: queryKeys.provinces, queryFn: listProvinces, enabled: level === 'provinces' })
  const districts = useQuery({
    queryKey: queryKeys.districts({ provinceId: province?.id, page }),
    queryFn: () => listDistricts({ provinceId: province!.id, page, pageSize: 20 }),
    enabled: level === 'districts' && !!province,
  })
  const municipalities = useQuery({
    queryKey: queryKeys.municipalities({ districtId: district?.id, page, search: debouncedSearch }),
    queryFn: () => listMunicipalities({ districtId: district!.id, page, pageSize: 20, search: debouncedSearch || undefined }),
    enabled: level === 'municipalities' && !!district,
  })
  const wards = useQuery({
    queryKey: queryKeys.wards({ municipalityId: municipality?.id, page }),
    queryFn: () => listWards({ municipalityId: municipality!.id, page, pageSize: 20 }),
    enabled: level === 'wards' && !!municipality,
  })
  const toles = useQuery({
    queryKey: queryKeys.toles({ wardId: ward?.id, page, search: debouncedSearch }),
    queryFn: () => listToles({ wardId: ward!.id, page, pageSize: 20, search: debouncedSearch || undefined }),
    enabled: level === 'toles' && !!ward,
  })

  const queryClient = useQueryClient()
  const [provinceModal, setProvinceModal] = useState<{ open: boolean; item: Province | null }>({ open: false, item: null })
  const [districtModal, setDistrictModal] = useState<{ open: boolean; item: District | null }>({ open: false, item: null })
  const [municipalityModal, setMunicipalityModal] = useState<{ open: boolean; item: Municipality | null }>({ open: false, item: null })
  const [wardModal, setWardModal] = useState<{ open: boolean; item: Ward | null }>({ open: false, item: null })
  const [toleModal, setToleModal] = useState<{ open: boolean; item: Tole | null }>({ open: false, item: null })
  const [deletingTole, setDeletingTole] = useState<Tole | null>(null)
  const [checkingTole, setCheckingTole] = useState<Tole | null>(null)

  const deleteToleMutation = useMutation({
    mutationFn: (id: string) => deleteTole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['toles'] })
      toast.success('Tole deleted')
      setDeletingTole(null)
    },
    onError: (err) => toast.error('Could not delete tole', getApiErrorMessage(err)),
  })

  const breadcrumb = (
    <Breadcrumbs
      items={[
        {
          label: 'Provinces',
          onClick: province
            ? () => {
                resetBelow('provinces')
                setProvince(null)
              }
            : undefined,
        },
        ...(province
          ? [
              {
                label: province.name,
                onClick: district
                  ? () => {
                      resetBelow('districts')
                      setDistrict(null)
                    }
                  : undefined,
              },
            ]
          : []),
        ...(district
          ? [
              {
                label: district.name,
                onClick: municipality
                  ? () => {
                      resetBelow('municipalities')
                      setMunicipality(null)
                    }
                  : undefined,
              },
            ]
          : []),
        ...(municipality
          ? [
              {
                label: municipality.name,
                onClick: ward
                  ? () => {
                      resetBelow('wards')
                      setWard(null)
                    }
                  : undefined,
              },
            ]
          : []),
        ...(ward ? [{ label: `Ward ${ward.wardNumber}` }] : []),
      ]}
    />
  )

  const titles: Record<Level, string> = {
    provinces: 'Provinces',
    districts: `Districts in ${province?.name}`,
    municipalities: `Municipalities in ${district?.name}`,
    wards: `Wards in ${municipality?.name}`,
    toles: `Toles in Ward ${ward?.wardNumber}`,
  }

  return (
    <div>
      <PageHeader
        title="Geo Structure"
        description="Nepal's administrative hierarchy — provinces down to your organization's toles."
        breadcrumb={breadcrumb}
        actions={
          <>
            {level === 'provinces' && canManageAdminUnits && (
              <Link to="/geo/import">
                <Button variant="secondary" icon={<UploadCloud className="size-4" />}>
                  Import dataset
                </Button>
              </Link>
            )}
            {level === 'provinces' && canManageAdminUnits && (
              <Button icon={<Plus className="size-4" />} onClick={() => setProvinceModal({ open: true, item: null })}>
                New province
              </Button>
            )}
            {level === 'districts' && canManageAdminUnits && (
              <Button icon={<Plus className="size-4" />} onClick={() => setDistrictModal({ open: true, item: null })}>
                New district
              </Button>
            )}
            {level === 'municipalities' && canManageAdminUnits && (
              <Button icon={<Plus className="size-4" />} onClick={() => setMunicipalityModal({ open: true, item: null })}>
                New municipality
              </Button>
            )}
            {level === 'wards' && canManageWard && (
              <Button icon={<Plus className="size-4" />} onClick={() => setWardModal({ open: true, item: null })}>
                New ward
              </Button>
            )}
            {level === 'toles' && canCreateTole && (
              <Button icon={<Plus className="size-4" />} onClick={() => setToleModal({ open: true, item: null })}>
                New tole
              </Button>
            )}
          </>
        }
      />

      <Card>
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h2 className="text-[13.5px] font-semibold text-text">{titles[level]}</h2>
          {(level === 'municipalities' || level === 'toles') && (
            <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Search..." />
          )}
        </div>

        {level === 'provinces' && (
          <ProvinceTable
            loading={provinces.isLoading}
            items={provinces.data ?? []}
            onSelect={(p) => { resetBelow('provinces'); setProvince(p) }}
            onEdit={canManageAdminUnits ? (p) => setProvinceModal({ open: true, item: p }) : undefined}
          />
        )}

        {level === 'districts' && (
          <>
            {districts.isLoading ? (
              <TableSkeleton cols={3} />
            ) : !districts.data?.items.length ? (
              <EmptyState icon={<Landmark className="size-6" />} title="No districts yet" />
            ) : (
              <>
                <Table>
                  <THead>
                    <TH>Code</TH>
                    <TH>Name</TH>
                    <TH className="text-right">Actions</TH>
                  </THead>
                  <TBody>
                    {districts.data.items.map((d) => (
                      <TR key={d.id} onClick={() => { resetBelow('districts'); setDistrict(d) }}>
                        <TD className="font-mono text-[12.5px] text-text-secondary">{d.code}</TD>
                        <TD className="font-medium">{d.name}</TD>
                        <TD onClick={(e) => e.stopPropagation()}>
                          {canManageAdminUnits && (
                            <div className="flex justify-end">
                              <Button variant="ghost" size="sm" icon={<Pencil className="size-3.5" />} onClick={() => setDistrictModal({ open: true, item: d })}>
                                Edit
                              </Button>
                            </div>
                          )}
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
                <Pagination pagination={districts.data.pagination} onPageChange={setPage} />
              </>
            )}
          </>
        )}

        {level === 'municipalities' && (
          <>
            {municipalities.isLoading ? (
              <TableSkeleton cols={4} />
            ) : !municipalities.data?.items.length ? (
              <EmptyState icon={<Landmark className="size-6" />} title="No municipalities yet" />
            ) : (
              <>
                <Table>
                  <THead>
                    <TH>Name</TH>
                    <TH>Type</TH>
                    <TH>Total wards</TH>
                    <TH className="text-right">Actions</TH>
                  </THead>
                  <TBody>
                    {municipalities.data.items.map((m) => (
                      <TR key={m.id} onClick={() => { resetBelow('municipalities'); setMunicipality(m) }}>
                        <TD className="font-medium">{m.name}</TD>
                        <TD className="text-text-secondary">{municipalityLabels[m.type]}</TD>
                        <TD className="text-text-secondary">{m.totalWards}</TD>
                        <TD onClick={(e) => e.stopPropagation()}>
                          {canManageAdminUnits && (
                            <div className="flex justify-end">
                              <Button variant="ghost" size="sm" icon={<Pencil className="size-3.5" />} onClick={() => setMunicipalityModal({ open: true, item: m })}>
                                Edit
                              </Button>
                            </div>
                          )}
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
                <Pagination pagination={municipalities.data.pagination} onPageChange={setPage} />
              </>
            )}
          </>
        )}

        {level === 'wards' && (
          <>
            {wards.isLoading ? (
              <TableSkeleton cols={4} />
            ) : !wards.data?.items.length ? (
              <EmptyState icon={<MapPin className="size-6" />} title="No wards yet" />
            ) : (
              <>
                <Table>
                  <THead>
                    <TH>Ward</TH>
                    <TH>Name</TH>
                    <TH>Population</TH>
                    <TH className="text-right">Actions</TH>
                  </THead>
                  <TBody>
                    {wards.data.items.map((w) => (
                      <TR key={w.id} onClick={() => { resetBelow('wards'); setWard(w) }}>
                        <TD className="font-medium">Ward {w.wardNumber}</TD>
                        <TD className="text-text-secondary">{w.name ?? '—'}</TD>
                        <TD className="text-text-secondary">{w.population?.toLocaleString() ?? '—'}</TD>
                        <TD onClick={(e) => e.stopPropagation()}>
                          {canManageWard && (
                            <div className="flex justify-end">
                              <Button variant="ghost" size="sm" icon={<Pencil className="size-3.5" />} onClick={() => setWardModal({ open: true, item: w })}>
                                Edit
                              </Button>
                            </div>
                          )}
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
                <Pagination pagination={wards.data.pagination} onPageChange={setPage} />
              </>
            )}
          </>
        )}

        {level === 'toles' && (
          <>
            {toles.isLoading ? (
              <TableSkeleton cols={3} />
            ) : !toles.data?.items.length ? (
              <EmptyState
                icon={<MapPinned className="size-6" />}
                title="No toles yet"
                description={canCreateTole ? 'Toles are informal areas your organization defines within this ward.' : undefined}
              />
            ) : (
              <>
                <Table>
                  <THead>
                    <TH>Name</TH>
                    <TH>Coordinates</TH>
                    <TH className="text-right">Actions</TH>
                  </THead>
                  <TBody>
                    {toles.data.items.map((t) => (
                      <TR key={t.id}>
                        <TD className="font-medium">{t.name}</TD>
                        <TD className="text-text-secondary">
                          {t.centerLat != null && t.centerLng != null ? `${t.centerLat.toFixed(4)}, ${t.centerLng.toFixed(4)}` : '—'}
                        </TD>
                        <TD>
                          <div className="flex justify-end gap-1.5">
                            {canCheckBoundary && (
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={<ShieldAlert className="size-3.5" />}
                                onClick={() => setCheckingTole(t)}
                              >
                                Boundary check
                              </Button>
                            )}
                            {canUpdateTole && (
                              <Button variant="ghost" size="sm" icon={<Pencil className="size-3.5" />} onClick={() => setToleModal({ open: true, item: t })}>
                                Edit
                              </Button>
                            )}
                            {canDeleteTole && (
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={<Trash2 className="size-3.5" />}
                                className="text-danger hover:bg-danger-bg"
                                onClick={() => setDeletingTole(t)}
                              >
                                Delete
                              </Button>
                            )}
                          </div>
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
                <Pagination pagination={toles.data.pagination} onPageChange={setPage} />
              </>
            )}
          </>
        )}
      </Card>

      <ProvinceModal open={provinceModal.open} province={provinceModal.item} onClose={() => setProvinceModal({ open: false, item: null })} />
      {province && (
        <DistrictModal
          open={districtModal.open}
          district={districtModal.item}
          provinceId={province.id}
          provinceName={province.name}
          onClose={() => setDistrictModal({ open: false, item: null })}
        />
      )}
      {district && (
        <MunicipalityModal
          open={municipalityModal.open}
          municipality={municipalityModal.item}
          districtId={district.id}
          districtName={district.name}
          onClose={() => setMunicipalityModal({ open: false, item: null })}
        />
      )}
      {municipality && (
        <WardModal
          open={wardModal.open}
          ward={wardModal.item}
          municipalityId={municipality.id}
          municipalityName={municipality.name}
          onClose={() => setWardModal({ open: false, item: null })}
        />
      )}
      {ward && (
        <ToleModal
          open={toleModal.open}
          tole={toleModal.item}
          wardId={ward.id}
          wardName={`Ward ${ward.wardNumber}`}
          onClose={() => setToleModal({ open: false, item: null })}
        />
      )}
      <ConfirmDialog
        open={!!deletingTole}
        onClose={() => setDeletingTole(null)}
        onConfirm={() => deletingTole && deleteToleMutation.mutate(deletingTole.id)}
        title="Delete tole?"
        description={`"${deletingTole?.name}" will be removed. This can't be undone.`}
        confirmLabel="Delete"
        destructive
        loading={deleteToleMutation.isPending}
      />
      <ToleBoundaryCheckModal tole={checkingTole} onClose={() => setCheckingTole(null)} />
    </div>
  )
}

function ProvinceTable({
  loading,
  items,
  onSelect,
  onEdit,
}: {
  loading: boolean
  items: Province[]
  onSelect: (p: Province) => void
  onEdit?: (p: Province) => void
}) {
  if (loading) return <TableSkeleton cols={3} />
  if (!items.length) return <EmptyState icon={<Landmark className="size-6" />} title="No provinces yet" />
  return (
    <Table>
      <THead>
        <TH>Code</TH>
        <TH>Name</TH>
        <TH className="text-right">Actions</TH>
      </THead>
      <TBody>
        {items.map((p) => (
          <TR key={p.id} onClick={() => onSelect(p)}>
            <TD className="font-mono text-[12.5px] text-text-secondary">{p.code}</TD>
            <TD className="font-medium">{p.name}</TD>
            <TD onClick={(e) => e.stopPropagation()}>
              {onEdit && (
                <div className="flex justify-end">
                  <Button variant="ghost" size="sm" icon={<Pencil className="size-3.5" />} onClick={() => onEdit(p)}>
                    Edit
                  </Button>
                </div>
              )}
            </TD>
          </TR>
        ))}
      </TBody>
    </Table>
  )
}
