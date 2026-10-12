import type { UserRole } from './types'

// Client-side mirror of src/middleware/permissions.ts (ROLE_PERMISSIONS) in the API repo.
// This ONLY controls what the UI shows/hides for a smoother experience — the server is the
// real authority and re-checks every request (plus geo-scoping on top, which this can't see).
// See docs/modules/01-auth-rbac-geo.md ("Roles & permission matrix").

export type Permission =
  | 'org:list' // GET /organizations — platform-wide list
  | 'org:manage_own' // GET/PATCH own organization (name)
  | 'org:manage_status' // PATCH organization status (suspend/activate)
  | 'users:manage' // create/update/deactivate users
  | 'users:assign' // assign users to ward/tole
  | 'users:read'
  | 'geo:read'
  | 'geo:manage_admin_units' // provinces/districts/municipalities
  | 'ward:manage'
  | 'tole:create'
  | 'tole:update'
  | 'tole:delete'
  | 'audit:read'
  | 'household:read'
  | 'household:create'
  | 'household:update'
  | 'household:delete'
  | 'voter:read'
  | 'voter:create'
  | 'voter:update'
  | 'voter:delete'
  | 'voter:import' // trigger a new import
  | 'voter:import_read' // view past import jobs/issues (ANALYST gets this without 'voter:import')
  | 'task:create'
  | 'task:read'
  | 'task:update' // retitle/reassign/reschedule/cancel a task
  | 'task:delete'
  | 'task:visit_update' // record a household visit outcome
  | 'report:read'

const ALL_ROLES: UserRole[] = [
  'SUPER_ADMIN',
  'CAMPAIGN_ADMIN',
  'WARD_MANAGER',
  'TOLE_COORDINATOR',
  'FIELD_WORKER',
  'VOLUNTEER',
  'ANALYST',
  'VIEW_ONLY',
]

export const ROLE_PERMISSIONS: Record<Permission, UserRole[]> = {
  'org:list': ['SUPER_ADMIN'],
  'org:manage_own': ['SUPER_ADMIN', 'CAMPAIGN_ADMIN'],
  'org:manage_status': ['SUPER_ADMIN'],
  'users:manage': ['SUPER_ADMIN', 'CAMPAIGN_ADMIN'],
  'users:assign': ['SUPER_ADMIN', 'CAMPAIGN_ADMIN'],
  'users:read': ['SUPER_ADMIN', 'CAMPAIGN_ADMIN', 'WARD_MANAGER', 'TOLE_COORDINATOR', 'ANALYST'],
  'geo:read': ALL_ROLES,
  'geo:manage_admin_units': ['SUPER_ADMIN'],
  'ward:manage': ['SUPER_ADMIN', 'CAMPAIGN_ADMIN'],
  'tole:create': ['SUPER_ADMIN', 'CAMPAIGN_ADMIN', 'WARD_MANAGER'],
  'tole:update': ['SUPER_ADMIN', 'CAMPAIGN_ADMIN', 'WARD_MANAGER', 'TOLE_COORDINATOR'],
  'tole:delete': ['SUPER_ADMIN', 'CAMPAIGN_ADMIN'],
  'audit:read': ['SUPER_ADMIN', 'CAMPAIGN_ADMIN', 'WARD_MANAGER', 'ANALYST'],
  // Households/voters are PII, unlike geo reference data — the server additionally scopes reads
  // to a WARD_MANAGER/TOLE_COORDINATOR/FIELD_WORKER/VOLUNTEER's own ward/tole assignment, which
  // this client-side permission map can't see. See docs/modules/02-households-voters.md.
  // VOLUNTEER has the exact same household/voter permissions as FIELD_WORKER (a roster/reporting
  // distinction, not a capability one — see "VOLUNTEER" in docs/modules/01-auth-rbac-geo.md).
  'household:read': ALL_ROLES,
  'household:create': ['SUPER_ADMIN', 'CAMPAIGN_ADMIN', 'WARD_MANAGER', 'TOLE_COORDINATOR', 'FIELD_WORKER', 'VOLUNTEER'],
  // FIELD_WORKER/VOLUNTEER can create a household but not edit it afterward — unlike voters,
  // where they also get update. Confirmed against the real ROLE_PERMISSIONS map, not inferred.
  'household:update': ['SUPER_ADMIN', 'CAMPAIGN_ADMIN', 'WARD_MANAGER', 'TOLE_COORDINATOR'],
  'household:delete': ['SUPER_ADMIN', 'CAMPAIGN_ADMIN', 'WARD_MANAGER'],
  'voter:read': ALL_ROLES,
  'voter:create': ['SUPER_ADMIN', 'CAMPAIGN_ADMIN', 'WARD_MANAGER', 'TOLE_COORDINATOR', 'FIELD_WORKER', 'VOLUNTEER'],
  'voter:update': ['SUPER_ADMIN', 'CAMPAIGN_ADMIN', 'WARD_MANAGER', 'TOLE_COORDINATOR', 'FIELD_WORKER', 'VOLUNTEER'],
  'voter:delete': ['SUPER_ADMIN', 'CAMPAIGN_ADMIN', 'WARD_MANAGER'],
  'voter:import': ['SUPER_ADMIN', 'CAMPAIGN_ADMIN', 'WARD_MANAGER'],
  'voter:import_read': ['SUPER_ADMIN', 'CAMPAIGN_ADMIN', 'WARD_MANAGER', 'ANALYST'],
  // FIELD_WORKER/VOLUNTEER get task:read + task:visit_update only — they work tasks assigned to
  // them, not create/reassign/cancel. The server additionally forces their list/detail queries to
  // "assigned to me" regardless of query params. See docs/modules/04-canvassing-tasks.md.
  'task:create': ['SUPER_ADMIN', 'CAMPAIGN_ADMIN', 'WARD_MANAGER', 'TOLE_COORDINATOR'],
  'task:read': ALL_ROLES,
  'task:update': ['SUPER_ADMIN', 'CAMPAIGN_ADMIN', 'WARD_MANAGER', 'TOLE_COORDINATOR'],
  'task:delete': ['SUPER_ADMIN', 'CAMPAIGN_ADMIN', 'WARD_MANAGER'],
  'task:visit_update': ['SUPER_ADMIN', 'CAMPAIGN_ADMIN', 'WARD_MANAGER', 'TOLE_COORDINATOR', 'FIELD_WORKER', 'VOLUNTEER'],
  // Not FIELD_WORKER/VOLUNTEER — they have no use case for campaign-wide analytics, only their
  // own assigned households/voters/tasks, which their existing permissions already cover.
  'report:read': ['SUPER_ADMIN', 'CAMPAIGN_ADMIN', 'WARD_MANAGER', 'TOLE_COORDINATOR', 'ANALYST', 'VIEW_ONLY'],
}

export function hasPermission(role: UserRole | undefined, permission: Permission): boolean {
  if (!role) return false
  return ROLE_PERMISSIONS[permission].includes(role)
}

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  CAMPAIGN_ADMIN: 'Campaign Admin',
  WARD_MANAGER: 'Ward Manager',
  TOLE_COORDINATOR: 'Tole Coordinator',
  FIELD_WORKER: 'Field Worker',
  VOLUNTEER: 'Volunteer',
  ANALYST: 'Analyst',
  VIEW_ONLY: 'View Only',
}
