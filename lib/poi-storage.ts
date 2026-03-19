import {
  POI_TYPES,
  poiLibrarySeed,
  type PoiLibraryItem,
  type PoiType,
} from "@/lib/pois-data"

export { POI_TYPES, poiLibrarySeed, type PoiLibraryItem, type PoiType }

export const CREATED_POIS_STORAGE_KEY = "montpackers.createdPois.v1"
export const TENANT_POI_ASSIGNMENTS_STORAGE_KEY = "montpackers.tenantPoiAssignments.v1"

export type CreatePoiPayload = Omit<PoiLibraryItem, "id">

export type TenantPoiAssignments = Record<string, string[]>

let cachedCreatedPois: PoiLibraryItem[] | null = null
let cachedTenantAssignments: TenantPoiAssignments | null = null
let cachedAllPois: PoiLibraryItem[] | null = null

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined"
}

function uniq(values: string[]) {
  return Array.from(new Set(values))
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isPoiType(value: unknown): value is PoiType {
  return typeof value === "string" && POI_TYPES.includes(value as PoiType)
}

function isPoiLibraryItem(value: unknown): value is PoiLibraryItem {
  if (!isObjectRecord(value)) {
    return false
  }

  return (
    typeof value.id === "string" &&
    typeof value.coverImageUrl === "string" &&
    typeof value.name === "string" &&
    isPoiType(value.type) &&
    typeof value.subtype === "string"
  )
}

function readJson<T>(storageKey: string, fallback: T): T {
  if (!canUseStorage()) {
    return fallback
  }

  const raw = localStorage.getItem(storageKey)
  if (!raw) {
    return fallback
  }

  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson<T>(storageKey: string, data: T) {
  if (!canUseStorage()) {
    return
  }

  localStorage.setItem(storageKey, JSON.stringify(data))
}

function invalidatePoiCaches(options?: { created?: boolean; assignments?: boolean }) {
  if (options?.created) {
    cachedCreatedPois = null
  }

  if (options?.assignments) {
    cachedTenantAssignments = null
  }

  cachedAllPois = null
}

function saveCreatedPoi(poi: PoiLibraryItem) {
  const current = getCreatedPoisFromStorage().filter((item) => item.id !== poi.id)
  writeJson(CREATED_POIS_STORAGE_KEY, [poi, ...current])
  cachedCreatedPois = [poi, ...current]
  invalidatePoiCaches({ created: true })
  cachedCreatedPois = [poi, ...current]
}

function saveTenantPoiAssignments(assignments: TenantPoiAssignments) {
  writeJson(TENANT_POI_ASSIGNMENTS_STORAGE_KEY, assignments)
  cachedTenantAssignments = assignments
  invalidatePoiCaches({ assignments: true })
  cachedTenantAssignments = assignments
}

export function getCreatedPoisFromStorage() {
  if (cachedCreatedPois) {
    return cachedCreatedPois
  }

  const parsed = readJson<unknown[]>(CREATED_POIS_STORAGE_KEY, [])

  cachedCreatedPois = parsed.filter(isPoiLibraryItem)

  return cachedCreatedPois
}

export function getTenantPoiAssignmentsFromStorage() {
  if (cachedTenantAssignments) {
    return cachedTenantAssignments
  }

  const parsed = readJson<unknown>(TENANT_POI_ASSIGNMENTS_STORAGE_KEY, {})

  if (!isObjectRecord(parsed)) {
    cachedTenantAssignments = {} as TenantPoiAssignments
    return cachedTenantAssignments
  }

  const sanitized: TenantPoiAssignments = {}

  for (const [tenantSlug, value] of Object.entries(parsed)) {
    if (!Array.isArray(value)) {
      continue
    }

    const poiIds = value.filter((poiId): poiId is string => typeof poiId === "string")
    sanitized[tenantSlug] = uniq(poiIds)
  }

  cachedTenantAssignments = sanitized

  return cachedTenantAssignments
}

export function getTenantPoiAssignments() {
  return { ...getTenantPoiAssignmentsFromStorage() }
}

export function getAllPois() {
  if (cachedAllPois) {
    return cachedAllPois
  }

  const createdPois = getCreatedPoisFromStorage()
  const seenPoiIds = new Set<string>()
  const merged: PoiLibraryItem[] = []

  for (const poi of [...createdPois, ...poiLibrarySeed]) {
    if (seenPoiIds.has(poi.id)) {
      continue
    }

    seenPoiIds.add(poi.id)
    merged.push({ ...poi })
  }

  cachedAllPois = merged

  return cachedAllPois
}

export function getPoiById(poiId: string) {
  return getAllPois().find((poi) => poi.id === poiId)
}

export function getTenantPois(tenantSlug: string) {
  const assignments = getTenantPoiAssignments()
  const assignedPoiIds = assignments[tenantSlug] ?? []

  if (assignedPoiIds.length === 0) {
    return [] as PoiLibraryItem[]
  }

  const poisById = new Map(getAllPois().map((poi) => [poi.id, poi]))

  return assignedPoiIds
    .map((poiId) => poisById.get(poiId))
    .filter((poi): poi is PoiLibraryItem => Boolean(poi))
}

export function assignPoisToTenant(tenantSlug: string, poiIds: string[]) {
  const assignments = getTenantPoiAssignments()
  const current = assignments[tenantSlug] ?? []

  assignments[tenantSlug] = uniq([...current, ...poiIds])
  saveTenantPoiAssignments(assignments)

  return assignments[tenantSlug]
}

export function createPoi(payload: CreatePoiPayload) {
  const poi: PoiLibraryItem = {
    id: `poi_local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: payload.name.trim(),
    type: payload.type,
    subtype: payload.subtype.trim(),
    coverImageUrl: payload.coverImageUrl,
  }

  saveCreatedPoi(poi)

  return poi
}

export function createPoiAndAssign(tenantSlug: string, payload: CreatePoiPayload) {
  const poi = createPoi(payload)
  assignPoisToTenant(tenantSlug, [poi.id])

  return poi
}
