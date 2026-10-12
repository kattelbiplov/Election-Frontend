import { z } from 'zod'

const optionalNumeric = (message: string) =>
  z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((v) => !v || /^-?\d+(\.\d+)?$/.test(v), { message })

export const householdSchema = z.object({
  address: z.string().min(3, 'Address is required'),
  landmark: z.string().optional().or(z.literal('')),
  centerLat: optionalNumeric('Must be a number between -90 and 90'),
  centerLng: optionalNumeric('Must be a number between -180 and 180'),
})

export type HouseholdValues = z.infer<typeof householdSchema>
