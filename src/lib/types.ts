// Mirrors docs/openapi.yaml schemas 1:1. Keep in sync with the backend contract.

export type UserRole =
  | 'SUPER_ADMIN'
  | 'CAMPAIGN_ADMIN'
  | 'WARD_MANAGER'
  | 'TOLE_COORDINATOR'
  | 'FIELD_WORKER'
  | 'VOLUNTEER'
  | 'ANALYST'
  | 'VIEW_ONLY'

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'INVITED'

export type OrganizationStatus = 'ACTIVE' | 'SUSPENDED'

export type MunicipalityType =
  | 'METROPOLITAN_CITY'
  | 'SUB_METROPOLITAN_CITY'
  | 'MUNICIPALITY'
  | 'RURAL_MUNICIPALITY'

export interface User {
  id: string
  organizationId: string
  name: string
  email: string
  phone: string | null
  role: UserRole
  status: UserStatus
  /** Mainly meaningful for VOLUNTEER/FIELD_WORKER accounts; null for everyone else. */
  address: string | null
  dateOfBirth: string | null
  gender: Gender | null
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
  /**
   * Present on GET /users and GET /users/{id} (verified against the live API — not yet in
   * openapi.yaml's User schema). Absent from the POST /users/{id}/assignments response, which
   * still returns a bare UserGeoAssignment.
   */
  geoAssignments?: UserGeoAssignment[]
}

export interface Organization {
  id: string
  name: string
  slug: string
  status: OrganizationStatus
  createdAt: string
}

export interface Province {
  id: string
  code: number
  name: string
  nameNepali: string | null
}

export interface District {
  id: string
  provinceId: string
  code: string
  name: string
  nameNepali: string | null
}

export interface Municipality {
  id: string
  districtId: string
  code: string
  name: string
  nameNepali: string | null
  type: MunicipalityType
  totalWards: number
}

export interface Ward {
  id: string
  municipalityId: string
  wardNumber: number
  name: string | null
  population: number | null
}

export interface Tole {
  id: string
  organizationId: string
  wardId: string
  name: string
  nameNepali: string | null
  centerLat: number | null
  centerLng: number | null
  boundary: Record<string, unknown> | null
}

export interface GeoImportIssue {
  rowNumber: number
  message: string
}

// SUPER_ADMIN-only bulk upsert of the official Nepal administrative dataset — see
// docs/modules/05-geo-dataset-import.md. Not persisted as browsable history (unlike
// VoterImportJob); the summary is returned once, synchronously, from POST /geo/import.
export interface GeoImportSummary {
  totalRows: number
  provincesCreated: number
  provincesUpdated: number
  districtsCreated: number
  districtsUpdated: number
  municipalitiesCreated: number
  municipalitiesUpdated: number
  wardsCreated: number
  errorRows: number
  issues: GeoImportIssue[]
}

export interface UserGeoAssignment {
  id: string
  userId: string
  wardId: string
  toleId: string | null
  assignedAt: string
}

export type Gender = 'MALE' | 'FEMALE' | 'OTHER'

export type VoterStatus = 'ACTIVE' | 'DECEASED' | 'MOVED'

export type VoterSource = 'MANUAL' | 'IMPORT'

// Module 06 addition — a single current classification, not a history (no record of who set it
// or what it was before, beyond the generic audit log). See docs/modules/02-households-voters.md
// ("supportLevel (added post-launch, Module 06)").
export type SupportLevel = 'STRONG_SUPPORTER' | 'LEAN_SUPPORTER' | 'UNDECIDED' | 'LEAN_OPPOSED' | 'STRONG_OPPOSED' | 'UNKNOWN'

export type ImportJobStatus = 'PROCESSING' | 'COMPLETED' | 'COMPLETED_WITH_ERRORS' | 'FAILED'

export type ImportIssueType = 'VALIDATION_ERROR' | 'DUPLICATE'

export interface Household {
  id: string
  organizationId: string
  wardId: string
  toleId: string | null
  address: string
  landmark: string | null
  centerLat: number | null
  centerLng: number | null
  /**
   * Module 09 — must be a Voter whose own householdId already equals this household's id (link
   * them via PATCH /voters/{id} first; the API 400s otherwise). See
   * docs/modules/09-household-family-tree.md.
   */
  headOfHouseholdId: string | null
  createdAt: string
  updatedAt: string
}

export interface Voter {
  id: string
  organizationId: string
  wardId: string
  toleId: string | null
  householdId: string | null
  fullName: string
  dateOfBirth: string
  gender: Gender | null
  fatherOrSpouseName: string | null
  citizenshipNumber: string | null
  voterIdNumber: string | null
  phone: string | null
  occupation: string | null
  address: string | null
  status: VoterStatus
  supportLevel: SupportLevel
  source: VoterSource
  importJobId: string | null
  createdAt: string
  updatedAt: string
}

// Module 06, third pass — an append-only per-voter contact log (no update/delete; a correction
// is a new entry, not an edit). See docs/modules/02-households-voters.md ("Contact history").
export type ContactMethod = 'DOOR_KNOCK' | 'PHONE_CALL' | 'TEXT_MESSAGE' | 'EMAIL' | 'EVENT' | 'OTHER'

export type ContactOutcome = 'REACHED' | 'NOT_REACHED' | 'REFUSED' | 'WRONG_CONTACT_INFO'

