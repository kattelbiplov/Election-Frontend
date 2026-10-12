import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MapPin, Plus, Trash2 } from 'lucide-react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { FormField } from '../../components/ui/FormField'
import { GeoCascadePicker } from '../../components/geo/GeoCascadePicker'
import { WardLabel, ToleLabel } from '../../components/geo/GeoLabel'
import { createAssignment, deleteAssignment } from '../../lib/api/users'
import { toast } from '../../store/toastStore'
import { getApiErrorMessage } from '../../lib/api/client'
import type { User, UserGeoAssignment } from '../../lib/types'
import { useQuery } from '@tanstack/react-query'
import { listToles } from '../../lib/api/geo'
import { queryKeys } from '../../lib/queryKeys'

const emptyPicker = { provinceId: '', districtId: '', municipalityId: '', wardId: '' }

export function AssignmentsModal({ user, onClose }: { user: User | null; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [picker, setPicker] = useState(emptyPicker)
  const [toleId, setToleId] = useState('')
  const [assignments, setAssignments] = useState<UserGeoAssignment[]>([])

  useEffect(() => {
    if (user) {
      setPicker(emptyPicker)
      setToleId('')
      setAssignments(user.geoAssignments ?? [])
    }
  }, [user])

  const toles = useQuery({
    queryKey: queryKeys.toles({ wardId: picker.wardId }),
    queryFn: () => listToles({ wardId: picker.wardId, pageSize: 200 }),
    enabled: !!picker.wardId,
  })

  const createMutation = useMutation({
    mutationFn: () => createAssignment(user!.id, { wardId: picker.wardId, toleId: toleId || undefined }),
    onSuccess: (assignment) => {
      setAssignments((prev) => [assignment, ...prev])
      setPicker(emptyPicker)
      setToleId('')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Assignment added')
    },
    onError: (err) => toast.error('Could not add assignment', getApiErrorMessage(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: (assignmentId: string) => deleteAssignment(user!.id, assignmentId),
    onSuccess: (_data, assignmentId) => {
      setAssignments((prev) => prev.filter((a) => a.id !== assignmentId))
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Assignment removed')
    },
    onError: (err) => toast.error('Could not remove assignment', getApiErrorMessage(err)),
  })

  return (
    <Modal
      open={!!user}
      onClose={onClose}
      title={`Geo assignments — ${user?.name}`}
      description="Grants working access to a ward, or a specific tole within it."
      size="lg"
    >
      <div className="flex flex-col gap-5">
        <div className="rounded-md border border-border bg-bg p-4">
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
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
            <FormField label="Tole (optional)" htmlFor="assign-tole" hint="Leave blank to grant the whole ward">
              <Select id="assign-tole" value={toleId} disabled={!picker.wardId || toles.isLoading} onChange={(e) => setToleId(e.target.value)}>
                <option value="">Whole ward</option>
                {toles.data?.items.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <div className="flex items-end">
              <Button
                icon={<Plus className="size-4" />}
                disabled={!picker.wardId}
                loading={createMutation.isPending}
                onClick={() => createMutation.mutate()}
                className="w-full sm:w-auto"
              >
                Add
              </Button>
            </div>
          </div>
        </div>

        <div>
          {assignments.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-border py-8 text-center">
              <MapPin className="size-5 text-text-muted" />
              <p className="text-[13px] text-text-secondary">No assignments added yet</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {assignments.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 rounded-md border border-border px-3.5 py-2.5">
                  <div className="min-w-0 text-[13px]">
                    <WardLabel wardId={a.wardId} />
                    {a.toleId && (
                      <span className="text-text-secondary">
                        {' '}
                        · <ToleLabel toleId={a.toleId} />
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 className="size-3.5" />}
                    className="text-danger hover:bg-danger-bg"
                    loading={deleteMutation.isPending && deleteMutation.variables === a.id}
                    onClick={() => deleteMutation.mutate(a.id)}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  )
}
