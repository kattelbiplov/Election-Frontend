import { apiClient, unwrapPaginated } from './client'
import type { AuditLog } from '../types'

export interface ListAuditLogsParams {
  page?: number
  pageSize?: number
  entityType?: string
  entityId?: string
  actorUserId?: string
  action?: string
  from?: string
  to?: string
}

export function listAuditLogs(params: ListAuditLogsParams = {}) {
  return unwrapPaginated<AuditLog>(apiClient.get('/audit-logs', { params }))
}
