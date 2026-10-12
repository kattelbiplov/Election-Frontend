import { apiClient, unwrap, unwrapPaginated } from './client'
import type { Gender, User, UserGeoAssignment, UserRole, UserStatus } from '../types'

export interface ListUsersParams {
  page?: number
  pageSize?: number
  role?: UserRole
  status?: UserStatus
  search?: string
  wardId?: string
}

export function listUsers(params: ListUsersParams = {}) {
  return unwrapPaginated<User>(apiClient.get('/users', { params }))
}

export function getUser(id: string) {
  return unwrap<User>(apiClient.get(`/users/${id}`))
}

export interface CreateUserPayload {
  name: string
  email: string
  phone?: string
  password: string
  role: UserRole
  address?: string
  dateOfBirth?: string
  gender?: Gender
}

export function createUser(payload: CreateUserPayload) {
  return unwrap<User>(apiClient.post('/users', payload))
}

export interface UpdateUserPayload {
  name?: string
  phone?: string | null
  role?: UserRole
  status?: UserStatus
  address?: string | null
  dateOfBirth?: string | null
  gender?: Gender | null
}

export function updateUser(id: string, payload: UpdateUserPayload) {
  return unwrap<User>(apiClient.patch(`/users/${id}`, payload))
}

export function deactivateUser(id: string) {
  return apiClient.delete(`/users/${id}`)
}

export interface CreateAssignmentPayload {
  wardId: string
  toleId?: string
}

export function createAssignment(userId: string, payload: CreateAssignmentPayload) {
  return unwrap<UserGeoAssignment>(apiClient.post(`/users/${userId}/assignments`, payload))
}

export function deleteAssignment(userId: string, assignmentId: string) {
  return apiClient.delete(`/users/${userId}/assignments/${assignmentId}`)
}
