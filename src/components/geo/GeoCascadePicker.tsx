import { useQuery } from '@tanstack/react-query'
import { Select } from '../ui/Select'
import { FormField } from '../ui/FormField'
import { listDistricts, listMunicipalities, listProvinces, listWards } from '../../lib/api/geo'
import { queryKeys } from '../../lib/queryKeys'

interface GeoCascadePickerProps {
  provinceId: string
  districtId: string
  municipalityId: string
  wardId: string
  onChange: (next: { provinceId: string; districtId: string; municipalityId: string; wardId: string }) => void
  errors?: { wardId?: string }
}

/**
 * Province -> District -> Municipality -> Ward cascading picker. Each level clears everything
 * beneath it on change. Selecting a ward is the point — the parent levels are just how you get
 * there, since Ward is the unit assignments/toles actually attach to.
 */
export function GeoCascadePicker({ provinceId, districtId, municipalityId, wardId, onChange, errors }: GeoCascadePickerProps) {
  const provinces = useQuery({ queryKey: queryKeys.provinces, queryFn: listProvinces })
  const districts = useQuery({
    queryKey: queryKeys.districts({ provinceId }),
    queryFn: () => listDistricts({ provinceId, pageSize: 200 }),
    enabled: !!provinceId,
  })
  const municipalities = useQuery({
    queryKey: queryKeys.municipalities({ districtId }),
    queryFn: () => listMunicipalities({ districtId, pageSize: 200 }),
    enabled: !!districtId,
  })
  const wards = useQuery({
    queryKey: queryKeys.wards({ municipalityId }),
    queryFn: () => listWards({ municipalityId, pageSize: 200 }),
    enabled: !!municipalityId,
  })

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <FormField label="Province" htmlFor="gc-province" required>
        <Select
          id="gc-province"
          value={provinceId}
          disabled={provinces.isLoading}
          onChange={(e) => onChange({ provinceId: e.target.value, districtId: '', municipalityId: '', wardId: '' })}
        >
          <option value="">Select province</option>
          {provinces.data?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField label="District" htmlFor="gc-district" required>
        <Select
          id="gc-district"
          value={districtId}
          disabled={!provinceId || districts.isLoading}
          onChange={(e) => onChange({ provinceId, districtId: e.target.value, municipalityId: '', wardId: '' })}
        >
          <option value="">{provinceId ? 'Select district' : 'Select province first'}</option>
          {districts.data?.items.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField label="Municipality" htmlFor="gc-municipality" required>
        <Select
          id="gc-municipality"
          value={municipalityId}
          disabled={!districtId || municipalities.isLoading}
          onChange={(e) => onChange({ provinceId, districtId, municipalityId: e.target.value, wardId: '' })}
        >
          <option value="">{districtId ? 'Select municipality' : 'Select district first'}</option>
          {municipalities.data?.items.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField label="Ward" htmlFor="gc-ward" error={errors?.wardId} required>
        <Select
          id="gc-ward"
          value={wardId}
          disabled={!municipalityId || wards.isLoading}
          onChange={(e) => onChange({ provinceId, districtId, municipalityId, wardId: e.target.value })}
        >
          <option value="">{municipalityId ? 'Select ward' : 'Select municipality first'}</option>
          {wards.data?.items.map((w) => (
            <option key={w.id} value={w.id}>
              Ward {w.wardNumber}
              {w.name ? ` — ${w.name}` : ''}
            </option>
          ))}
        </Select>
      </FormField>
    </div>
  )
}
