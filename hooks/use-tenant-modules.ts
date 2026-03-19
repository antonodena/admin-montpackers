"use client"

import * as React from "react"

import {
  getTenantModuleRecord,
  NEXT_MONTH_SUBSCRIPTION_BASE_PRICE,
  TENANT_MODULE_CATALOG,
  TENANT_MODULES_UPDATED_EVENT,
  updateTenantModuleStatus,
  type TenantModuleDefinition,
  type TenantModuleId,
  type TenantModuleStatus,
} from "@/lib/tenant-module-storage"

export type TenantModuleWithStatus = TenantModuleDefinition & {
  status: TenantModuleStatus
}

type TenantModulesSnapshot = {
  modules: TenantModuleWithStatus[]
  freeModules: TenantModuleWithStatus[]
  paidModules: TenantModuleWithStatus[]
  activeFreeCount: number
  requestedPaidCount: number
  requestedPaidSubtotal: number
  projectedNextMonthBase: number
  projectedNextMonthTotal: number
}

function buildTenantModulesSnapshot(tenantSlug?: string): TenantModulesSnapshot {
  const moduleRecord = getTenantModuleRecord(tenantSlug)
  const modules = TENANT_MODULE_CATALOG.map((module) => ({
    ...module,
    status: moduleRecord[module.id],
  }))
  const freeModules = modules.filter((module) => module.tier === "free")
  const paidModules = modules.filter((module) => module.tier === "paid")
  const activeFreeCount = freeModules.filter((module) => module.status === "active").length
  const requestedPaidModules = paidModules.filter((module) => module.status === "requested")
  const requestedPaidCount = requestedPaidModules.length
  const requestedPaidSubtotal = requestedPaidModules.reduce(
    (subtotal, module) => subtotal + module.monthlyAddonPrice,
    0
  )

  return {
    modules,
    freeModules,
    paidModules,
    activeFreeCount,
    requestedPaidCount,
    requestedPaidSubtotal,
    projectedNextMonthBase: NEXT_MONTH_SUBSCRIPTION_BASE_PRICE,
    projectedNextMonthTotal: NEXT_MONTH_SUBSCRIPTION_BASE_PRICE + requestedPaidSubtotal,
  }
}

export function useTenantModules(tenantSlug?: string) {
  const [snapshot, setSnapshot] = React.useState<TenantModulesSnapshot>(() =>
    buildTenantModulesSnapshot(tenantSlug)
  )

  React.useEffect(() => {
    setSnapshot(buildTenantModulesSnapshot(tenantSlug))
  }, [tenantSlug])

  React.useEffect(() => {
    function syncSnapshot() {
      setSnapshot(buildTenantModulesSnapshot(tenantSlug))
    }

    window.addEventListener(TENANT_MODULES_UPDATED_EVENT, syncSnapshot as EventListener)
    window.addEventListener("storage", syncSnapshot)

    return () => {
      window.removeEventListener(TENANT_MODULES_UPDATED_EVENT, syncSnapshot as EventListener)
      window.removeEventListener("storage", syncSnapshot)
    }
  }, [tenantSlug])

  function toggleFreeModule(moduleId: TenantModuleId) {
    if (!tenantSlug) {
      return
    }

    const moduleDefinition = TENANT_MODULE_CATALOG.find((item) => item.id === moduleId)

    if (!moduleDefinition || moduleDefinition.tier !== "free") {
      return
    }

    const currentRecord = getTenantModuleRecord(tenantSlug)
    const nextStatus = currentRecord[moduleId] === "active" ? "inactive" : "active"

    updateTenantModuleStatus(tenantSlug, moduleId, nextStatus)
    setSnapshot(buildTenantModulesSnapshot(tenantSlug))
  }

  function requestPaidModule(moduleId: TenantModuleId) {
    if (!tenantSlug) {
      return
    }

    const moduleDefinition = TENANT_MODULE_CATALOG.find((item) => item.id === moduleId)

    if (!moduleDefinition || moduleDefinition.tier !== "paid") {
      return
    }

    updateTenantModuleStatus(tenantSlug, moduleId, "requested")
    setSnapshot(buildTenantModulesSnapshot(tenantSlug))
  }

  return {
    ...snapshot,
    toggleFreeModule,
    requestPaidModule,
  }
}
