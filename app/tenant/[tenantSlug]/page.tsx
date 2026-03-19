"use client"

import Link from "next/link"
import { useParams } from "next/navigation"

import { PageMessageCard } from "@/components/shared/page-message-card"
import { TenantDashboardPage } from "@/components/tenant/tenant-dashboard-page"
import { Button } from "@/components/ui/button"
import { useResolvedTenant } from "@/hooks/use-resolved-tenant"

export default function TenantPage() {
  const params = useParams<{ tenantSlug: string }>()
  const tenant = useResolvedTenant(params.tenantSlug)

  if (!tenant) {
    return (
      <PageMessageCard
        title="Tenant no encontrado"
        description="El tenant que intentas abrir no existe en esta instancia."
        className="m-6"
        action={
          <>
            <Button asChild>
              <Link href="/admin/tenants">Volver a admin tenants</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Ir al tenant por defecto</Link>
            </Button>
          </>
        }
        footerClassName="flex flex-wrap gap-2"
      />
    )
  }

  return <TenantDashboardPage tenant={tenant} />
}
