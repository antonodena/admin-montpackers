import type { Tenant } from "@/lib/mock-data"

export const CREATED_TENANTS_STORAGE_KEY = "montpackers.createdTenants.v1"
export const STORED_TENANTS_UPDATED_EVENT = "montpackers:tenants-updated"

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined"
}

function getOptionalString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function emitStoredTenantsUpdated() {
  if (!canUseStorage()) {
    return
  }

  window.dispatchEvent(new CustomEvent(STORED_TENANTS_UPDATED_EVENT))
}

export function slugifyHotelName(name: string) {
  return sanitizeSlug(
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
  )
}

export function sanitizeSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-\s]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

export function buildTenantUrl(slug: string) {
  return slug ? `https://${slug}.montpackers.app` : "https://{slug}.montpackers.app"
}

export function isSlugFormatValid(slug: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
}

export function isSlugAvailable(slug: string, existingTenants: Tenant[]) {
  return !existingTenants.some((tenant) => tenant.slug.toLowerCase() === slug.toLowerCase())
}

export function isValidHexColor(value: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(value)
}

function parseStoredTenant(value: unknown): Tenant | null {
  if (!isRecord(value)) {
    return null
  }

  if (
    typeof value.id !== "string" ||
    typeof value.slug !== "string" ||
    typeof value.name !== "string" ||
    typeof value.siteUrl !== "string"
  ) {
    return null
  }

  const tenant: Tenant = {
    id: value.id,
    slug: value.slug,
    name: value.name,
    siteUrl: value.siteUrl,
  }

  const imageUrl = getOptionalString(value.imageUrl)
  const logoDataUrl = getOptionalString(value.logoDataUrl)
  const faviconDataUrl = getOptionalString(value.faviconDataUrl)
  const brandColor = getOptionalString(value.brandColor)

  if (imageUrl) {
    tenant.imageUrl = imageUrl
  }

  if (logoDataUrl) {
    tenant.logoDataUrl = logoDataUrl
  }

  if (faviconDataUrl) {
    tenant.faviconDataUrl = faviconDataUrl
  }

  if (brandColor && isValidHexColor(brandColor)) {
    tenant.brandColor = brandColor.toUpperCase()
  }

  return tenant
}

export function getStoredTenantsFromStorage() {
  if (!canUseStorage()) {
    return [] as Tenant[]
  }

  try {
    const raw = localStorage.getItem(CREATED_TENANTS_STORAGE_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .map((tenant) => parseStoredTenant(tenant))
      .filter((tenant): tenant is Tenant => tenant !== null)
  } catch {
    return []
  }
}

export function getCreatedTenantsFromStorage() {
  return getStoredTenantsFromStorage()
}

export function upsertStoredTenant(tenant: Tenant) {
  if (!canUseStorage()) {
    return
  }

  const current = getStoredTenantsFromStorage().filter((item) => item.slug !== tenant.slug)
  const next = [tenant, ...current]
  localStorage.setItem(CREATED_TENANTS_STORAGE_KEY, JSON.stringify(next))
  emitStoredTenantsUpdated()
}

export function saveCreatedTenant(tenant: Tenant) {
  upsertStoredTenant(tenant)
}

export function mergeTenants(seedTenants: Tenant[], createdTenants: Tenant[]) {
  const tenantMap = new Map(seedTenants.map((tenant) => [tenant.slug, tenant]))

  for (const tenant of createdTenants) {
    tenantMap.set(tenant.slug, tenant)
  }

  return Array.from(tenantMap.values())
}
