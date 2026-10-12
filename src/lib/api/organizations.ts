import { apiClient, unwrap, unwrapPaginated } from './client'
import type { Organization, OrganizationStatus, User } from '../types'

export interface ListOrganizationsParams {
  page?: number
  pageSize?: number
  search?: string
}

export function listOrganizations(params: ListOrganizationsParams = {}) {
  return unwrapPaginated<Organization>(apiClient.get('/organizations', { params }))
}

export function getOrganization(id: string) {
  return unwrap<Organization>(apiClient.get(`/organizations/${id}`))
}

export interface CreateOrganizationPayload {
  name: string
  slug: string
  adminName: string
  adminEmail: string
  adminPassword: string
}

export function createOrganization(payload: CreateOrganizationPayload) {
  return unwrap<{ organization: Organization; admin: User }>(
    apiClient.post('/organizations', payload),
  )
}

export interface UpdateOrganizationPayload {
  name?: string
  status?: OrganizationStatus
}

export function updateOrganization(id: string, payload: UpdateOrganizationPayload) {
  return unwrap<Organization>(apiClient.patch(`/organizations/${id}`, payload))
}
