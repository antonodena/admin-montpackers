"use client"

import { PlusCircle } from "lucide-react"

import type { Tenant } from "@/lib/mock-data"
import type { RouteLibraryItem } from "@/lib/routes-data"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RouteForm } from "@/components/routes/route-form"

type RouteCreateScreenProps = {
  mode: "admin" | "tenant"
  cancelHref: string
  tenant?: Tenant
  tenants?: Tenant[]
  onCreated: (route: RouteLibraryItem, assignedTenantSlug?: string) => void
}

function getDescription(mode: "admin" | "tenant", tenant?: Tenant) {
  if (mode === "tenant" && tenant) {
    return `Crea una nueva ruta vinculada a ${tenant.name}.`
  }

  return "Crea una ruta global de Montpackers o asígnala directamente a un tenant."
}

export function RouteCreateScreen({
  mode,
  cancelHref,
  tenant,
  tenants,
  onCreated,
}: RouteCreateScreenProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <PlusCircle className="size-5" />
          <div className="flex flex-col gap-1">
            <CardTitle>Crear ruta</CardTitle>
            <CardDescription>{getDescription(mode, tenant)}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <RouteForm
          mode={mode}
          tenant={tenant}
          tenants={tenants}
          cancelHref={cancelHref}
          onCreated={onCreated}
        />
      </CardContent>
    </Card>
  )
}
