"use client"

import { PlusCircle } from "lucide-react"

import type { Tenant } from "@/lib/mock-data"
import type { PoiLibraryItem } from "@/lib/poi-storage"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PoiForm } from "@/components/pois/poi-form"

type PoiCreateScreenProps = {
  mode: "admin" | "tenant"
  cancelHref: string
  tenant?: Tenant
  tenants?: Tenant[]
  onCreated: (poi: PoiLibraryItem, assignedTenantSlug?: string) => void
}

function getDescription(mode: "admin" | "tenant", tenant?: Tenant) {
  if (mode === "tenant" && tenant) {
    return `Crea un nuevo punto de interés vinculado a ${tenant.name}.`
  }

  return "Crea un POI global de Montpackers o asígnalo directamente a un tenant."
}

export function PoiCreateScreen({
  mode,
  cancelHref,
  tenant,
  tenants,
  onCreated,
}: PoiCreateScreenProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <PlusCircle className="size-5" />
          <div className="flex flex-col gap-1">
            <CardTitle>Crear POI</CardTitle>
            <CardDescription>{getDescription(mode, tenant)}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <PoiForm
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
