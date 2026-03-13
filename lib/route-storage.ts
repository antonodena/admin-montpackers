import { tenants } from "@/lib/mock-data"
import {
  ROUTE_DIRECTIONS,
  ROUTE_ORIENTATIONS,
  routeLibrarySeed,
  type LegacyRouteLibraryItem,
  type RouteAsset,
  type RouteAssetType,
  type RouteDifficulty,
  type RouteDirection,
  type RouteGpxFile,
  type RouteGpxMetrics,
  type RouteLibraryItem,
  type RouteOrientation,
} from "@/lib/routes-data"

const LEGACY_CREATED_ROUTES_STORAGE_KEY = "montpackers.createdRoutes.v1"
export const CREATED_ROUTES_STORAGE_KEY = "montpackers.createdRoutes.v2"
export const TENANT_ROUTE_ASSIGNMENTS_STORAGE_KEY =
  "montpackers.tenantRouteAssignments.v1"

const ROUTE_CODE_PATTERN = /^MONT\d{2,}$/

export type TenantRouteAssignments = Record<string, string[]>

export type CreateRoutePayload = Omit<
  RouteLibraryItem,
  "id" | "tenantCount" | "coverImageUrl"
> & {
  coverImageUrl?: string
}

type RouteWithOptionalMeta = LegacyRouteLibraryItem &
  Partial<
    Pick<
      RouteLibraryItem,
      | "routeCode"
      | "description"
      | "isBeginnerFriendly"
      | "orientation"
      | "direction"
      | "assets"
      | "gpxFile"
      | "gpxMetrics"
    >
  >

type RawCreatedRoutesResult = {
  rawRoutes: unknown[]
  shouldMigrate: boolean
}

let cachedSeedRoutes: RouteLibraryItem[] | null = null
let cachedDefaultTenantAssignments: TenantRouteAssignments | null = null
let cachedCreatedRoutes: RouteLibraryItem[] | null = null
let cachedTenantAssignments: TenantRouteAssignments | null = null
let cachedAllRoutes: RouteLibraryItem[] | null = null
let cachedRouteCodes: Set<string> | null = null

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined"
}

