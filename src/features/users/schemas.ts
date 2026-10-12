import { z } from 'zod'

const roleEnum = z.enum([
  'SUPER_ADMIN',
  'CAMPAIGN_ADMIN',
  'WARD_MANAGER',
  'TOLE_COORDINATOR',
  'FIELD_WORKER',
  'VOLUNTEER',
  'ANALYST',
  'VIEW_ONLY',
])

// Mainly meaningful for FIELD_WORKER/VOLUNTEER accounts — see docs/modules/01-auth-rbac-geo.md —
// but plain nullable columns on User, so any role may carry them.
const bioFields = {
  address: z.string().optional().or(z.literal('')),
  dateOfBirth: z.string().optional().or(z.literal('')),
  gender: z.union([z.enum(['MALE', 'FEMALE', 'OTHER']), z.literal('')]).optional(),
}

export const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  phone: z.string().optional().or(z.literal('')),
  password: z
    .string()
    .min(10, 'At least 10 characters')
    .regex(/[A-Za-z]/, 'Must contain a letter')
    .regex(/[0-9!@#$%^&*]/, 'Must contain a digit or symbol'),
  role: roleEnum,
  ...bioFields,
})

export type CreateUserValues = z.infer<typeof createUserSchema>

export const editUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional().or(z.literal('')),
  role: roleEnum,
  status: z.enum(['ACTIVE', 'SUSPENDED', 'INVITED']),
  ...bioFields,
})

export type EditUserValues = z.infer<typeof editUserSchema>

export const assignmentSchema = z.object({
  provinceId: z.string(),
  districtId: z.string(),
  municipalityId: z.string(),
  wardId: z.string().min(1, 'Select a ward'),
  toleId: z.string().optional(),
})

export type AssignmentValues = z.infer<typeof assignmentSchema>
