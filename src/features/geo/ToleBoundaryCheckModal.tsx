import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle2, MapPinOff } from 'lucide-react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import { getToleBoundaryCheck } from '../../lib/api/geo'
import { queryKeys } from '../../lib/queryKeys'
import { getApiErrorCode, getApiErrorMessage } from '../../lib/api/client'
import type { Tole } from '../../lib/types'

export function ToleBoundaryCheckModal({ tole, onClose }: { tole: Tole | null; onClose: () => void }) {
  const query = useQuery({
    queryKey: queryKeys.toleBoundaryCheck(tole?.id ?? ''),
    queryFn: () => getToleBoundaryCheck(tole!.id),
    enabled: !!tole,
    retry: false,
  })

  const noBoundary = getApiErrorCode(query.error) === 'BAD_REQUEST'

  return (
    <Modal
      open={!!tole}
      onClose={onClose}
      title="Boundary check"
      description={tole ? `Households assigned to "${tole.name}" whose location falls outside its drawn boundary.` : undefined}
      size="lg"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      {query.isLoading ? (
        <div className="flex flex-col gap-2.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : query.isError ? (
        <EmptyState
          icon={<MapPinOff className="size-6" />}
          title={noBoundary ? "This tole doesn't have a boundary yet" : 'Could not run the boundary check'}
          description={noBoundary ? 'Edit the tole and add a GeoJSON polygon under "Boundary" to enable this report.' : getApiErrorMessage(query.error)}
        />
      ) : !query.data?.length ? (
        <EmptyState
          icon={<CheckCircle2 className="size-6 text-success" />}
          title="No mismatches found"
          description="Every household assigned to this tole falls within its drawn boundary."
        />
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-2 rounded-md bg-warning-bg px-3.5 py-3 text-[13px] text-warning">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>
              <span className="font-semibold">{query.data.length}</span>{' '}
              household{query.data.length === 1 ? '' : 's'} assigned to this tole {query.data.length === 1 ? 'is' : 'are'} outside its
              drawn boundary — worth a second look for a stale assignment or a geocoding mistake.
            </p>
          </div>
          <ul className="flex flex-col gap-2">
            {query.data.map((household) => (
              <li key={household.id} className="rounded-md border border-border px-3.5 py-2.5">
                <p className="text-[13.5px] font-medium text-text">{household.address}</p>
                {household.landmark && <p className="text-[12.5px] text-text-secondary">{household.landmark}</p>}
                {household.centerLat != null && household.centerLng != null && (
                  <p className="mt-1 font-mono text-[11.5px] text-text-muted">
                    {household.centerLat.toFixed(5)}, {household.centerLng.toFixed(5)}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Modal>
  )
}