export interface VoterContact {
  id: string
  organizationId: string
  voterId: string
  method: ContactMethod
  outcome: ContactOutcome
  /** If set, this also overwrote Voter.supportLevel server-side in the same transaction. */
  supportLevelObserved: SupportLevel | null
  notes: string | null
  contactedAt: string
  contactedById: string
  /** The CanvassingVisit this contact's provenance links back to, if any (Module 04). */
  canvassingVisitId: string | null
  createdAt: string
}

export interface VoterImportJob {
  id: string
  organizationId: string
  wardId: string
  toleId: string | null
  fileName: string
  fileSizeBytes: number
  status: ImportJobStatus
  totalRows: number
  importedRows: number
  duplicateRows: number
  errorRows: number
  uploadedById: string
  startedAt: string
  completedAt: string | null
}

export interface VoterImportRowIssue {
  id: string
  importJobId: string
  rowNumber: number
  issueType: ImportIssueType
  message: string
  rawData: Record<string, unknown>
  createdAt: string
}

// docs/modules/03-household-gis.md ships as prose only (no openapi.yaml excerpt yet for these
// endpoints) — shapes below were confirmed by hitting the live dev API directly, not guessed.
export interface GeoJsonPolygon {
  type: 'Polygon'
  coordinates: number[][][]
}

export interface HouseholdWithDistance extends Household {
  distanceMeters: number
}

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

export type VisitOutcome = 'PENDING' | 'VISITED' | 'NOT_HOME' | 'REFUSED' | 'INVALID_ADDRESS'

export interface VisitSummary {
  total: number
  pending: number
  visited: number
  notHome: number
  refused: number
  invalidAddress: number
}

export interface CanvassingTask {
  id: string
  organizationId: string
  wardId: string
  toleId: string | null
  title: string
  description: string | null
  status: TaskStatus
  dueDate: string | null
  assignedToId: string
  visitSummary: VisitSummary
  createdAt: string
  updatedAt: string
}

export interface CanvassingVisit {
  id: string
  taskId: string
  householdId: string
  outcome: VisitOutcome
  notes: string | null
  visitedAt: string | null
  visitedById: string | null
  createdAt: string
  updatedAt: string
}

// Module 07 — GET /reports/dashboard. Live-aggregated, not stored/cached: there's no Report
// table, every call re-runs COUNT/GROUP BY queries. See docs/modules/07-reporting-analytics.md.
// Every breakdown is a full zero-filled map over every enum value plus an always-present
// 'UNSET' bucket (only ever nonzero for a nullable grouping column, e.g. Voter.gender) — so a
// chart never needs its own knowledge of "what are all the possible values."
export type EnumCountMap<T extends string> = Record<T | 'UNSET', number>

export interface DashboardReport {
  scope: {
    organizationId: string
    wardId: string | null
    toleId: string | null
  }
  households: {
    total: number
    withCoordinates: number
  }
  voters: {
    total: number
    byStatus: EnumCountMap<VoterStatus>
    byGender: EnumCountMap<Gender>
    bySupportLevel: EnumCountMap<SupportLevel>
  }
  canvassing: {
    tasks: {
      total: number
      byStatus: EnumCountMap<TaskStatus>
    }
    visits: {
      total: number
      byOutcome: EnumCountMap<VisitOutcome>
    }
  }
  contacts: {
    total: number
    byMethod: EnumCountMap<ContactMethod>
    byOutcome: EnumCountMap<ContactOutcome>
  }
}

export interface AuditLog {
  id: string
  organizationId: string | null
  actorUserId: string | null
  actorName?: string
  action: string
  entityType: string
  entityId: string
  before?: Record<string, unknown> | null
  after?: Record<string, unknown> | null
  ipAddress?: string | null
  userAgent?: string | null
  createdAt: string
}

export interface Pagination {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export interface SuccessEnvelope<T> {
  success: true
  data: T
}

export interface PaginatedEnvelope<T> {
  success: true
  data: T[]
  pagination: Pagination
}

export interface ApiErrorBody {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
  }
  requestId?: string
}

export interface LoginResponse {
  user: User
  accessToken: string
  refreshToken: string
  expiresIn: string
}

export interface RefreshResponse {
  accessToken: string
  refreshToken: string
  expiresIn: string
}

// Module 09 — every person here is a real Voter, matched against the voter list and linked; there
// is no "create a voter inline" path anywhere in this feature. See
// docs/modules/09-household-family-tree.md.

export type FamilyRelationType = 'SPOUSE' | 'PARENT_OF'

export interface VoterRelationship {
  id: string
  organizationId: string
  voterId: string
  relatedVoterId: string
  type: FamilyRelationType
  createdAt: string
}

/** Normalized so callers don't need to know which side of the row `{id}` happened to be stored on. */
export interface VoterRelationshipView {
  id: string
  type: FamilyRelationType
  otherVoter: VoterSummary
  direction: 'FORWARD' | 'INVERSE'
}

/** Reduced Voter shape used inside family-tree/relationship responses. */
export interface VoterSummary {
  id: string
  fullName: string
  dateOfBirth: string
  gender: Gender | null
}

export interface FamilyTreeNode {
  voter: VoterSummary
  children: FamilyTreeNode[]
}

/** GET /households/{id}/family-tree — assembled live from VoterRelationship edges, not stored. */
export interface FamilyTree {
  headOfHousehold: VoterSummary | null
  spouse: VoterSummary | null
  children: FamilyTreeNode[]
  totalFamilyMembers: number
}
