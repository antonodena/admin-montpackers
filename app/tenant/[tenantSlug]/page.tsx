"use client"

import Link from "next/link"
import * as React from "react"
import { useParams } from "next/navigation"

import { TenantDashboardPage } from "@/components/tenant/tenant-dashboard-page"
import { Button } from "@/components/ui/button"
import { tenants } from "@/lib/mock-data"
import { getCreatedTenantsFromStorage, mergeTenants } from "@/lib/tenant-storage"

export default function TenantPage() {
  const params = useParams<{ tenantSlug: string }>()
  const tenantSlug = params.tenantSlug

  const [createdTenants, setCreatedTenants] = React.useState(getCreatedTenantsFromStorage())

  React.useEffect(() => {
    setCreatedTenants(getCreatedTenantsFromStorage())
  }, [])

  const allTenants = React.useMemo(
    () => mergeTenants(tenants, createdTenants),
    [createdTenants]
  )
  const tenant = allTenants.find((item) => item.slug === tenantSlug)

  if (!tenant) {
    return (
      <section className="m-6 rounded-xl border bg-card p-5">
        <h1 className="text-lg font-semibold">Tenant no encontrado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          El tenant que intentas abrir no existe en esta instancia.
        </p>
        <div className="mt-4 flex gap-2">
          <Button asChild>
            <Link href="/admin/tenants">Volver a admin tenants</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Ir al tenant por defecto</Link>
          </Button>
        </div>
      </section>
    )
  }

  return <TenantDashboardPage tenant={tenant} />
}
