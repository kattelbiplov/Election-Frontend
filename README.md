# Election Ops — Web

Responsive, installable PWA frontend for the [Election Operations & Voter Intelligence Platform
API](../election-platform-api). Covers everything the API's Module 01 exposes today: auth,
RBAC-aware navigation, user & geo-assignment management, Nepal's Province → District →
Municipality → Ward → Tole hierarchy, and audit logs.

## Stack

React 19 + TypeScript + Vite, Tailwind CSS v4 (design tokens in `src/index.css`), TanStack Query,
React Router, React Hook Form + Zod, Zustand, `vite-plugin-pwa`.

## Getting started

```bash
npm install
cp .env.example .env   # points at http://localhost:4000/api/v1 by default
npm run dev
```

The API must be running separately (see `../election-platform-api`) with
`CORS_ORIGINS` including `http://localhost:5173`.

Seeded accounts (from the API's `prisma/seed.ts`):

| Email | Password | Role |
|---|---|---|
| `superadmin@election-platform.local` | `ChangeMe123!` | SUPER_ADMIN |
| `admin@demo-campaign.local` | `ChangeMe123!` | CAMPAIGN_ADMIN |

## Scripts

- `npm run dev` — dev server on :5173
- `npm run build` — type-check + production build (PWA service worker generated via Workbox)
- `npm run preview` — serve the production build locally

## Structure

```
src/
  components/ui/       Design-system primitives (Button, Modal, Table, ...)
  components/layout/   Sidebar, Topbar, AppShell, PageHeader
  components/guards/   RequireAuth, RequirePermission, RequireRole
  components/geo/      Shared Province→District→Municipality→Ward cascade picker
  features/<domain>/   One folder per screen area (auth, dashboard, users, geo, organizations,
                        audit, profile), each with its page(s), modals, and zod schemas
  lib/api/              One file per API resource, typed against docs/openapi.yaml
  lib/permissions.ts     Client mirror of the backend's ROLE_PERMISSIONS matrix (UI-only gating —
                          the server is still the source of truth)
  store/                 Zustand: auth session, toasts
```

## Auth model

Matches the API doc's security note: the access token lives in memory only; only the
`refreshToken` is persisted (`localStorage`, via Zustand `persist`). On boot, `bootstrapAuth()`
exchanges the stored refresh token for a fresh access token + user. The axios client
(`lib/api/client.ts`) transparently retries a 401 once via a shared in-flight refresh, and hard
logs out (redirect to `/login`) if that refresh fails.

## Known API gaps this UI works around

- ~~No `GET /users/{id}/assignments`~~ **Resolved.** `GET /users`/`GET /users/{id}` now embed
  `geoAssignments` directly on `User` (verified against the live API; not yet in `openapi.yaml`'s
  `User` schema — add it there). The Assignments modal seeds from this instead of only showing
  assignments added in the current session.
- **`AuditLog` has no published schema** in `docs/openapi.yaml` (the `/audit-logs` response is
  typed `description`-only). The frontend's `AuditLog` type (`lib/types.ts`) is inferred from the
  module doc's prose ("action, entity type/id, before/after snapshot, actor, IP, user agent") —
  confirm field names against the real handler before relying on it.
- **The three Household GIS endpoints** (`GET /households/nearby`, `POST /households/search/
  within-polygon`, `GET /toles/{id}/boundary-check`) similarly have no `openapi.yaml` entries yet
  — `docs/modules/03-household-gis.md` is prose only. Response shapes in `lib/api/households.ts`/
  `lib/api/geo.ts` were confirmed by hitting a live local API directly (both search endpoints
  paginate; boundary-check doesn't and 400s with no body detail when the tole has no boundary),
  not guessed — but re-verify once these land in the published schema.

## PWA

Installable with an app-shell + static-asset precache and a `NetworkFirst` runtime cache for GET
`/api/v1/*` responses (6s network timeout, falls back to cache when offline). Writes (POST/PATCH/
DELETE) are not queued — they require connectivity, matching the "installable + smart caching"
scope for this module. Full offline write-queueing is worth revisiting once the field-data-entry
modules (household/voter canvassing) define what field workers actually need to submit offline.
