import { z } from 'zod'
import { parsePolygonInput } from '../../lib/geojson'

// react-hook-form's zodResolver needs the form's TFieldValues type to match the schema's INPUT
// type exactly (zod v4 + @hookform/resolvers v5 no longer paper over coerce's input/output gap).
// So numeric fields stay strings in the form and get validated with a regex + Number() at the
// call site, instead of z.coerce.number().
const numeric = (message: string) => z.string().min(1, message).regex(/^-?\d+$/, message)
const optionalNumeric = (message: string) =>
  z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((v) => !v || /^-?\d+(\.\d+)?$/.test(v), { message })

export const provinceSchema = z.object({
  code: numeric('Must be a positive number'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  nameNepali: z.string().optional().or(z.literal('')),
})
export type ProvinceValues = z.infer<typeof provinceSchema>

export const districtSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  nameNepali: z.string().optional().or(z.literal('')),
})
export type DistrictValues = z.infer<typeof districtSchema>

export const municipalityTypes = [
  'METROPOLITAN_CITY',
  'SUB_METROPOLITAN_CITY',
  'MUNICIPALITY',
  'RURAL_MUNICIPALITY',
] as const

export const municipalityLabels: Record<(typeof municipalityTypes)[number], string> = {
  METROPOLITAN_CITY: 'Metropolitan City',
  SUB_METROPOLITAN_CITY: 'Sub-Metropolitan City',
  MUNICIPALITY: 'Municipality',
  RURAL_MUNICIPALITY: 'Rural Municipality',
}

export const municipalitySchema = z.object({
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  nameNepali: z.string().optional().or(z.literal('')),
  type: z.enum(municipalityTypes),
  totalWards: numeric('Must be a positive number'),
})
export type MunicipalityValues = z.infer<typeof municipalitySchema>

export const wardSchema = z.object({
  wardNumber: numeric('Must be a positive number'),
  name: z.string().optional().or(z.literal('')),
  population: optionalNumeric('Must be a number'),
})
export type WardValues = z.infer<typeof wardSchema>

export const toleSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  nameNepali: z.string().optional().or(z.literal('')),
  centerLat: optionalNumeric('Must be a number between -90 and 90'),
  centerLng: optionalNumeric('Must be a number between -180 and 180'),
  boundary: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((v) => !v || parsePolygonInput(v).ok, {
      message: 'Must be a valid, closed GeoJSON Polygon',
    }),
})
export type ToleValues = z.infer<typeof toleSchema>