function uniq(values: string[]) {
  return Array.from(new Set(values))
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isRouteDifficulty(value: unknown): value is RouteDifficulty {
  return value === "Fácil" || value === "Moderada" || value === "Difícil"
}

function isRouteAssetType(value: unknown): value is RouteAssetType {
  return (
    value === "vista" ||
    value === "waypoint" ||
    value === "alerta" ||
    value === "habituallamiento"
  )
}

function isRouteOrientation(value: unknown): value is RouteOrientation {
  return ROUTE_ORIENTATIONS.includes(value as RouteOrientation)
}

function isRouteDirection(value: unknown): value is RouteDirection {
  return ROUTE_DIRECTIONS.includes(value as RouteDirection)
}

function isLegacyRouteLibraryItem(value: unknown): value is LegacyRouteLibraryItem {
  if (!isObjectRecord(value)) {
    return false
  }

  return (
    typeof value.id === "string" &&
    typeof value.coverImageUrl === "string" &&
    typeof value.name === "string" &&
    typeof value.tenantCount === "number" &&
    typeof value.region === "string" &&
    typeof value.sport === "string" &&
    isRouteDifficulty(value.difficulty) &&
    typeof value.isCircular === "boolean" &&
    typeof value.isFamilyFriendly === "boolean" &&
    typeof value.distanceKm === "number" &&
    typeof value.elevationGainM === "number" &&
    typeof value.durationMin === "number" &&
    typeof value.author === "string"
  )
}

function isRouteAsset(value: unknown): value is RouteAsset {
  if (!isObjectRecord(value)) {
    return false
  }

  return (
    typeof value.id === "string" &&
    typeof value.dataUrl === "string" &&
    typeof value.fileName === "string" &&
    typeof value.mimeType === "string" &&
    isRouteAssetType(value.kind)
  )
}

function isNullableFiniteNumber(value: unknown): value is number | null {
  return value === null || (typeof value === "number" && Number.isFinite(value))
}

function isRouteGpxFile(value: unknown): value is RouteGpxFile {
  if (!isObjectRecord(value)) {
    return false
  }

  return (
    typeof value.fileName === "string" &&
    typeof value.mimeType === "string" &&
    typeof value.sizeBytes === "number" &&
    Number.isFinite(value.sizeBytes) &&
    value.sizeBytes >= 0 &&
    typeof value.content === "string"
  )
}

function isRouteGpxMetrics(value: unknown): value is RouteGpxMetrics {
  if (!isObjectRecord(value)) {
    return false
  }

  return (
    isNullableFiniteNumber(value.distanceKm) &&
    isNullableFiniteNumber(value.elevationGainM) &&
    isNullableFiniteNumber(value.durationMin)
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

function slugifyRouteName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

function getMimeTypeFromValue(value: string) {
  if (value.startsWith("data:")) {
    return value.slice(5, value.indexOf(";")) || "image/jpeg"
  }

  const normalized = value.toLowerCase()

  if (normalized.endsWith(".png")) {
    return "image/png"
  }

  if (normalized.endsWith(".svg")) {
    return "image/svg+xml"
  }

  if (normalized.endsWith(".webp")) {
    return "image/webp"
  }

  return "image/jpeg"
}

function getFileExtensionFromMimeType(mimeType: string) {
  switch (mimeType) {
    case "image/png":
      return "png"
    case "image/svg+xml":
      return "svg"
    case "image/webp":
      return "webp"
    default:
      return "jpg"
  }
}

function buildFallbackAssets(route: LegacyRouteLibraryItem): RouteAsset[] {
  if (!route.coverImageUrl) {
    return []
  }

  const mimeType = getMimeTypeFromValue(route.coverImageUrl)
  const baseName = slugifyRouteName(route.name) || route.id

  return [
    {
      id: `${route.id}-asset-0`,
      dataUrl: route.coverImageUrl,
      fileName: `${baseName}.${getFileExtensionFromMimeType(mimeType)}`,
      mimeType,
      kind: "vista",
    },
  ]
}

function sanitizeAssets(
  value: RouteWithOptionalMeta["assets"],
  route: LegacyRouteLibraryItem
) {
  if (!Array.isArray(value)) {
    return buildFallbackAssets(route)
  }

  const sanitized = value
    .filter(isRouteAsset)
    .map((asset, index) => ({
      ...asset,
      id: asset.id || `${route.id}-asset-${index}`,
      fileName: asset.fileName || `${route.id}-asset-${index}`,
      kind: asset.kind,
    }))

  if (sanitized.length === 0) {
    return buildFallbackAssets(route)
  }

  return sanitized
}

function sanitizeGpxFile(value: RouteWithOptionalMeta["gpxFile"]) {
  if (!isRouteGpxFile(value)) {
    return null
  }

  return {
    fileName: value.fileName,
    mimeType: value.mimeType,
    sizeBytes: value.sizeBytes,
    content: value.content,
  } satisfies RouteGpxFile
}

function sanitizeGpxMetrics(value: RouteWithOptionalMeta["gpxMetrics"]) {
  if (!isRouteGpxMetrics(value)) {
    return null
  }

  return {
    distanceKm: value.distanceKm,
    elevationGainM: value.elevationGainM,
    durationMin: value.durationMin,
  } satisfies RouteGpxMetrics
}

function buildCoverImageUrl(assets: RouteAsset[], fallback: string) {
  const preferredAsset = assets.find((asset) => asset.kind === "vista") ?? assets[0]
  return preferredAsset?.dataUrl || fallback
}

function formatRouteCode(sequence: number) {
  const digits = Math.max(2, String(sequence).length)
  return `MONT${String(sequence).padStart(digits, "0")}`
}

function findNextAvailableRouteCode(usedCodes: Set<string>) {
  let sequence = 0

  while (usedCodes.has(formatRouteCode(sequence))) {
    sequence += 1
  }

  return formatRouteCode(sequence)
}

function resolveRouteCode(value: unknown, usedCodes: Set<string>) {
  const normalized =
    typeof value === "string" ? value.trim().toUpperCase() : ""

  const routeCode =
    normalized && ROUTE_CODE_PATTERN.test(normalized) && !usedCodes.has(normalized)
      ? normalized
      : findNextAvailableRouteCode(usedCodes)

  usedCodes.add(routeCode)

  return routeCode
}

function normalizeRouteRecord(route: RouteWithOptionalMeta, usedCodes: Set<string>) {
  const assets = sanitizeAssets(route.assets, route)
  const gpxFile = sanitizeGpxFile(route.gpxFile)
  const gpxMetrics = gpxFile ? sanitizeGpxMetrics(route.gpxMetrics) : null

  return {
    ...route,
    coverImageUrl: buildCoverImageUrl(assets, route.coverImageUrl),
    routeCode: resolveRouteCode(route.routeCode, usedCodes),
    description: typeof route.description === "string" ? route.description : "",
    isBeginnerFriendly:
      typeof route.isBeginnerFriendly === "boolean" ? route.isBeginnerFriendly : false,
    orientation: isRouteOrientation(route.orientation)
      ? route.orientation
      : ROUTE_ORIENTATIONS[0],
    direction: isRouteDirection(route.direction)
      ? route.direction
      : ROUTE_DIRECTIONS[0],
    assets,
    gpxFile,
    gpxMetrics,
  } satisfies RouteLibraryItem
}

function getNormalizedSeedRoutes() {
  if (cachedSeedRoutes) {
    return cachedSeedRoutes
  }

  const usedCodes = new Set<string>()

  cachedSeedRoutes = routeLibrarySeed.map((route) => normalizeRouteRecord(route, usedCodes))

  return cachedSeedRoutes
}

function readRawCreatedRoutes() {
  if (!canUseStorage()) {
    return {
      rawRoutes: [] as unknown[],
      shouldMigrate: false,
    } satisfies RawCreatedRoutesResult
  }

  const hasV2 = localStorage.getItem(CREATED_ROUTES_STORAGE_KEY) !== null

  if (hasV2) {
    return {
      rawRoutes: readJson<unknown[]>(CREATED_ROUTES_STORAGE_KEY, []),
      shouldMigrate: false,
    } satisfies RawCreatedRoutesResult
  }

  return {
    rawRoutes: readJson<unknown[]>(LEGACY_CREATED_ROUTES_STORAGE_KEY, []),
    shouldMigrate: true,
  } satisfies RawCreatedRoutesResult
}

function normalizeCreatedRoutes(rawRoutes: unknown[], reservedCodes: Set<string>) {
  const usedCodes = new Set(reservedCodes)
  const normalized: RouteLibraryItem[] = []

  for (const rawRoute of rawRoutes) {
    if (!isLegacyRouteLibraryItem(rawRoute)) {
      continue
    }

    normalized.push(normalizeRouteRecord(rawRoute, usedCodes))
  }

  return normalized
}

function buildDefaultTenantRouteAssignments(): TenantRouteAssignments {
  if (cachedDefaultTenantAssignments) {
    return cachedDefaultTenantAssignments
  }

  const tenantSlugs = tenants.map((tenant) => tenant.slug)
  const assignments: TenantRouteAssignments = {}

  if (tenantSlugs.length === 0) {
    return assignments
  }

  routeLibrarySeed.forEach((route, routeIndex) => {
    const relatedTenantCount = Math.max(1, Math.min(route.tenantCount, tenantSlugs.length))

    for (let offset = 0; offset < relatedTenantCount; offset += 1) {
      const tenantSlug = tenantSlugs[(routeIndex + offset) % tenantSlugs.length]
      const current = assignments[tenantSlug] ?? []
      assignments[tenantSlug] = uniq([...current, route.id])
    }
  })

  cachedDefaultTenantAssignments = assignments

  return cachedDefaultTenantAssignments
}

function invalidateRouteCaches(options?: { created?: boolean; assignments?: boolean }) {
  if (options?.created) {
    cachedCreatedRoutes = null
  }

  if (options?.assignments) {
    cachedTenantAssignments = null
  }

  cachedAllRoutes = null
  cachedRouteCodes = null
}

export function getCreatedRoutesFromStorage() {
  if (cachedCreatedRoutes) {
    return cachedCreatedRoutes
  }

  const reservedCodes = new Set(getNormalizedSeedRoutes().map((route) => route.routeCode))
  const { rawRoutes, shouldMigrate } = readRawCreatedRoutes()
  const normalized = normalizeCreatedRoutes(rawRoutes, reservedCodes)

  cachedCreatedRoutes = normalized

  if (shouldMigrate && canUseStorage()) {
    writeJson(CREATED_ROUTES_STORAGE_KEY, normalized)
  }

  return cachedCreatedRoutes
}

export function saveCreatedRoute(route: RouteLibraryItem) {
  const current = getCreatedRoutesFromStorage().filter((item) => item.id !== route.id)
  writeJson(CREATED_ROUTES_STORAGE_KEY, [route, ...current])
  cachedCreatedRoutes = [route, ...current]
  invalidateRouteCaches({ created: true })
  cachedCreatedRoutes = [route, ...current]
}

export function getTenantRouteAssignmentsFromStorage() {
  if (cachedTenantAssignments) {
    return cachedTenantAssignments
  }

  const parsed = readJson<unknown>(TENANT_ROUTE_ASSIGNMENTS_STORAGE_KEY, {})

  if (!isObjectRecord(parsed)) {
    cachedTenantAssignments = {} as TenantRouteAssignments
    return cachedTenantAssignments
  }

  const sanitized: TenantRouteAssignments = {}

  for (const [tenantSlug, value] of Object.entries(parsed)) {
    if (!Array.isArray(value)) {
      continue
    }

    const routeIds = value.filter((routeId): routeId is string => typeof routeId === "string")
    sanitized[tenantSlug] = uniq(routeIds)
  }

  cachedTenantAssignments = sanitized

  return cachedTenantAssignments
}

export function getTenantRouteAssignments() {
  const defaults = buildDefaultTenantRouteAssignments()
  const saved = getTenantRouteAssignmentsFromStorage()

  const merged: TenantRouteAssignments = { ...defaults }

  for (const [tenantSlug, routeIds] of Object.entries(saved)) {
    const current = merged[tenantSlug] ?? []
    merged[tenantSlug] = uniq([...current, ...routeIds])
  }

  return merged
}

export function saveTenantRouteAssignments(assignments: TenantRouteAssignments) {
  writeJson(TENANT_ROUTE_ASSIGNMENTS_STORAGE_KEY, assignments)
  cachedTenantAssignments = assignments
  invalidateRouteCaches({ assignments: true })
  cachedTenantAssignments = assignments
}

function buildTenantCountByRoute(assignments: TenantRouteAssignments) {
  const counts = new Map<string, number>()

  for (const routeIds of Object.values(assignments)) {
    const uniqueRouteIds = new Set(routeIds)

    for (const routeId of uniqueRouteIds) {
      counts.set(routeId, (counts.get(routeId) ?? 0) + 1)
    }
  }

  return counts
}

export function getAllRoutes() {
  if (cachedAllRoutes) {
    return cachedAllRoutes
  }

  const seedRoutes = getNormalizedSeedRoutes()
  const createdRoutes = getCreatedRoutesFromStorage()
  const assignments = getTenantRouteAssignments()
  const tenantCountByRoute = buildTenantCountByRoute(assignments)

  const mergedRoutes = new Map<string, RouteLibraryItem>()

  for (const route of [...seedRoutes, ...createdRoutes]) {
    const tenantCount = tenantCountByRoute.get(route.id) ?? route.tenantCount

    mergedRoutes.set(route.id, {
      ...route,
      tenantCount,
    })
  }

  cachedAllRoutes = Array.from(mergedRoutes.values())

  return cachedAllRoutes
}

export function getRouteById(routeId: string) {
  return getAllRoutes().find((route) => route.id === routeId)
}

export function getTenantRoutes(tenantSlug: string) {
  const assignments = getTenantRouteAssignments()
  const assignedRouteIds = assignments[tenantSlug] ?? []

  if (assignedRouteIds.length === 0) {
    return [] as RouteLibraryItem[]
  }

  const routesById = new Map(getAllRoutes().map((route) => [route.id, route]))

  return assignedRouteIds
    .map((routeId) => routesById.get(routeId))
    .filter((route): route is RouteLibraryItem => Boolean(route))
}

export function assignRoutesToTenant(tenantSlug: string, routeIds: string[]) {
  const assignments = getTenantRouteAssignments()
  const current = assignments[tenantSlug] ?? []

  assignments[tenantSlug] = uniq([...current, ...routeIds])
  saveTenantRouteAssignments(assignments)

  return assignments[tenantSlug]
}

export function isRouteCodeValid(routeCode: string) {
  return ROUTE_CODE_PATTERN.test(routeCode.trim().toUpperCase())
}

export function isRouteCodeAvailable(routeCode: string, excludeRouteId?: string) {
  const normalizedCode = routeCode.trim().toUpperCase()

  return !getAllRoutes().some(
    (route) => route.routeCode === normalizedCode && route.id !== excludeRouteId
  )
}

export function getNextAvailableRouteCode() {
  if (!cachedRouteCodes) {
    cachedRouteCodes = new Set(getAllRoutes().map((route) => route.routeCode))
  }

  return findNextAvailableRouteCode(cachedRouteCodes)
}

export function createRoute(payload: CreateRoutePayload) {
  const usedCodes = new Set(cachedRouteCodes ?? getAllRoutes().map((route) => route.routeCode))

  const route = normalizeRouteRecord(
    {
      ...payload,
      id: `route_local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      tenantCount: 0,
      coverImageUrl: payload.coverImageUrl ?? "",
    },
    usedCodes
  )

  saveCreatedRoute(route)
  cachedRouteCodes = new Set([...usedCodes, route.routeCode])

  return route
}

export function createRouteAndAssign(tenantSlug: string, payload: CreateRoutePayload) {
  const route = createRoute(payload)
  assignRoutesToTenant(tenantSlug, [route.id])

  return route
}
