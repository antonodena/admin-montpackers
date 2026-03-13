export const KIOSK_CONFIGS_STORAGE_KEY = "montpackers.kioskConfigs.v1"

const KIOSK_IDS = ["hall", "recepcion"] as const

export type KioskId = (typeof KIOSK_IDS)[number]

export type KioskVideoAsset = {
  assetKey: string
  fileName: string
  mimeType: string
  size: number
  updatedAt: number
}

export type KioskImageAsset = {
  id: string
  dataUrl: string
  fileName: string
  mimeType: string
}

export type KioskConfig = {
  id: KioskId
  name: string
  infoMessage: string
  location: {
    lat: number
    lng: number
  }
  screensaverVideo: KioskVideoAsset | null
  imageAssets: KioskImageAsset[]
}

export type TenantKioskConfigMap = Record<string, Record<KioskId, KioskConfig>>

type KioskRecord = Record<KioskId, KioskConfig>

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isKioskId(value: unknown): value is KioskId {
  return typeof value === "string" && KIOSK_IDS.includes(value as KioskId)
}

function defaultNameForKiosk(id: KioskId) {
  return id === "hall" ? "Hall" : "Recepción"
}

function buildDefaultKioskConfig(id: KioskId): KioskConfig {
  return {
    id,
    name: defaultNameForKiosk(id),
    infoMessage: "",
    location: {
      lat: 0,
      lng: 0,
    },
    screensaverVideo: null,
    imageAssets: [],
  }
}

function buildDefaultTenantKioskConfigs(): KioskRecord {
  return {
    hall: buildDefaultKioskConfig("hall"),
    recepcion: buildDefaultKioskConfig("recepcion"),
  }
}

function sanitizeKioskVideoAsset(value: unknown): KioskVideoAsset | null {
  if (!isObjectRecord(value)) {
    return null
  }

  const assetKey = typeof value.assetKey === "string" ? value.assetKey.trim() : ""
  const fileName = typeof value.fileName === "string" ? value.fileName.trim() : ""
  const mimeType = typeof value.mimeType === "string" ? value.mimeType.trim() : ""
  const size = typeof value.size === "number" && Number.isFinite(value.size) && value.size >= 0 ? value.size : -1
  const updatedAt =
    typeof value.updatedAt === "number" && Number.isFinite(value.updatedAt) && value.updatedAt > 0
      ? value.updatedAt
      : -1

  if (!assetKey || !fileName || !mimeType || size < 0 || updatedAt < 0) {
    return null
  }

  return {
    assetKey,
    fileName,
    mimeType,
    size,
    updatedAt,
  }
}

function sanitizeKioskImageAssets(value: unknown): KioskImageAsset[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap((item, index) => {
    if (!isObjectRecord(item)) {
      return []
    }

    const id = typeof item.id === "string" && item.id.trim().length > 0 ? item.id : `image_${index}`
    const dataUrl = typeof item.dataUrl === "string" ? item.dataUrl.trim() : ""
    const fileName = typeof item.fileName === "string" ? item.fileName.trim() : ""
    const mimeType = typeof item.mimeType === "string" ? item.mimeType.trim() : ""

    if (!dataUrl || !fileName || !mimeType) {
      return []
    }

    return [
      {
        id,
        dataUrl,
        fileName,
        mimeType,
      } satisfies KioskImageAsset,
    ]
  })
}

function sanitizeKioskConfig(id: KioskId, value: unknown): KioskConfig {
  const defaults = buildDefaultKioskConfig(id)

  if (!isObjectRecord(value)) {
    return defaults
  }

  const location = isObjectRecord(value.location) ? value.location : {}
  const lat: number =
    typeof location.lat === "number" && Number.isFinite(location.lat)
      ? location.lat
      : defaults.location.lat
  const lng: number =
    typeof location.lng === "number" && Number.isFinite(location.lng)
      ? location.lng
      : defaults.location.lng

  return {
    id,
    name: typeof value.name === "string" && value.name.trim().length > 0 ? value.name : defaults.name,
    infoMessage: typeof value.infoMessage === "string" ? value.infoMessage : "",
    location: {
      lat,
      lng,
    },
    screensaverVideo: sanitizeKioskVideoAsset(value.screensaverVideo),
    imageAssets: sanitizeKioskImageAssets(value.imageAssets),
  }
}

function sanitizeTenantKioskRecord(value: unknown): KioskRecord {
  const defaults = buildDefaultTenantKioskConfigs()

  if (!isObjectRecord(value)) {
    return defaults
  }

  return {
    hall: sanitizeKioskConfig("hall", value.hall),
    recepcion: sanitizeKioskConfig("recepcion", value.recepcion),
  }
}

function readTenantKioskConfigMapFromStorage() {
  if (!canUseStorage()) {
    return {} as TenantKioskConfigMap
  }

  const raw = window.localStorage.getItem(KIOSK_CONFIGS_STORAGE_KEY)
  if (!raw) {
    return {} as TenantKioskConfigMap
  }

  try {
    const parsed = JSON.parse(raw)

    if (!isObjectRecord(parsed)) {
      return {} as TenantKioskConfigMap
    }

    const sanitized: TenantKioskConfigMap = {}

    for (const [tenantSlug, tenantConfigValue] of Object.entries(parsed)) {
      if (typeof tenantSlug !== "string" || tenantSlug.length === 0) {
        continue
      }

      sanitized[tenantSlug] = sanitizeTenantKioskRecord(tenantConfigValue)
    }

    return sanitized
  } catch {
    return {} as TenantKioskConfigMap
  }
}

function writeTenantKioskConfigMapToStorage(map: TenantKioskConfigMap) {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(KIOSK_CONFIGS_STORAGE_KEY, JSON.stringify(map))
}

export function getTenantKioskConfigs(tenantSlug: string): Record<KioskId, KioskConfig> {
  const map = readTenantKioskConfigMapFromStorage()
  const tenantConfigs = map[tenantSlug]

  if (!tenantConfigs) {
    return buildDefaultTenantKioskConfigs()
  }

  return sanitizeTenantKioskRecord(tenantConfigs)
}

export function saveTenantKioskConfig(tenantSlug: string, config: KioskConfig) {
  if (!tenantSlug || !isKioskId(config.id)) {
    return
  }

  const map = readTenantKioskConfigMapFromStorage()
  const tenantConfigs = sanitizeTenantKioskRecord(map[tenantSlug])
  const nextConfig = sanitizeKioskConfig(config.id, config)

  map[tenantSlug] = {
    ...tenantConfigs,
    [config.id]: nextConfig,
  }

  writeTenantKioskConfigMapToStorage(map)
}
