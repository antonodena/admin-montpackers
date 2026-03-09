import { tenants } from "@/lib/mock-data"
import {
  routeLibrarySeed,
  type RouteDifficulty,
  type RouteLibraryItem,
  type RouteRegion,
  type RouteSport,
} from "@/lib/routes-data"

export const CREATED_ROUTES_STORAGE_KEY = "montpackers.createdRoutes.v1"
export const TENANT_ROUTE_ASSIGNMENTS_STORAGE_KEY =
  "montpackers.tenantRouteAssignments.v1"

export type TenantRouteAssignments = Record<string, string[]>

export type CreateRoutePayload = {
  coverImageUrl: string
  name: string
  region: RouteRegion
  sport: RouteSport
  difficulty: RouteDifficulty
  isCircular: boolean
  isFamilyFriendly: boolean
  distanceKm: number
  elevationGainM: number
  durationMin: number
  author: string
}

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

function isRouteLibraryItem(value: unknown): value is RouteLibraryItem {
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

function buildDefaultTenantRouteAssignments(): TenantRouteAssignments {
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

  return assignments
}

export function getCreatedRoutesFromStorage() {
  const parsed = readJson<unknown[]>(CREATED_ROUTES_STORAGE_KEY, [])

  return parsed.filter(isRouteLibraryItem)
}

export function saveCreatedRoute(route: RouteLibraryItem) {
  const current = getCreatedRoutesFromStorage().filter((item) => item.id !== route.id)
  writeJson(CREATED_ROUTES_STORAGE_KEY, [route, ...current])
}

export function getTenantRouteAssignmentsFromStorage() {
  const parsed = readJson<unknown>(TENANT_ROUTE_ASSIGNMENTS_STORAGE_KEY, {})

  if (!isObjectRecord(parsed)) {
    return {} as TenantRouteAssignments
  }

  const sanitized: TenantRouteAssignments = {}

  for (const [tenantSlug, value] of Object.entries(parsed)) {
    if (!Array.isArray(value)) {
      continue
    }

    const routeIds = value.filter((routeId): routeId is string => typeof routeId === "string")
    sanitized[tenantSlug] = uniq(routeIds)
  }

  return sanitized
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
  const created = getCreatedRoutesFromStorage()
  const assignments = getTenantRouteAssignments()
  const tenantCountByRoute = buildTenantCountByRoute(assignments)

  const mergedRoutes = new Map<string, RouteLibraryItem>()

  for (const route of [...routeLibrarySeed, ...created]) {
    const tenantCount = tenantCountByRoute.get(route.id) ?? route.tenantCount

    mergedRoutes.set(route.id, {
      ...route,
      tenantCount,
    })
  }

  return Array.from(mergedRoutes.values())
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

export function createRouteAndAssign(tenantSlug: string, payload: CreateRoutePayload) {
  const route: RouteLibraryItem = {
    ...payload,
    id: `route_local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    tenantCount: 1,
  }

  saveCreatedRoute(route)
  assignRoutesToTenant(tenantSlug, [route.id])

  return route
}
