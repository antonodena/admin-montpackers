"use client"

import Link from "next/link"
import { usePathname, useParams } from "next/navigation"

import { AppSidebar } from "@/components/app-sidebar"
import { PageMessageCard } from "@/components/shared/page-message-card"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useResolvedTenant } from "@/hooks/use-resolved-tenant"

type TenantSettingsLayoutShellProps = {
  children: React.ReactNode
}

const SECTION_LABELS: Record<string, string> = {
  general: "General",
  appearance: "Apariencia",
  domains: "Dominios",
  account: "Usuario y contraseña",
  team: "Equipo",
  notifications: "Notificaciones",
}

export function TenantSettingsLayoutShell({
  children,
}: TenantSettingsLayoutShellProps) {
  const pathname = usePathname()
  const params = useParams<{ tenantSlug: string }>()
  const tenant = useResolvedTenant(params.tenantSlug)
  const activeSection = pathname.split("/").at(-1) ?? "general"
  const activeSectionLabel = SECTION_LABELS[activeSection] ?? "Ajustes"

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
      <AppSidebar mode="settings" tenantName={tenant.name} tenantSlug={tenant.slug} />
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
                <BreadcrumbLink href={`/tenant/${tenant.slug}/settings/general`}>
                  Ajustes
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{activeSectionLabel}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
