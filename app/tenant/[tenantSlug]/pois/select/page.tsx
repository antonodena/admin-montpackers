"use client"

import Link from "next/link"
import * as React from "react"
import { useParams, useRouter } from "next/navigation"

import { AppSidebar } from "@/components/app-sidebar"
import { CreatePoiAction } from "@/components/pois/create-poi-action"
import { PoiLibraryTable } from "@/components/pois/poi-library-table"
import { PageMessageCard } from "@/components/shared/page-message-card"
import { PageSectionCard } from "@/components/shared/page-section-card"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useResolvedTenant } from "@/hooks/use-resolved-tenant"
import { assignPoisToTenant, getAllPois, getTenantPois } from "@/lib/poi-storage"

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values))
}

export default function TenantSelectLibraryPoisPage() {
  const router = useRouter()
  const params = useParams<{ tenantSlug: string }>()
  const tenantSlug = params.tenantSlug

  const tenant = useResolvedTenant(tenantSlug)
  const allPois = React.useMemo(() => getAllPois(), [])
  const assignedPoiIds = React.useMemo(
    () => (tenantSlug ? getTenantPois(tenantSlug).map((poi) => poi.id) : []),
    [tenantSlug]
  )
  const [selectedPoiIds, setSelectedPoiIds] = React.useState<string[]>([])
  const [filteredPoiIds, setFilteredPoiIds] = React.useState<string[]>([])
  const [searchText, setSearchText] = React.useState("")
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (assignedPoiIds.length === 0) {
      return
    }

    const assignedSet = new Set(assignedPoiIds)
    setSelectedPoiIds((current) => current.filter((poiId) => !assignedSet.has(poiId)))
  }, [assignedPoiIds])

  const selectedPoiSet = React.useMemo(() => new Set(selectedPoiIds), [selectedPoiIds])

  const allFilteredSelected =
    filteredPoiIds.length > 0 && filteredPoiIds.every((poiId) => selectedPoiSet.has(poiId))

  function handleToggleSelectAllFiltered() {
    if (filteredPoiIds.length === 0) {
      return
    }

    if (allFilteredSelected) {
      const filteredSet = new Set(filteredPoiIds)
      setSelectedPoiIds((current) => current.filter((poiId) => !filteredSet.has(poiId)))
      return
    }

    setSelectedPoiIds((current) => uniqueStrings([...current, ...filteredPoiIds]))
  }

  async function handleSave() {
    if (!tenant || selectedPoiIds.length === 0 || isSubmitting) {
      return
    }

    setSubmitError(null)
    setIsSubmitting(true)

    try {
      assignPoisToTenant(tenant.slug, selectedPoiIds)
      router.push(`/tenant/${tenant.slug}/pois`)
    } catch {
      setSubmitError("No se han podido guardar los POIs seleccionados. Inténtalo de nuevo.")
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleCancel() {
    if (!tenant) {
      return
    }

    router.push(`/tenant/${tenant.slug}/pois`)
  }

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
                <BreadcrumbPage>Seleccionar de biblioteca</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:p-6">
          <PageSectionCard
            title="Seleccionar POIs de la biblioteca"
            description={`Selecciona POIs globales para añadirlos al tenant ${tenant.name}.`}
          >
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={selectedPoiIds.length === 0 || isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar"}
              </Button>
              <Input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Buscar un POI..."
                className="sm:ml-auto sm:max-w-sm"
              />
              <Button
                variant="outline"
                onClick={handleToggleSelectAllFiltered}
                disabled={filteredPoiIds.length === 0}
              >
                {allFilteredSelected ? "Deseleccionar todos" : "Seleccionar todos"}
              </Button>
            </div>

            <p className="mb-3 text-sm text-muted-foreground">
              {selectedPoiIds.length} seleccionados · {filteredPoiIds.length} filtrados
            </p>

            <PoiLibraryTable
              pois={allPois}
              mode="select"
              excludedPoiIds={assignedPoiIds}
              selectedPoiIds={selectedPoiIds}
              onSelectedPoiIdsChange={setSelectedPoiIds}
              onFilteredPoiIdsChange={setFilteredPoiIds}
              searchText={searchText}
              onSearchTextChange={setSearchText}
              emptyMessage="No hay POIs disponibles para añadir con los filtros actuales."
              filterDialogTitle="Filtros de biblioteca"
              filterDialogDescription="Filtra POIs para seleccionar los que quieras añadir al tenant."
              toolbarAction={<CreatePoiAction href={`/tenant/${tenant.slug}/pois/new`} />}
            />

            {submitError && <p className="mt-3 text-sm text-destructive">{submitError}</p>}
          </PageSectionCard>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
