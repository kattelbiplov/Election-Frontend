import type { GeoJsonPolygon } from './types'

export type PolygonParseResult =
  | { ok: true; polygon: GeoJsonPolygon }
  | { ok: false; error: string }

/**
 * Minimal GeoJSON Polygon validation for hand-edited/pasted input — enough to catch typos before
 * they hit the server, not a full RFC 7946 validator (doesn't check ring winding or self-
 * intersection; the backend is the real authority on validity).
 */
export function parsePolygonInput(raw: string): PolygonParseResult {
  if (!raw.trim()) return { ok: false, error: 'Required' }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { ok: false, error: 'Not valid JSON' }
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { ok: false, error: 'Must be a GeoJSON Polygon object' }
  }
  const obj = parsed as Record<string, unknown>
  if (obj.type !== 'Polygon' || !Array.isArray(obj.coordinates)) {
    return { ok: false, error: 'Must have "type": "Polygon" and a "coordinates" array' }
  }

  const rings = obj.coordinates as unknown[]
  if (rings.length === 0) return { ok: false, error: 'Needs at least one ring of coordinates' }

  for (const ring of rings) {
    if (!Array.isArray(ring) || ring.length < 4) {
      return { ok: false, error: 'Each ring needs at least 4 positions (the ring must close)' }
    }
    for (const position of ring) {
      if (
        !Array.isArray(position) ||
        position.length < 2 ||
        typeof position[0] !== 'number' ||
        typeof position[1] !== 'number'
      ) {
        return { ok: false, error: 'Each position must be [longitude, latitude]' }
      }
    }
    const first = ring[0] as number[]
    const last = ring[ring.length - 1] as number[]
    if (first[0] !== last[0] || first[1] !== last[1]) {
      return { ok: false, error: 'Each ring must close (first and last position must match)' }
    }
  }

  return { ok: true, polygon: parsed as GeoJsonPolygon }
}
