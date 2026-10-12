import { z } from 'zod'

export const createOrganizationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use lowercase-kebab-case, e.g. my-campaign'),
  adminName: z.string().min(2, "Admin's name must be at least 2 characters"),
  adminEmail: z.string().min(1, 'Admin email is required').email('Enter a valid email address'),
  adminPassword: z
    .string()
    .min(10, 'At least 10 characters')
    .regex(/[A-Za-z]/, 'Must contain a letter')
    .regex(/[0-9!@#$%^&*]/, 'Must contain a digit or symbol'),
})

export type CreateOrganizationValues = z.infer<typeof createOrganizationSchema>

export const editOrganizationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
})

export type EditOrganizationValues = z.infer<typeof editOrganizationSchema>
