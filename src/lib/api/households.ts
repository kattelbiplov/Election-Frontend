import { apiClient, unwrap, unwrapPaginated } from './client'
import type { FamilyTree, GeoJsonPolygon, Household, HouseholdWithDistance } from '../types'

export interface ListHouseholdsParams {
  page?: number
  pageSize?: number
  wardId?: string
  toleId?: string
  search?: string
}

export function listHouseholds(params: ListHouseholdsParams = {}) {
  return unwrapPaginated<Household>(apiClient.get('/households', { params }))
}

// The map needs every household with coordinates at once, not one page — loops at the max page
// size (200) until every page is in, same shape as the old standalone map's fetchAllPages().
export async function fetchAllHouseholds(params: Omit<ListHouseholdsParams, 'page' | 'pageSize'> = {}): Promise<Household[]> {
  const items: Household[] = []
  let page = 1
  for (;;) {
    const result = await listHouseholds({ ...params, page, pageSize: 200 })
    items.push(...result.items)
    if (page >= result.pagination.totalPages) break
    page += 1
  }
  return items
}

export function getHousehold(id: string) {
  return unwrap<Household>(apiClient.get(`/households/${id}`))
}

export interface CreateHouseholdPayload {
  wardId: string
  toleId?: string
  address: string
  landmark?: string
  centerLat?: number
  centerLng?: number
}

export function createHousehold(payload: CreateHouseholdPayload) {
  return unwrap<Household>(apiClient.post('/households', payload))
}

export interface UpdateHouseholdPayload {
  toleId?: string | null
  address?: string
  landmark?: string | null
  centerLat?: number | null
  centerLng?: number | null
  /** Module 09 — must already be a Voter linked to this household (see Household.headOfHouseholdId). */
  headOfHouseholdId?: string | null
}

export function updateHousehold(id: string, payload: UpdateHouseholdPayload) {
  return unwrap<Household>(apiClient.patch(`/households/${id}`, payload))
}

export function deleteHousehold(id: string) {
  return apiClient.delete(`/households/${id}`)
}

// --- GIS (docs/modules/03-household-gis.md) -----------------------------------
// Response shapes confirmed against the live dev API — see the comment above
// HouseholdWithDistance in lib/types.ts. Both endpoints paginate, including the POST search.

export interface NearbyHouseholdsParams {
  lat: number
  lng: number
  /** Meters. Server caps this at 5000 (NEARBY_MAX_RADIUS_METERS). */
  radiusMeters: number
  page?: number
  pageSize?: number
}

export function listNearbyHouseholds(params: NearbyHouseholdsParams) {
  return unwrapPaginated<HouseholdWithDistance>(apiClient.get('/households/nearby', { params }))
}

export interface SearchHouseholdsWithinPolygonPayload {
  wardId: string
  polygon: GeoJsonPolygon
  page?: number
  pageSize?: number
}

export function searchHouseholdsWithinPolygon({ page, pageSize, ...body }: SearchHouseholdsWithinPolygonPayload) {
  return unwrapPaginated<Household>(
    apiClient.post('/households/search/within-polygon', body, { params: { page, pageSize } }),
  )
}

// --- Family tree (docs/modules/09-household-family-tree.md) -------------------
// Assembled live from VoterRelationship edges on every call — not stored/cached server-side.

export function getFamilyTree(id: string) {
  return unwrap<FamilyTree>(apiClient.get(`/households/${id}/family-tree`))
}
