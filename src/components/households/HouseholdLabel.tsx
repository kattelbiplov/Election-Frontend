import { useQuery } from '@tanstack/react-query'
import { getHousehold } from '../../lib/api/households'
import { queryKeys } from '../../lib/queryKeys'
import { Skeleton } from '../ui/Skeleton'

export function HouseholdLabel({ householdId }: { householdId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.household(householdId),
    queryFn: () => getHousehold(householdId),
    staleTime: 5 * 60_000,
  })
  if (isLoading) return <Skeleton className="h-4 w-32" />
  if (!data) return <span className="text-text-muted">Unknown household</span>
  return <span>{data.address}</span>
}
