"use client"

import Link from "next/link"
import { useParams } from "next/navigation"

import { TenantDashboardPage } from "@/components/tenant/tenant-dashboard-page"
import { Button } from "@/components/ui/button"
import { useResolvedTenant } from "@/hooks/use-resolved-tenant"

export default function TenantPage() {
  const params = useParams<{ tenantSlug: string }>()
  const tenant = useResolvedTenant(params.tenantSlug)

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
