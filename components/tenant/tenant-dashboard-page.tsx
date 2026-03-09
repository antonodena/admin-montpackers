"use client"

import { AppSidebar } from "@/components/app-sidebar"
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
import type { Tenant } from "@/lib/mock-data"

const stats = [
  { title: "Visitantes hoy", value: "2.154", detail: "+12.4%" },
  { title: "Eventos activos", value: "18", detail: "3 pendientes" },
  { title: "Kioskos online", value: "24/26", detail: "2 desconectados" },
]

type TenantDashboardPageProps = {
  tenant: Tenant
}

export function TenantDashboardPage({ tenant }: TenantDashboardPageProps) {
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
                <BreadcrumbPage>{tenant.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <section className="grid gap-4 md:grid-cols-3">
            {stats.map((stat) => (
              <article key={stat.title} className="rounded-xl border bg-card p-4">
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight">{stat.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.detail}</p>
              </article>
            ))}
          </section>

          <section className="rounded-xl border bg-card p-5">
            <h2 className="text-lg font-semibold">Actividad reciente</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Vista principal del panel de {tenant.name}. Puedes conectar aquí tus módulos
              de rutas, eventos, instalaciones y kioskos.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg bg-muted p-4 text-sm">Ruta urbana A7 actualizada</div>
              <div className="rounded-lg bg-muted p-4 text-sm">Nuevo evento en recepción</div>
              <div className="rounded-lg bg-muted p-4 text-sm">Kiosko Hall sincronizado</div>
              <div className="rounded-lg bg-muted p-4 text-sm">Instalación Norte en revisión</div>
            </div>
            <div className="mt-6 rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">
              Site URL del tenant: <span className="font-medium text-foreground">{tenant.siteUrl}</span>
            </div>
          </section>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
