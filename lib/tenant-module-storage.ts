import {
  Bot,
  Camera,
  CloudSun,
  Mountain,
  Ticket,
  type LucideIcon,
} from "lucide-react"

export const TENANT_MODULES_STORAGE_KEY = "montpackers.tenantModules.v1"
export const TENANT_MODULES_UPDATED_EVENT = "montpackers:tenant-modules-updated"
export const NEXT_MONTH_SUBSCRIPTION_BASE_PRICE = 249

export const TENANT_MODULE_IDS = [
  "webcams",
  "ski-info",
  "weather",
  "activity-sales",
  "ai-concierge",
] as const

export type TenantModuleId = (typeof TENANT_MODULE_IDS)[number]
export type TenantModuleTier = "free" | "paid"
export type TenantModuleStatus = "inactive" | "active" | "requested"

export type TenantModuleDefinition = {
  id: TenantModuleId
  name: string
  description: string
  tier: TenantModuleTier
  monthlyAddonPrice: number
  icon: LucideIcon
  highlights: string[]
}

export type TenantModuleRecord = Record<TenantModuleId, TenantModuleStatus>

type TenantModulesMap = Record<string, TenantModuleRecord>

export const TENANT_MODULE_CATALOG: TenantModuleDefinition[] = [
  {
    id: "webcams",
    name: "Módulo de webcams",
    description: "Publica cámaras en directo del entorno del hotel y de puntos clave.",
    tier: "free",
    monthlyAddonPrice: 0,
    icon: Camera,
    highlights: [
      "Muestra vistas en tiempo real dentro del tenant.",
      "Ideal para accesos, zonas comunes y panorámicas del destino.",
    ],
  },
  {
    id: "ski-info",
    name: "Info de pistas de esquí",
    description: "Centraliza el estado de pistas, remontes y parte de nieve.",
    tier: "free",
    monthlyAddonPrice: 0,
    icon: Mountain,
    highlights: [
      "Resume aperturas, cierres y condiciones del día.",
      "Ayuda al huésped a decidir qué zona visitar antes de salir.",
    ],
  },
  {
    id: "weather",
    name: "Módulo del tiempo",
    description: "Añade previsión meteorológica local dentro de la experiencia del tenant.",
    tier: "free",
    monthlyAddonPrice: 0,
    icon: CloudSun,
    highlights: [
      "Pronóstico visible por franjas y próximos días.",
      "Útil para anticipar actividades y avisos del hotel.",
    ],
  },
  {
    id: "activity-sales",
    name: "Venta de actividades",
    description: "Permite promocionar y vender actividades adicionales desde el tenant.",
    tier: "paid",
    monthlyAddonPrice: 129,
    icon: Ticket,
    highlights: [
      "Catálogo de experiencias complementarias para el huésped.",
      "Pensado para aumentar ingresos con reservas y upselling.",
    ],
  },
  {
    id: "ai-concierge",
    name: "Conserje IA",
    description: "Ofrece una capa conversacional para resolver dudas frecuentes del huésped.",
    tier: "paid",
    monthlyAddonPrice: 199,
    icon: Bot,
    highlights: [
      "Atiende preguntas operativas y recomendaciones básicas 24/7.",
      "Reduce carga del equipo de recepción en consultas repetitivas.",
    ],
  },
]

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isTenantModuleId(value: unknown): value is TenantModuleId {
  return typeof value === "string" && TENANT_MODULE_IDS.includes(value as TenantModuleId)
}

function sanitizeTenantModuleStatus(value: unknown): TenantModuleStatus | null {
  if (value === "inactive" || value === "active" || value === "requested") {
    return value
  }

  return null
}

export function buildDefaultTenantModuleRecord(): TenantModuleRecord {
  return {
    webcams: "inactive",
    "ski-info": "inactive",
    weather: "inactive",
    "activity-sales": "inactive",
    "ai-concierge": "inactive",
  }
}

function sanitizeTenantModuleRecord(value: unknown): TenantModuleRecord {
  const fallback = buildDefaultTenantModuleRecord()

  if (!isRecord(value)) {
    return fallback
  }

  const nextRecord = { ...fallback }

  for (const [key, moduleStatus] of Object.entries(value)) {
    if (!isTenantModuleId(key)) {
      continue
    }

    const sanitizedStatus = sanitizeTenantModuleStatus(moduleStatus)

    if (!sanitizedStatus) {
      continue
    }

    nextRecord[key] = sanitizedStatus
  }

  return nextRecord
}

function emitTenantModulesUpdated() {
  if (!canUseStorage()) {
    return
  }

  window.dispatchEvent(new CustomEvent(TENANT_MODULES_UPDATED_EVENT))
}

export function formatEuro(value: number) {
  return `${new Intl.NumberFormat("es-ES", {
    maximumFractionDigits: 0,
  }).format(value)}€`
}

export function getTenantModulesMapFromStorage() {
  if (!canUseStorage()) {
    return {} as TenantModulesMap
  }

  try {
    const raw = window.localStorage.getItem(TENANT_MODULES_STORAGE_KEY)

    if (!raw) {
      return {} as TenantModulesMap
    }

    const parsed = JSON.parse(raw)

    if (!isRecord(parsed)) {
      return {} as TenantModulesMap
    }

    const sanitized: TenantModulesMap = {}

    for (const [tenantSlug, tenantModules] of Object.entries(parsed)) {
      if (typeof tenantSlug !== "string" || tenantSlug.length === 0) {
        continue
      }

      sanitized[tenantSlug] = sanitizeTenantModuleRecord(tenantModules)
    }

    return sanitized
  } catch {
    return {} as TenantModulesMap
  }
}

export function getTenantModuleRecord(tenantSlug?: string) {
  if (!tenantSlug) {
    return buildDefaultTenantModuleRecord()
  }

  const modulesMap = getTenantModulesMapFromStorage()

  return sanitizeTenantModuleRecord(modulesMap[tenantSlug])
}

export function upsertTenantModuleRecord(tenantSlug: string, record: TenantModuleRecord) {
  if (!canUseStorage() || !tenantSlug) {
    return
  }

  const currentMap = getTenantModulesMapFromStorage()
  currentMap[tenantSlug] = sanitizeTenantModuleRecord(record)
  window.localStorage.setItem(TENANT_MODULES_STORAGE_KEY, JSON.stringify(currentMap))
  emitTenantModulesUpdated()
}

export function updateTenantModuleStatus(
  tenantSlug: string,
  moduleId: TenantModuleId,
  status: TenantModuleStatus
) {
  if (!tenantSlug) {
    return
  }

  const currentRecord = getTenantModuleRecord(tenantSlug)

  upsertTenantModuleRecord(tenantSlug, {
    ...currentRecord,
    [moduleId]: status,
  })
}
