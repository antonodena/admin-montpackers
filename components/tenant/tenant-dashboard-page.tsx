"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { PageSectionCard } from "@/components/shared/page-section-card"
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
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Tenant } from "@/lib/mock-data"

const stats = [
  { title: "Visitantes hoy", value: "2.154", detail: "+12.4%" },
  { title: "Eventos activos", value: "18", detail: "3 pendientes" },
  { title: "Kioskos online", value: "24/26", detail: "2 desconectados" },
]

const recentActivity = [
  "Ruta urbana A7 actualizada",
  "Nuevo evento en recepción",
  "Kiosko Hall sincronizado",
  "Instalación Norte en revisión",
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
              <Card key={stat.title}>
                <CardHeader className="gap-1">
                  <CardDescription>{stat.title}</CardDescription>
                  <CardTitle className="text-3xl tracking-tight">{stat.value}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary">{stat.detail}</Badge>
                </CardContent>
              </Card>
            ))}
          </section>

          <PageSectionCard
            title="Actividad reciente"
            description={`Vista principal del panel de ${tenant.name}. Puedes conectar aquí tus módulos de rutas, eventos, instalaciones y kioskos.`}
            contentClassName="flex flex-col gap-6"
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {recentActivity.map((item) => (
                <Card key={item} className="gap-0 py-0">
                  <CardContent className="p-4 text-sm">{item}</CardContent>
                </Card>
              ))}
            </div>
            <Card className="gap-0 bg-muted/40">
              <CardContent className="p-4 text-sm text-muted-foreground">
              Site URL del tenant: <span className="font-medium text-foreground">{tenant.siteUrl}</span>
              </CardContent>
            </Card>
          </PageSectionCard>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
