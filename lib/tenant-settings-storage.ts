import type { Tenant, AdminUser } from "@/lib/mock-data"

export const TENANT_SETTINGS_STORAGE_KEY = "montpackers.tenantSettings.v1"
export const TENANT_SETTINGS_UPDATED_EVENT = "montpackers:tenant-settings-updated"

export type TenantAdminLanguage = "es" | "ca" | "en"
export type TenantTeamRole = "owner" | "admin" | "viewer"
export type TenantTeamStatus = "active" | "pending"

export type TenantSettingsGeneral = {
  hotelName: string
  description: string
  address: string
  adminLanguage: TenantAdminLanguage
}

export type TenantSettingsAccount = {
  displayName: string
  username: string
  password: string
}

export type TenantTeamMember = {
  id: string
  name: string
  email: string
  role: TenantTeamRole
  status: TenantTeamStatus
}

export type TenantNotificationSettings = {
  newRoutesAvailable: boolean
  assignedRouteUpdates: boolean
  kioskIncidents: boolean
  teamAccessChanges: boolean
  weeklySummary: boolean
}

export type TenantSettingsRecord = {
  general: TenantSettingsGeneral
  account: TenantSettingsAccount
  team: TenantTeamMember[]
  notifications: TenantNotificationSettings
}

type TenantSettingsMap = Record<string, TenantSettingsRecord>

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined"
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function getOptionalString(value: unknown) {
  return typeof value === "string" ? value : ""
}

function sanitizeAdminLanguage(value: unknown): TenantAdminLanguage {
  if (value === "ca" || value === "en" || value === "es") {
    return value
  }

  return "es"
}

function sanitizeRole(value: unknown): TenantTeamRole {
  if (value === "owner" || value === "admin" || value === "viewer") {
    return value
  }

  return "viewer"
}

function sanitizeStatus(value: unknown): TenantTeamStatus {
  if (value === "pending" || value === "active") {
    return value
  }

  return "active"
}

function sanitizeNotifications(value: unknown): TenantNotificationSettings {
  const record = isRecord(value) ? value : {}

  return {
    newRoutesAvailable:
      typeof record.newRoutesAvailable === "boolean" ? record.newRoutesAvailable : true,
    assignedRouteUpdates:
      typeof record.assignedRouteUpdates === "boolean" ? record.assignedRouteUpdates : true,
    kioskIncidents:
      typeof record.kioskIncidents === "boolean" ? record.kioskIncidents : true,
    teamAccessChanges:
      typeof record.teamAccessChanges === "boolean" ? record.teamAccessChanges : true,
    weeklySummary:
      typeof record.weeklySummary === "boolean" ? record.weeklySummary : false,
  }
}

function sanitizeTeamMembers(value: unknown, fallback: TenantTeamMember[]) {
  if (!Array.isArray(value)) {
    return fallback
  }

  const members = value
    .map((item) => {
      if (!isRecord(item)) {
        return null
      }

      if (
        typeof item.id !== "string" ||
        typeof item.name !== "string" ||
        typeof item.email !== "string"
      ) {
        return null
      }

      return {
        id: item.id,
        name: item.name,
        email: item.email,
        role: sanitizeRole(item.role),
        status: sanitizeStatus(item.status),
      } satisfies TenantTeamMember
    })
    .filter((item): item is TenantTeamMember => item !== null)

  if (members.length === 0) {
    return fallback
  }

  if (!members.some((member) => member.role === "owner")) {
    members[0] = { ...members[0], role: "owner" }
  }

  return members
}

function buildDefaultTeamMembers(tenantSlug: string, seedUsers: AdminUser[]) {
  const tenantUsers = seedUsers.filter((user) => user.tenantSlug === tenantSlug)

  if (tenantUsers.length === 0) {
    return [
      {
        id: `team_owner_${tenantSlug}`,
        name: "Administrador",
        email: `admin@${tenantSlug}.montpackers.app`,
        role: "owner",
        status: "active",
      },
    ] satisfies TenantTeamMember[]
  }

  return tenantUsers.map((user, index) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: index === 0 ? "owner" : "admin",
    status: "active",
  })) satisfies TenantTeamMember[]
}

function buildDefaultAccount(tenantSlug: string, seedUsers: AdminUser[]) {
  const owner = buildDefaultTeamMembers(tenantSlug, seedUsers)[0]
  const suggestedUsername = owner.email.split("@")[0] || tenantSlug

  return {
    displayName: owner.name,
    username: suggestedUsername,
    password: "",
  } satisfies TenantSettingsAccount
}

export function buildDefaultTenantSettings(tenant: Tenant, seedUsers: AdminUser[]) {
  const team = buildDefaultTeamMembers(tenant.slug, seedUsers)

  return {
    general: {
      hotelName: tenant.name,
      description: "",
      address: "",
      adminLanguage: "es",
    },
    account: buildDefaultAccount(tenant.slug, seedUsers),
    team,
    notifications: {
      newRoutesAvailable: true,
      assignedRouteUpdates: true,
      kioskIncidents: true,
      teamAccessChanges: true,
      weeklySummary: false,
    },
  } satisfies TenantSettingsRecord
}

function sanitizeRecord(
  tenant: Tenant,
  seedUsers: AdminUser[],
  value: unknown
): TenantSettingsRecord {
  const fallback = buildDefaultTenantSettings(tenant, seedUsers)
  const record = isRecord(value) ? value : {}

  return {
    general: {
      hotelName: getOptionalString(record.general && (record.general as Record<string, unknown>).hotelName) || fallback.general.hotelName,
      description: getOptionalString(
        record.general && (record.general as Record<string, unknown>).description
      ),
      address: getOptionalString(record.general && (record.general as Record<string, unknown>).address),
      adminLanguage: sanitizeAdminLanguage(
        record.general && (record.general as Record<string, unknown>).adminLanguage
      ),
    },
    account: {
      displayName:
        getOptionalString(record.account && (record.account as Record<string, unknown>).displayName) ||
        fallback.account.displayName,
      username:
        getOptionalString(record.account && (record.account as Record<string, unknown>).username) ||
        fallback.account.username,
      password: getOptionalString(record.account && (record.account as Record<string, unknown>).password),
    },
    team: sanitizeTeamMembers(record.team, fallback.team),
    notifications: sanitizeNotifications(record.notifications),
  }
}

function emitTenantSettingsUpdated() {
  if (!canUseStorage()) {
    return
  }

  window.dispatchEvent(new CustomEvent(TENANT_SETTINGS_UPDATED_EVENT))
}

export function getTenantSettingsMapFromStorage() {
  if (!canUseStorage()) {
    return {} as TenantSettingsMap
  }

  try {
    const raw = localStorage.getItem(TENANT_SETTINGS_STORAGE_KEY)
    if (!raw) {
      return {}
    }

    const parsed = JSON.parse(raw)
    return isRecord(parsed) ? (parsed as TenantSettingsMap) : {}
  } catch {
    return {}
  }
}

export function getTenantSettingsRecord(tenant: Tenant, seedUsers: AdminUser[]) {
  const map = getTenantSettingsMapFromStorage()
  return sanitizeRecord(tenant, seedUsers, map[tenant.slug])
}

export function upsertTenantSettingsRecord(tenantSlug: string, record: TenantSettingsRecord) {
  if (!canUseStorage()) {
    return
  }

  const current = getTenantSettingsMapFromStorage()
  current[tenantSlug] = record
  localStorage.setItem(TENANT_SETTINGS_STORAGE_KEY, JSON.stringify(current))
  emitTenantSettingsUpdated()
}

