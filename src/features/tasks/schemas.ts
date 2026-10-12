import { z } from 'zod'

export const taskStatusOptions = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const
export const visitOutcomeOptions = ['PENDING', 'VISITED', 'NOT_HOME', 'REFUSED', 'INVALID_ADDRESS'] as const

export const TASK_STATUS_LABELS: Record<(typeof taskStatusOptions)[number], string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

export const TASK_STATUS_TONE: Record<(typeof taskStatusOptions)[number], 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  PENDING: 'neutral',
  IN_PROGRESS: 'info',
  COMPLETED: 'success',
  CANCELLED: 'danger',
}

export const VISIT_OUTCOME_LABELS: Record<(typeof visitOutcomeOptions)[number], string> = {
  PENDING: 'Not yet visited',
  VISITED: 'Visited',
  NOT_HOME: 'Not home',
  REFUSED: 'Refused',
  INVALID_ADDRESS: 'Invalid address',
}

export const VISIT_OUTCOME_TONE: Record<(typeof visitOutcomeOptions)[number], 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  PENDING: 'neutral',
  VISITED: 'success',
  NOT_HOME: 'warning',
  REFUSED: 'danger',
  INVALID_ADDRESS: 'neutral',
}

// wardId/toleId/householdIds are handled outside react-hook-form (see GeoCascadePicker /
// household-picker state in TaskModal), same pattern as HouseholdModal/VoterModal.
export const taskSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(150, 'Must be at most 150 characters'),
  description: z.string().max(2000, 'Must be at most 2000 characters').optional().or(z.literal('')),
  dueDate: z.string().optional().or(z.literal('')),
  assignedToId: z.string().min(1, 'Select an assignee'),
})

export type TaskValues = z.infer<typeof taskSchema>

export const visitUpdateSchema = z.object({
  outcome: z.enum(visitOutcomeOptions),
  notes: z.string().max(1000, 'Must be at most 1000 characters').optional().or(z.literal('')),
})

export type VisitUpdateValues = z.infer<typeof visitUpdateSchema>
