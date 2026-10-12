import { apiClient, unwrap, unwrapPaginated } from './client'
import type {
  ContactMethod,
  ContactOutcome,
  FamilyRelationType,
  Gender,
  ImportIssueType,
  ImportJobStatus,
  SupportLevel,
  Voter,
  VoterContact,
  VoterImportJob,
  VoterImportRowIssue,
  VoterRelationship,
  VoterRelationshipView,
  VoterStatus,
} from '../types'

// --- Voters ------------------------------------------------------------------

export interface ListVotersParams {
  page?: number
  pageSize?: number
  wardId?: string
  toleId?: string
  householdId?: string
  gender?: Gender
  status?: VoterStatus
  supportLevel?: SupportLevel
  search?: string
}

export function listVoters(params: ListVotersParams = {}) {
  return unwrapPaginated<Voter>(apiClient.get('/voters', { params }))
}

export function getVoter(id: string) {
  return unwrap<Voter>(apiClient.get(`/voters/${id}`))
}

export interface CreateVoterPayload {
  wardId: string
  toleId?: string
  householdId?: string
  fullName: string
  dateOfBirth: string
  gender?: Gender
  fatherOrSpouseName?: string
  citizenshipNumber?: string
  voterIdNumber?: string
  phone?: string
  occupation?: string
  address?: string
  supportLevel?: SupportLevel
}

export function createVoter(payload: CreateVoterPayload) {
  return unwrap<Voter>(apiClient.post('/voters', payload))
}

export interface UpdateVoterPayload {
  toleId?: string | null
  householdId?: string | null
  fullName?: string
  dateOfBirth?: string
  gender?: Gender
  fatherOrSpouseName?: string | null
  citizenshipNumber?: string | null
  voterIdNumber?: string | null
  phone?: string | null
  occupation?: string | null
  address?: string | null
  status?: VoterStatus
  /** Not nullable server-side — it has a DB default (UNKNOWN), so it's set, never cleared. */
  supportLevel?: SupportLevel
}

export function updateVoter(id: string, payload: UpdateVoterPayload) {
  return unwrap<Voter>(apiClient.patch(`/voters/${id}`, payload))
}

export function deleteVoter(id: string) {
  return apiClient.delete(`/voters/${id}`)
}

// --- Voter import --------------------------------------------------------------

export interface ImportVotersPayload {
  wardId: string
  toleId?: string
  file: File
}

// Synchronous on the server (no job queue yet, per docs/modules/02-households-voters.md) — up to
// 10,000 rows in one request, so this needs a much longer timeout than the default client call.
export function importVoters({ wardId, toleId, file }: ImportVotersPayload) {
  const formData = new FormData()
  formData.append('wardId', wardId)
  if (toleId) formData.append('toleId', toleId)
  formData.append('file', file)
  return unwrap<VoterImportJob>(
    apiClient.post('/voters/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120_000,
    }),
  )
}

export interface ListImportJobsParams {
  page?: number
  pageSize?: number
  wardId?: string
  status?: ImportJobStatus
}

export function listImportJobs(params: ListImportJobsParams = {}) {
  return unwrapPaginated<VoterImportJob>(apiClient.get('/voters/import-jobs', { params }))
}

export function getImportJob(id: string) {
  return unwrap<VoterImportJob>(apiClient.get(`/voters/import-jobs/${id}`))
}

export interface ListImportIssuesParams {
  page?: number
  pageSize?: number
  issueType?: ImportIssueType
}

export function listImportIssues(jobId: string, params: ListImportIssuesParams = {}) {
  return unwrapPaginated<VoterImportRowIssue>(
    apiClient.get(`/voters/import-jobs/${jobId}/issues`, { params }),
  )
}

// --- Contact history (docs/modules/02-households-voters.md "Contact history") --------
// Append-only — no update/delete. Gated on the existing voter:update (create) / voter:read
// (list) permissions, no new permission was added server-side.

export interface ListVoterContactsParams {
  page?: number
  pageSize?: number
  method?: ContactMethod
  outcome?: ContactOutcome
}

export function listVoterContacts(voterId: string, params: ListVoterContactsParams = {}) {
  return unwrapPaginated<VoterContact>(apiClient.get(`/voters/${voterId}/contacts`, { params }))
}

export interface CreateVoterContactPayload {
  method: ContactMethod
  outcome: ContactOutcome
  /** If set, also overwrites the voter's current Voter.supportLevel server-side. */
  supportLevelObserved?: SupportLevel
  notes?: string
  /** ISO date-time; defaults to now server-side if omitted. Cannot be in the future. */
  contactedAt?: string
  canvassingVisitId?: string
}

export function createVoterContact(voterId: string, payload: CreateVoterContactPayload) {
  return unwrap<VoterContact>(apiClient.post(`/voters/${voterId}/contacts`, payload))
}

// --- Family relationships (docs/modules/09-household-family-tree.md) -----------------
// relatedVoterId must already be a real Voter — there is no "create inline" path here.

export interface CreateRelationshipPayload {
  relatedVoterId: string
  type: FamilyRelationType
}

export function createRelationship(voterId: string, payload: CreateRelationshipPayload) {
  return unwrap<VoterRelationship>(apiClient.post(`/voters/${voterId}/relationships`, payload))
}

export function listRelationships(voterId: string) {
  return unwrap<VoterRelationshipView[]>(apiClient.get(`/voters/${voterId}/relationships`))
}

export function deleteRelationship(voterId: string, relationshipId: string) {
  return apiClient.delete(`/voters/${voterId}/relationships/${relationshipId}`)
}
