import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { UserPlus } from 'lucide-react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { SearchInput } from '../../components/ui/SearchInput'
import { FormField } from '../../components/ui/FormField'
import { FamilyTreeView } from './FamilyTreeView'
import { getFamilyTree, getHousehold } from '../../lib/api/households'
import { listVoters, updateVoter, createRelationship } from '../../lib/api/voters'
import { updateHousehold } from '../../lib/api/households'
import { queryKeys } from '../../lib/queryKeys'
import { useDebounce } from '../../hooks/useDebounce'
import { toast } from '../../store/toastStore'
import { getApiErrorMessage } from '../../lib/api/client'
import type { FamilyRelationType, Household } from '../../lib/types'

const relationTypeOptions: { value: FamilyRelationType; label: string }[] = [
  { value: 'SPOUSE', label: 'is the spouse of' },
  { value: 'PARENT_OF', label: 'is the parent of' },
]

// Everyone offered here is drawn from `residents` (voters already linked to this household) or
// from the ward-scoped search below — never free-typed. See
// docs/modules/09-household-family-tree.md ("What was asked for, and the one constraint that
// shaped it"). Search is scoped to the household's own ward because
// PATCH /voters/{id} (how linking actually works) rejects linking a voter to a household outside
// their ward — an unscoped search would surface results guaranteed to fail if clicked (a real
// bug caught by browser-testing the standalone map page first; see that module doc).
export function FamilyTreeModal({
  open,
  household: householdProp,
  onClose,
}: {
  open: boolean
  household: Household | null
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const householdId = householdProp?.id
  const wardId = householdProp?.wardId

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search)
  const [relFromId, setRelFromId] = useState('')
  const [relType, setRelType] = useState<FamilyRelationType>('SPOUSE')
  const [relToId, setRelToId] = useState('')

  // Fetched fresh (not just the possibly-stale `household` prop from the map's marker list) so
  // the owner select reflects the latest headOfHouseholdId right after the mutation below.
  const household = useQuery({
    queryKey: queryKeys.household(householdId ?? ''),
    queryFn: () => getHousehold(householdId!),
    enabled: open && !!householdId,
  })

  const residentsParams = { householdId, pageSize: 200 }
  const residents = useQuery({
    queryKey: queryKeys.voters(residentsParams),
    queryFn: () => listVoters(residentsParams),
    enabled: open && !!householdId,
  })
  const residentOptions = residents.data?.items ?? []
  const residentIds = new Set(residentOptions.map((v) => v.id))

  const searchParams = { search: debouncedSearch, wardId, pageSize: 10 }
  const searchResults = useQuery({
    queryKey: queryKeys.voters(searchParams),
    queryFn: () => listVoters(searchParams),
    enabled: open && !!wardId && debouncedSearch.trim().length >= 2,
  })
  const linkableResults = (searchResults.data?.items ?? []).filter((v) => !residentIds.has(v.id))

  const tree = useQuery({
    queryKey: queryKeys.familyTree(householdId ?? ''),
    queryFn: () => getFamilyTree(householdId!),
    enabled: open && !!householdId,
  })

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ['voters'] })
    queryClient.invalidateQueries({ queryKey: ['households'] })
    if (householdId) queryClient.invalidateQueries({ queryKey: queryKeys.familyTree(householdId) })
  }

  const linkMutation = useMutation({
    mutationFn: (voterId: string) => updateVoter(voterId, { householdId: householdId! }),
    onSuccess: () => {
      setSearch('')
      invalidateAll()
    },
    onError: (err) => toast.error('Could not link voter', getApiErrorMessage(err)),
  })

  const ownerMutation = useMutation({
    mutationFn: (nextHeadId: string) => updateHousehold(householdId!, { headOfHouseholdId: nextHeadId || null }),
    onSuccess: invalidateAll,
    onError: (err) => toast.error('Could not set house owner', getApiErrorMessage(err)),
  })

  const relationshipMutation = useMutation({
    mutationFn: () => createRelationship(relFromId, { relatedVoterId: relToId, type: relType }),
    onSuccess: () => {
      toast.success('Relationship added')
      setRelFromId('')
      setRelToId('')
      invalidateAll()
    },
    onError: (err) => toast.error('Could not add relationship', getApiErrorMessage(err)),
  })

  return (
    <Modal open={open} onClose={onClose} title="Family" description={householdProp?.address} size="lg">
      <div className="flex flex-col gap-6">
        <FormField
          label="House owner"
          htmlFor="ft-owner"
          hint={tree.data ? `Family members: ${tree.data.totalFamilyMembers}` : undefined}
        >
          <Select
            id="ft-owner"
            value={household.data?.headOfHouseholdId ?? ''}
            disabled={residentOptions.length === 0 || ownerMutation.isPending}
            onChange={(e) => ownerMutation.mutate(e.target.value)}
          >
            <option value="">— none —</option>
            {residentOptions.map((v) => (
              <option key={v.id} value={v.id}>
                {v.fullName}
              </option>
            ))}
          </Select>
        </FormField>

        <div>
          <h3 className="mb-2 text-[13px] font-semibold text-text">Residents linked to this household</h3>
          {residents.isLoading ? (
            <p className="text-[13px] text-text-secondary">Loading…</p>
          ) : residentOptions.length === 0 ? (
            <p className="text-[13px] text-text-secondary">No voters linked to this household yet.</p>
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border">
              {residentOptions.map((v) => (
                <li key={v.id} className="flex items-center justify-between px-3 py-2 text-[13px]">
                  <span>{v.fullName}</span>
                  <span className="text-[11.5px] text-text-secondary">{v.gender ?? ''}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-3">
            <SearchInput value={search} onChange={setSearch} placeholder="Search voters by name to link…" />
            {debouncedSearch.trim().length >= 2 && (
              <ul className="mt-2 divide-y divide-border rounded-md border border-border">
                {searchResults.isLoading ? (
                  <li className="px-3 py-2 text-[13px] text-text-secondary">Searching…</li>
                ) : linkableResults.length === 0 ? (
                  <li className="px-3 py-2 text-[13px] text-text-secondary">No matching voters found in this ward.</li>
                ) : (
                  linkableResults.map((v) => (
                    <li key={v.id} className="flex items-center justify-between px-3 py-2 text-[13px]">
                      <span>{v.fullName}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<UserPlus className="size-3.5" />}
                        loading={linkMutation.isPending}
                        onClick={() => linkMutation.mutate(v.id)}
                      >
                        Link
                      </Button>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-[13px] font-semibold text-text">Add a relationship</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-center">
            <Select value={relFromId} onChange={(e) => setRelFromId(e.target.value)}>
              <option value="">Select person...</option>
              {residentOptions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.fullName}
                </option>
              ))}
            </Select>
            <Select value={relType} onChange={(e) => setRelType(e.target.value as FamilyRelationType)}>
              {relationTypeOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
            <Select value={relToId} onChange={(e) => setRelToId(e.target.value)}>
              <option value="">Select person...</option>
              {residentOptions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.fullName}
                </option>
              ))}
            </Select>
            <Button
              disabled={!relFromId || !relToId || relFromId === relToId}
              loading={relationshipMutation.isPending}
              onClick={() => relationshipMutation.mutate()}
            >
              Add
            </Button>
          </div>
        </div>

        <div>
          <h3 className="mb-1 text-[13px] font-semibold text-text">Family tree</h3>
          {tree.isLoading ? (
            <p className="py-6 text-center text-[13px] text-text-secondary">Loading…</p>
          ) : tree.data ? (
            <FamilyTreeView tree={tree.data} />
          ) : null}
        </div>
      </div>
    </Modal>
  )
}
