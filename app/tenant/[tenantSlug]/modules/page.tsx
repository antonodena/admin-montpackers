"use client"

import Link from "next/link"
import * as React from "react"
import { useParams } from "next/navigation"
import { Check } from "lucide-react"

import { AppSidebar } from "@/components/app-sidebar"
import { PageMessageCard } from "@/components/shared/page-message-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Switch } from "@/components/ui/switch"
import { useResolvedTenant } from "@/hooks/use-resolved-tenant"
import {
  useTenantModules,
  type TenantModuleWithStatus,
} from "@/hooks/use-tenant-modules"
import { formatEuro } from "@/lib/tenant-module-storage"

function getTierLabel(module: TenantModuleWithStatus) {
  return module.tier === "free" ? "Gratis" : "De pago"
}

function getTierVariant(module: TenantModuleWithStatus) {
  return module.tier === "free" ? "secondary" : "outline"
}

function getStatusLabel(module: TenantModuleWithStatus) {
  if (module.status === "requested") {
    return "Pendiente"
  }

  if (module.status === "active") {
    return "Activo"
  }

  return "Disponible"
}

function getStatusVariant(module: TenantModuleWithStatus) {
  if (module.status === "requested") {
    return "secondary"
  }

  if (module.status === "active") {
    return "default"
  }

  return "outline"
}

function SummaryMetric({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail: string
}) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
    </div>
  )
}

