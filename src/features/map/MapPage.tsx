import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MapContainer, TileLayer, LayersControl, Marker, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { Plus, X } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { HouseholdModal } from '../households/HouseholdModal'
import { FamilyTreeModal } from '../households/FamilyTreeModal'
import { fetchAllHouseholds, updateHousehold, deleteHousehold } from '../../lib/api/households'
import { listWards } from '../../lib/api/geo'
import { queryKeys } from '../../lib/queryKeys'
import { usePermission } from '../../hooks/usePermission'
import { toast } from '../../store/toastStore'
import { getApiErrorMessage } from '../../lib/api/client'
import type { Household } from '../../lib/types'

// Bundler gotcha: Leaflet's default marker icon resolves relative image paths that assume a
// specific directory layout, which doesn't survive Vite's bundling — re-point them at the actual
// bundled asset URLs. Must run once, at module load, before any <Marker> renders.
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow })

// Kathmandu — overridden by <FitToMarkers> as soon as any household with coordinates loads.
const DEFAULT_CENTER: [number, number] = [27.7172, 85.324]
const DEFAULT_ZOOM = 13

type PlottableHousehold = Household & { centerLat: number; centerLng: number }

function FitToMarkers({ households }: { households: PlottableHousehold[] }) {
  const map = useMap()
  // Keyed on the id set (not the array reference, which changes every refetch even when the
  // underlying households don't) so this only re-fits when what's actually plotted changes.
  const key = households.map((h) => h.id).join(',')

  useEffect(() => {
    if (households.length === 0) return
    const bounds = L.latLngBounds(households.map((h) => [h.centerLat, h.centerLng]))
    map.fitBounds(bounds.pad(0.2))
    // Intentionally keyed on `key`, not `households`/`map` — see the comment above.
  }, [key])

  return null
}

