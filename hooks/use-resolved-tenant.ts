"use client"

import * as React from "react"

import { tenants, type Tenant } from "@/lib/mock-data"
import {
  getStoredTenantsFromStorage,
  mergeTenants,
  STORED_TENANTS_UPDATED_EVENT,
} from "@/lib/tenant-storage"

function getResolvedTenantsSnapshot() {
  return mergeTenants(tenants, getStoredTenantsFromStorage())
}

export function useResolvedTenants() {
  const [resolvedTenants, setResolvedTenants] = React.useState<Tenant[]>(() =>
    getResolvedTenantsSnapshot()
  )

  React.useEffect(() => {
    function syncTenants() {
      setResolvedTenants(getResolvedTenantsSnapshot())
    }

    syncTenants()
    window.addEventListener(STORED_TENANTS_UPDATED_EVENT, syncTenants as EventListener)
    window.addEventListener("storage", syncTenants)

    return () => {
      window.removeEventListener(STORED_TENANTS_UPDATED_EVENT, syncTenants as EventListener)
      window.removeEventListener("storage", syncTenants)
    }
  }, [])

  return resolvedTenants
}

export function useResolvedTenant(tenantSlug?: string) {
  const resolvedTenants = useResolvedTenants()

  return React.useMemo(
    () => resolvedTenants.find((tenant) => tenant.slug === tenantSlug) ?? null,
    [resolvedTenants, tenantSlug]
  )
}