function ModuleCard({
  module,
  onToggleFreeModule,
  onRequestPaidModule,
}: {
  module: TenantModuleWithStatus
  onToggleFreeModule: (moduleId: TenantModuleWithStatus["id"]) => void
  onRequestPaidModule: (moduleId: TenantModuleWithStatus["id"]) => void
}) {
  const Icon = module.icon
  const switchId = `tenant-module-${module.id}`

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-muted">
            <Icon className="size-5" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base">{module.name}</CardTitle>
            <CardDescription className="mt-1">{module.description}</CardDescription>
          </div>
        </div>
        <CardAction className="flex flex-wrap justify-end gap-2">
          <Badge variant={getTierVariant(module)}>{getTierLabel(module)}</Badge>
          <Badge variant={getStatusVariant(module)}>{getStatusLabel(module)}</Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4">
        {module.tier === "paid" ? (
          <div className="rounded-lg border bg-muted/40 p-3">
            <p className="text-sm font-medium">Add-on mensual</p>
            <p className="mt-1 text-sm text-muted-foreground">
              +{formatEuro(module.monthlyAddonPrice)} / mes sobre la suscripción base.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border bg-muted/40 p-3">
            <p className="text-sm font-medium">Incluido sin coste adicional</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Se activa al instante para este tenant y no altera la cuota del próximo mes.
            </p>
          </div>
        )}

        <ul className="flex flex-col gap-2">
          {module.highlights.map((highlight) => (
            <li key={highlight} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>{highlight}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      {module.tier === "free" ? (
        <CardFooter className="justify-between gap-4 border-t">
          <div className="flex flex-col gap-1">
            <label htmlFor={switchId} className="text-sm font-medium">
              Activación inmediata
            </label>
            <p className="text-sm text-muted-foreground">
              Estado actual: {module.status === "active" ? "Activo" : "Inactivo"}
            </p>
          </div>
          <Switch
            id={switchId}
            checked={module.status === "active"}
            aria-label={`Activar ${module.name}`}
            onCheckedChange={() => onToggleFreeModule(module.id)}
          />
        </CardFooter>
      ) : (
        <CardFooter className="flex-col items-stretch gap-4 border-t">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">Impacto de suscripción</p>
              <p className="text-sm text-muted-foreground">
                Se añadirá al importe del próximo mes cuando la solicitud quede registrada.
              </p>
            </div>
            <p className="text-lg font-semibold">+{formatEuro(module.monthlyAddonPrice)}</p>
          </div>
          <Button
            className="w-full"
            disabled={module.status === "requested"}
            onClick={() => onRequestPaidModule(module.id)}
          >
            {module.status === "requested" ? "Solicitud enviada" : "Solicitar activación"}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

export default function TenantModulesPage() {
  const params = useParams<{ tenantSlug: string }>()
  const tenant = useResolvedTenant(params.tenantSlug)
  const {
    freeModules,
    paidModules,
    activeFreeCount,
    requestedPaidCount,
    requestedPaidSubtotal,
    projectedNextMonthBase,
    projectedNextMonthTotal,
    requestPaidModule,
    toggleFreeModule,
  } = useTenantModules(params.tenantSlug)

  const [selectedPaidModuleId, setSelectedPaidModuleId] = React.useState<string | null>(null)
  const [feedbackMessage, setFeedbackMessage] = React.useState<string | null>(null)

  const selectedPaidModule =
    paidModules.find((module) => module.id === selectedPaidModuleId) ?? null

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

  function handleToggleFreeModule(moduleId: TenantModuleWithStatus["id"]) {
    setFeedbackMessage(null)
    toggleFreeModule(moduleId)
  }

  function handleRequestPaidModule(moduleId: TenantModuleWithStatus["id"]) {
    setSelectedPaidModuleId(moduleId)
    setFeedbackMessage(null)
  }

  function handleConfirmPaidModule() {
    if (!selectedPaidModule) {
      return
    }

    const nextProjectedTotal =
      projectedNextMonthTotal +
      (selectedPaidModule.status === "requested" ? 0 : selectedPaidModule.monthlyAddonPrice)

    requestPaidModule(selectedPaidModule.id)
    setFeedbackMessage(
      `Solicitud enviada para ${selectedPaidModule.name}. Total estimado próximo mes: ${formatEuro(nextProjectedTotal)} / mes.`
    )
    setSelectedPaidModuleId(null)
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
                <BreadcrumbPage>Módulos</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Suscripción y módulos</CardTitle>
              <CardDescription>
                Activa módulos gratuitos y simula el impacto mensual de los add-ons de pago
                antes de contratarlos para {tenant.name}.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <SummaryMetric
                label="Base próximo mes"
                value={`${formatEuro(projectedNextMonthBase)} / mes`}
                detail="Cuota base simulada del tenant."
              />
              <SummaryMetric
                label="Módulos gratis activos"
                value={String(activeFreeCount)}
                detail="Activados sin coste adicional."
              />
              <SummaryMetric
                label="Add-ons solicitados"
                value={String(requestedPaidCount)}
                detail={`Subtotal: ${formatEuro(requestedPaidSubtotal)} / mes`}
              />
              <SummaryMetric
                label="Total estimado próximo mes"
                value={`${formatEuro(projectedNextMonthTotal)} / mes`}
                detail={
                  requestedPaidSubtotal > 0
                    ? `${formatEuro(projectedNextMonthBase)} + ${formatEuro(requestedPaidSubtotal)} en add-ons`
                    : "Todavía sin suplementos de pago."
                }
              />
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 border-t">
              <p className="text-sm font-medium">
                Suscripción base próximo mes: {formatEuro(projectedNextMonthBase)} / mes
              </p>
              <p className="text-sm text-muted-foreground">
                {requestedPaidSubtotal > 0
                  ? `Total estimado próximo mes: ${formatEuro(projectedNextMonthBase)} + ${formatEuro(requestedPaidSubtotal)} = ${formatEuro(projectedNextMonthTotal)} / mes`
                  : `Total estimado próximo mes: ${formatEuro(projectedNextMonthTotal)} / mes`}
              </p>
              {feedbackMessage ? (
                <div className="w-full rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
                  {feedbackMessage}
                </div>
              ) : null}
            </CardFooter>
          </Card>

          <section className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-lg font-semibold">Módulos gratuitos</h1>
              <p className="text-sm text-muted-foreground">
                Se pueden activar o desactivar al instante desde el propio tenant.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {freeModules.map((module) => (
                <ModuleCard
                  key={module.id}
                  module={module}
                  onToggleFreeModule={handleToggleFreeModule}
                  onRequestPaidModule={handleRequestPaidModule}
                />
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold">Add-ons de pago</h2>
              <p className="text-sm text-muted-foreground">
                Simula qué módulos premium quieres añadir a la suscripción del próximo mes.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {paidModules.map((module) => (
                <ModuleCard
                  key={module.id}
                  module={module}
                  onToggleFreeModule={handleToggleFreeModule}
                  onRequestPaidModule={handleRequestPaidModule}
                />
              ))}
            </div>
          </section>
        </main>

        <Dialog
          open={selectedPaidModule !== null}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedPaidModuleId(null)
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Solicitar activación del add-on</DialogTitle>
              <DialogDescription>
                Confirma el impacto mensual estimado antes de enviar la solicitud para este
                tenant.
              </DialogDescription>
            </DialogHeader>

            {selectedPaidModule ? (
              <div className="flex flex-col gap-4">
                <div className="rounded-lg border bg-muted/40 p-4">
                  <p className="text-sm font-medium">{selectedPaidModule.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedPaidModule.description}
                  </p>
                </div>

                <div className="flex flex-col gap-3 rounded-lg border p-4">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-muted-foreground">Base próximo mes</span>
                    <span className="font-medium">
                      {formatEuro(projectedNextMonthBase)} / mes
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-muted-foreground">Add-on seleccionado</span>
                    <span className="font-medium">
                      +{formatEuro(selectedPaidModule.monthlyAddonPrice)} / mes
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="font-medium">Total estimado próximo mes</span>
                    <span className="text-base font-semibold">
                      {formatEuro(projectedNextMonthBase)} +{" "}
                      {formatEuro(selectedPaidModule.monthlyAddonPrice)} ={" "}
                      {formatEuro(
                        projectedNextMonthTotal +
                          (selectedPaidModule.status === "requested"
                            ? 0
                            : selectedPaidModule.monthlyAddonPrice)
                      )}{" "}
                      / mes
                    </span>
                  </div>
                </div>
              </div>
            ) : null}

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button onClick={handleConfirmPaidModule}>Confirmar solicitud</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  )
}
