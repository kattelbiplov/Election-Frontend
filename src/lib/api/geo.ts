import { apiClient, unwrap, unwrapPaginated } from './client'
import type { District, GeoImportSummary, GeoJsonPolygon, Household, Municipality, MunicipalityType, Province, Tole, Ward } from '../types'

// --- Provinces --------------------------------------------------------------

export function listProvinces() {
  return unwrap<Province[]>(apiClient.get('/provinces'))
}

export function getProvince(id: string) {
  return unwrap<Province>(apiClient.get(`/provinces/${id}`))
}

export function createProvince(payload: { code: number; name: string; nameNepali?: string }) {
  return unwrap<Province>(apiClient.post('/provinces', payload))
}

export function updateProvince(id: string, payload: Partial<{ name: string; nameNepali: string }>) {
  return unwrap<Province>(apiClient.patch(`/provinces/${id}`, payload))
}

// --- Districts ---------------------------------------------------------------

export function listDistricts(params: { page?: number; pageSize?: number; provinceId?: string } = {}) {
  return unwrapPaginated<District>(apiClient.get('/districts', { params }))
}

export function getDistrict(id: string) {
  return unwrap<District>(apiClient.get(`/districts/${id}`))
}

export function createDistrict(payload: {
  provinceId: string
  code: string
  name: string
  nameNepali?: string
}) {
  return unwrap<District>(apiClient.post('/districts', payload))
}

export function updateDistrict(id: string, payload: Partial<{ name: string; nameNepali: string }>) {
  return unwrap<District>(apiClient.patch(`/districts/${id}`, payload))
}

// --- Municipalities ------------------------------------------------------------

export function listMunicipalities(
  params: { page?: number; pageSize?: number; districtId?: string; search?: string } = {},
) {
  return unwrapPaginated<Municipality>(apiClient.get('/municipalities', { params }))
}

export function getMunicipality(id: string) {
  return unwrap<Municipality>(apiClient.get(`/municipalities/${id}`))
}

export function createMunicipality(payload: {
  districtId: string
  code: string
  name: string
  nameNepali?: string
  type: MunicipalityType
  totalWards: number
}) {
  return unwrap<Municipality>(apiClient.post('/municipalities', payload))
}

export function updateMunicipality(
  id: string,
  payload: Partial<{ name: string; nameNepali: string; type: MunicipalityType; totalWards: number }>,
) {
  return unwrap<Municipality>(apiClient.patch(`/municipalities/${id}`, payload))
}

// --- Wards ---------------------------------------------------------------------

export function listWards(params: { page?: number; pageSize?: number; municipalityId?: string } = {}) {
  return unwrapPaginated<Ward>(apiClient.get('/wards', { params }))
}

export function getWard(id: string) {
  return unwrap<Ward>(apiClient.get(`/wards/${id}`))
}

export function createWard(payload: {
  municipalityId: string
  wardNumber: number
  name?: string
  population?: number
}) {
  return unwrap<Ward>(apiClient.post('/wards', payload))
}

export function updateWard(id: string, payload: Partial<{ name: string; population: number }>) {
  return unwrap<Ward>(apiClient.patch(`/wards/${id}`, payload))
}

// --- Toles -----------------------------------------------------------------------

export function listToles(
  params: { page?: number; pageSize?: number; wardId?: string; search?: string } = {},
) {
  return unwrapPaginated<Tole>(apiClient.get('/toles', { params }))
}

export function getTole(id: string) {
  return unwrap<Tole>(apiClient.get(`/toles/${id}`))
}

export function createTole(payload: {
  wardId: string
  name: string
  nameNepali?: string
  centerLat?: number
  centerLng?: number
  boundary?: GeoJsonPolygon
}) {
  return unwrap<Tole>(apiClient.post('/toles', payload))
}

export function updateTole(
  id: string,
  payload: Partial<{ name: string; nameNepali: string; centerLat: number; centerLng: number; boundary: GeoJsonPolygon }>,
) {
  return unwrap<Tole>(apiClient.patch(`/toles/${id}`, payload))
}

export function deleteTole(id: string) {
  return apiClient.delete(`/toles/${id}`)
}

// --- GIS (docs/modules/03-household-gis.md) -----------------------------------
// Confirmed against the live dev API: SuccessEnvelope<Household[]> (not paginated), and a plain
// 400 BAD_REQUEST (not 422) when the tole has no boundary set.

export function getToleBoundaryCheck(id: string) {
  return unwrap<Household[]>(apiClient.get(`/toles/${id}/boundary-check`))
}

// --- Nepal geo dataset import (docs/modules/05-geo-dataset-import.md) --------------
// SUPER_ADMIN-only, global (not org-scoped), synchronous — capped at 2,000 rows / 5MB by the
// server. Not persisted; the summary below is the only record of a given run.

export function importGeoDataset(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return unwrap<GeoImportSummary>(
    apiClient.post('/geo/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60_000,
    }),
  )
}
