import { z } from 'zod'

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(10, 'At least 10 characters')
      .regex(/[A-Za-z]/, 'Must contain a letter')
      .regex(/[0-9!@#$%^&*]/, 'Must contain a digit or symbol'),
    confirmPassword: z.string().min(1, 'Confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

export type ChangePasswordValues = z.infer<typeof changePasswordSchema>
