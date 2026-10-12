import { apiClient, unwrap, unwrapPaginated } from './client'
import type { CanvassingTask, CanvassingVisit, TaskStatus, VisitOutcome } from '../types'

// --- Tasks ---------------------------------------------------------------------

export interface ListTasksParams {
  page?: number
  pageSize?: number
  wardId?: string
  toleId?: string
  assignedToId?: string
  status?: TaskStatus
}

export function listTasks(params: ListTasksParams = {}) {
  return unwrapPaginated<CanvassingTask>(apiClient.get('/canvassing-tasks', { params }))
}

export function getTask(id: string) {
  return unwrap<CanvassingTask>(apiClient.get(`/canvassing-tasks/${id}`))
}

export interface CreateTaskPayload {
  wardId: string
  toleId?: string
  title: string
  description?: string
  dueDate?: string
  assignedToId: string
  /** Explicit household list (max 500); omit to auto-select everything in toleId/wardId. */
  householdIds?: string[]
}

export function createTask(payload: CreateTaskPayload) {
  return unwrap<CanvassingTask>(apiClient.post('/canvassing-tasks', payload))
}

export interface UpdateTaskPayload {
  title?: string
  description?: string | null
  dueDate?: string | null
  assignedToId?: string
  status?: TaskStatus
}

export function updateTask(id: string, payload: UpdateTaskPayload) {
  return unwrap<CanvassingTask>(apiClient.patch(`/canvassing-tasks/${id}`, payload))
}

export function deleteTask(id: string) {
  return apiClient.delete(`/canvassing-tasks/${id}`)
}

// --- Visits ----------------------------------------------------------------------

export interface ListVisitsParams {
  page?: number
  pageSize?: number
  outcome?: VisitOutcome
}

export function listVisits(taskId: string, params: ListVisitsParams = {}) {
  return unwrapPaginated<CanvassingVisit>(apiClient.get(`/canvassing-tasks/${taskId}/visits`, { params }))
}

export interface UpdateVisitPayload {
  outcome: VisitOutcome
  notes?: string
}

export function updateVisit(taskId: string, visitId: string, payload: UpdateVisitPayload) {
  return unwrap<CanvassingVisit>(apiClient.patch(`/canvassing-tasks/${taskId}/visits/${visitId}`, payload))
}
