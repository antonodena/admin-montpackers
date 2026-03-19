"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"

import { AppSidebar } from "@/components/app-sidebar"
import { PoiCreateScreen } from "@/components/pois/poi-create-screen"
import { PageMessageCard } from "@/components/shared/page-message-card"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useResolvedTenant } from "@/hooks/use-resolved-tenant"

export default function TenantCreatePoiPage() {
  const router = useRouter()
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

  return (
    <SidebarProvider defaultOpen>
      <AppSidebar tenantName={tenant.name} tenantSlug={tenant.slug} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border/40 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/admin/tenants">Admin panel</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbLink href={`/tenant/${tenant.slug}`}>{tenant.name}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={`/tenant/${tenant.slug}/pois`}>
                  Puntos de interés
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Nuevo POI</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <section>
            <PoiCreateScreen
              mode="tenant"
              tenant={tenant}
              cancelHref={`/tenant/${tenant.slug}/pois`}
              onCreated={() => router.push(`/tenant/${tenant.slug}/pois?created=1`)}
            />
          </section>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