function AddModeClickHandler({ active, onPick }: { active: boolean; onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (!active) return
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export function MapPage() {
  const queryClient = useQueryClient()
  const canCreate = usePermission('household:create')
  const canUpdate = usePermission('household:update')
  const canDelete = usePermission('household:delete')
  // The family/owner flow PATCHes both the household (headOfHouseholdId) and voters
  // (householdId, relationships) — needs both permissions, not just household:update. Both
  // hooks are called unconditionally (Rules of Hooks) and combined afterward.
  const canUpdateVoters = usePermission('voter:update')
  const canManageFamily = canUpdate && canUpdateVoters

  const [wardId, setWardId] = useState('')
  const [addMode, setAddMode] = useState(false)
  const [pendingCoords, setPendingCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Household | null>(null)
  const [managingFamily, setManagingFamily] = useState<Household | null>(null)
  const [deleting, setDeleting] = useState<Household | null>(null)

  const wardsParams = { pageSize: 200 }
  const wards = useQuery({ queryKey: queryKeys.wards(wardsParams), queryFn: () => listWards(wardsParams) })

  const householdsParams = { wardId: wardId || undefined }
  const households = useQuery({
    queryKey: queryKeys.households({ ...householdsParams, all: true }),
    queryFn: () => fetchAllHouseholds(householdsParams),
    placeholderData: (prev) => prev,
  })

  const plottable = useMemo<PlottableHousehold[]>(
    () => (households.data ?? []).filter((h): h is PlottableHousehold => h.centerLat != null && h.centerLng != null),
    [households.data],
  )

  const moveMutation = useMutation({
    mutationFn: ({ id, lat, lng }: { id: string; lat: number; lng: number }) =>
      updateHousehold(id, { centerLat: lat, centerLng: lng }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['households'] })
      toast.success('Household location updated')
    },
    onError: (err) => toast.error('Could not move household', getApiErrorMessage(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteHousehold(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['households'] })
      toast.success('Household deleted')
      setDeleting(null)
      setEditing(null)
    },
    onError: (err) => toast.error('Could not delete household', getApiErrorMessage(err)),
  })

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <PageHeader
        title="Map"
        description="Pin households on the map, and manage each one's owner and family tree."
        actions={
          <>
            <Select value={wardId} onChange={(e) => setWardId(e.target.value)} className="sm:w-56">
              <option value="">All wards</option>
              {wards.data?.items.map((w) => (
                <option key={w.id} value={w.id}>
                  Ward {w.wardNumber}
                  {w.name ? ` — ${w.name}` : ''}
                </option>
              ))}
            </Select>
            {canCreate && (
              <Button
                variant={addMode ? 'danger' : 'primary'}
                icon={addMode ? <X className="size-4" /> : <Plus className="size-4" />}
                onClick={() => setAddMode((v) => !v)}
              >
                {addMode ? 'Cancel adding' : 'Add household'}
              </Button>
            )}
          </>
        }
      />

      {addMode && (
        <div className="mb-3 rounded-md border border-warning/20 bg-warning-bg px-3 py-2 text-[13px] text-warning">
          Click anywhere on the map to place a new household pin.
        </div>
      )}

      <div className="relative flex-1 overflow-hidden rounded-lg border border-border">
        <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} className="h-full w-full" scrollWheelZoom>
          <LayersControl position="topright">
            {/* Satellite first/default — seeing actual rooftops is the point when placing a pin
                on a specific house. Both layers come from Esri's free ArcGIS Online tile
                servers, not tile.openstreetmap.org — see docs/modules/08-household-map-ui.md
                for why (OSM's own servers explicitly disallow this kind of embedded app use and
                will block an IP that trips their usage policy). */}
            <LayersControl.BaseLayer checked name="Satellite">
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution="Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics"
                maxZoom={19}
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Streets">
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
                attribution="Tiles &copy; Esri"
                maxZoom={19}
              />
            </LayersControl.BaseLayer>
          </LayersControl>

          <FitToMarkers households={plottable} />
          <AddModeClickHandler
            active={addMode}
            onPick={(lat, lng) => {
              setAddMode(false)
              setPendingCoords({ lat, lng })
              setCreating(true)
            }}
          />

          {plottable.map((h) => (
            <Marker
              key={h.id}
              position={[h.centerLat, h.centerLng]}
              draggable={canUpdate}
              eventHandlers={{
                // Only open the edit form if they could actually save a change to it — matches
                // how every other list page in this app gates its "Edit" action on household:update
                // rather than showing an edit form no submit will ever succeed on.
                click: canUpdate ? () => setEditing(h) : undefined,
                dragend: (e) => {
                  const { lat, lng } = (e.target as L.Marker).getLatLng()
                  moveMutation.mutate({ id: h.id, lat, lng })
                },
              }}
            >
              <Tooltip>{h.address}</Tooltip>
            </Marker>
          ))}

          {creating && pendingCoords && <Marker position={[pendingCoords.lat, pendingCoords.lng]} />}
        </MapContainer>
      </div>

      <HouseholdModal
        open={creating}
        household={null}
        initialCoords={pendingCoords ?? undefined}
        onClose={() => {
          setCreating(false)
          setPendingCoords(null)
        }}
      />
      <HouseholdModal
        open={!!editing}
        household={editing}
        onClose={() => setEditing(null)}
        onManageFamily={
          editing && canManageFamily
            ? () => {
                setManagingFamily(editing)
                setEditing(null)
              }
            : undefined
        }
        onDelete={
          editing && canDelete
            ? () => {
                setDeleting(editing)
                setEditing(null)
              }
            : undefined
        }
      />
      <FamilyTreeModal open={!!managingFamily} household={managingFamily} onClose={() => setManagingFamily(null)} />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        title="Delete household?"
        description={`"${deleting?.address}" will be removed. Voters linked to it keep their own address and aren't deleted.`}
        confirmLabel="Delete"
        destructive
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
