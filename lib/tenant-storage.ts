import type { Tenant } from "@/lib/mock-data"

export const CREATED_TENANTS_STORAGE_KEY = "montpackers.createdTenants.v1"

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

export function getCreatedTenantsFromStorage() {
  if (typeof window === "undefined") {
    return [] as Tenant[]
  }

  try {
    const raw = window.localStorage.getItem(CREATED_TENANTS_STORAGE_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter(
      (tenant): tenant is Tenant =>
        typeof tenant?.id === "string" &&
        typeof tenant?.slug === "string" &&
        typeof tenant?.name === "string" &&
        typeof tenant?.siteUrl === "string"
    )
  } catch {
    return []
  }
}

export function saveCreatedTenant(tenant: Tenant) {
  if (typeof window === "undefined") {
    return
  }

  const current = getCreatedTenantsFromStorage().filter((item) => item.slug !== tenant.slug)
  const next = [tenant, ...current]
  window.localStorage.setItem(CREATED_TENANTS_STORAGE_KEY, JSON.stringify(next))
}

export function mergeTenants(seedTenants: Tenant[], createdTenants: Tenant[]) {
  const tenantMap = new Map(seedTenants.map((tenant) => [tenant.slug, tenant]))

  for (const tenant of createdTenants) {
    tenantMap.set(tenant.slug, tenant)
  }

  return Array.from(tenantMap.values())
}
