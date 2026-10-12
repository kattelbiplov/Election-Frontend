import { apiClient, unwrap } from './client'
import type { DashboardReport } from '../types'

export interface DashboardReportParams {
  wardId?: string
  toleId?: string
}

// A wardId/toleId outside the caller's own geo scope returns an all-zero summary, not a 403 —
// same "scope filter AND explicit filter" pattern listHouseholds/listVoters use. A wardId/toleId
// that doesn't exist at all still 400s. See docs/modules/07-reporting-analytics.md.
export function getDashboardReport(params: DashboardReportParams = {}) {
  return unwrap<DashboardReport>(apiClient.get('/reports/dashboard', { params }))
}
