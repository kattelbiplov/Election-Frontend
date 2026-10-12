import { useQuery } from '@tanstack/react-query'
import { getTole, getWard } from '../../lib/api/geo'
import { queryKeys } from '../../lib/queryKeys'
import { Skeleton } from '../ui/Skeleton'

export function WardLabel({ wardId }: { wardId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.ward(wardId),
    queryFn: () => getWard(wardId),
    staleTime: 5 * 60_000,
  })
  if (isLoading) return <Skeleton className="h-4 w-20" />
  if (!data) return <span className="text-text-muted">Unknown ward</span>
  return (
    <span>
      Ward {data.wardNumber}
      {data.name ? ` — ${data.name}` : ''}
    </span>
  )
}

export function ToleLabel({ toleId }: { toleId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.tole(toleId),
    queryFn: () => getTole(toleId),
    staleTime: 5 * 60_000,
  })
  if (isLoading) return <Skeleton className="h-4 w-20" />
  if (!data) return <span className="text-text-muted">Unknown tole</span>
  return <span>{data.name}</span>
}
