import { z } from 'zod'

export const genderOptions = ['MALE', 'FEMALE', 'OTHER'] as const
export const voterStatusOptions = ['ACTIVE', 'DECEASED', 'MOVED'] as const
export const supportLevelOptions = [
  'STRONG_SUPPORTER',
  'LEAN_SUPPORTER',
  'UNDECIDED',
  'LEAN_OPPOSED',
  'STRONG_OPPOSED',
  'UNKNOWN',
] as const

export const GENDER_LABELS: Record<(typeof genderOptions)[number], string> = {
  MALE: 'Male',
  FEMALE: 'Female',
  OTHER: 'Other',
}

export const VOTER_STATUS_LABELS: Record<(typeof voterStatusOptions)[number], string> = {
  ACTIVE: 'Active',
  DECEASED: 'Deceased',
  MOVED: 'Moved',
}

export const SUPPORT_LEVEL_LABELS: Record<(typeof supportLevelOptions)[number], string> = {
  STRONG_SUPPORTER: 'Strong supporter',
  LEAN_SUPPORTER: 'Lean supporter',
  UNDECIDED: 'Undecided',
  LEAN_OPPOSED: 'Lean opposed',
  STRONG_OPPOSED: 'Strong opposed',
  UNKNOWN: 'Unknown',
}

export const SUPPORT_LEVEL_TONE: Record<(typeof supportLevelOptions)[number], 'success' | 'warning' | 'danger' | 'neutral'> = {
  STRONG_SUPPORTER: 'success',
  LEAN_SUPPORTER: 'success',
  UNDECIDED: 'warning',
  LEAN_OPPOSED: 'danger',
  STRONG_OPPOSED: 'danger',
  UNKNOWN: 'neutral',
}

export const contactMethodOptions = ['DOOR_KNOCK', 'PHONE_CALL', 'TEXT_MESSAGE', 'EMAIL', 'EVENT', 'OTHER'] as const
export const contactOutcomeOptions = ['REACHED', 'NOT_REACHED', 'REFUSED', 'WRONG_CONTACT_INFO'] as const

export const CONTACT_METHOD_LABELS: Record<(typeof contactMethodOptions)[number], string> = {
  DOOR_KNOCK: 'Door knock',
  PHONE_CALL: 'Phone call',
  TEXT_MESSAGE: 'Text message',
  EMAIL: 'Email',
  EVENT: 'Event',
  OTHER: 'Other',
}

export const CONTACT_OUTCOME_LABELS: Record<(typeof contactOutcomeOptions)[number], string> = {
  REACHED: 'Reached',
  NOT_REACHED: 'Not reached',
  REFUSED: 'Refused',
  WRONG_CONTACT_INFO: 'Wrong contact info',
}

export const CONTACT_OUTCOME_TONE: Record<(typeof contactOutcomeOptions)[number], 'success' | 'warning' | 'danger' | 'neutral'> = {
  REACHED: 'success',
  NOT_REACHED: 'warning',
  REFUSED: 'danger',
  WRONG_CONTACT_INFO: 'neutral',
}

export const contactSchema = z.object({
  method: z.enum(contactMethodOptions),
  outcome: z.enum(contactOutcomeOptions),
  supportLevelObserved: z.union([z.enum(supportLevelOptions), z.literal('')]).optional(),
  notes: z.string().max(1000, 'Must be at most 1000 characters').optional().or(z.literal('')),
  contactedAt: z.string().optional().or(z.literal('')),
})

export type ContactValues = z.infer<typeof contactSchema>

export const voterSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(150, 'Must be at most 150 characters'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.union([z.enum(genderOptions), z.literal('')]).optional(),
  fatherOrSpouseName: z.string().optional().or(z.literal('')),
  citizenshipNumber: z.string().optional().or(z.literal('')),
  voterIdNumber: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  occupation: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  status: z.enum(voterStatusOptions),
  supportLevel: z.enum(supportLevelOptions),
})

export type VoterValues = z.infer<typeof voterSchema>
