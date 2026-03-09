"use client"

import Link from "next/link"
import * as React from "react"
import { useParams, useRouter } from "next/navigation"

import { AppSidebar } from "@/components/app-sidebar"
import { RouteLibraryTable } from "@/components/routes/route-library-table"
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
import { tenants } from "@/lib/mock-data"
import { getAllRoutes, assignRoutesToTenant, getTenantRoutes } from "@/lib/route-storage"
import { getCreatedTenantsFromStorage, mergeTenants } from "@/lib/tenant-storage"

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values))
}

export default function TenantSelectLibraryRoutesPage() {
  const router = useRouter()
  const params = useParams<{ tenantSlug: string }>()
  const tenantSlug = params.tenantSlug

  const [createdTenants, setCreatedTenants] = React.useState(getCreatedTenantsFromStorage())
  const [allRoutes, setAllRoutes] = React.useState(() => getAllRoutes())
  const [assignedRouteIds, setAssignedRouteIds] = React.useState<string[]>([])
  const [selectedRouteIds, setSelectedRouteIds] = React.useState<string[]>([])
  const [filteredRouteIds, setFilteredRouteIds] = React.useState<string[]>([])
  const [searchText, setSearchText] = React.useState("")
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    setCreatedTenants(getCreatedTenantsFromStorage())
  }, [])

  const allTenants = React.useMemo(
    () => mergeTenants(tenants, createdTenants),
    [createdTenants]
  )

  const tenant = allTenants.find((item) => item.slug === tenantSlug)

  React.useEffect(() => {
    if (!tenantSlug) {
      return
    }

    setAllRoutes(getAllRoutes())
    setAssignedRouteIds(getTenantRoutes(tenantSlug).map((route) => route.id))
  }, [tenantSlug])

  React.useEffect(() => {
    if (assignedRouteIds.length === 0) {
      return
    }

    const assignedSet = new Set(assignedRouteIds)
    setSelectedRouteIds((current) => current.filter((routeId) => !assignedSet.has(routeId)))
  }, [assignedRouteIds])

  const selectedRouteSet = React.useMemo(() => new Set(selectedRouteIds), [selectedRouteIds])

  const allFilteredSelected =
    filteredRouteIds.length > 0 && filteredRouteIds.every((routeId) => selectedRouteSet.has(routeId))

  function handleToggleSelectAllFiltered() {
    if (filteredRouteIds.length === 0) {
      return
    }

    if (allFilteredSelected) {
      const filteredSet = new Set(filteredRouteIds)
      setSelectedRouteIds((current) => current.filter((routeId) => !filteredSet.has(routeId)))
      return
    }

    setSelectedRouteIds((current) => uniqueStrings([...current, ...filteredRouteIds]))
  }

  async function handleSave() {
    if (!tenant || selectedRouteIds.length === 0 || isSubmitting) {
      return
    }

    setSubmitError(null)
    setIsSubmitting(true)

    try {
      assignRoutesToTenant(tenant.slug, selectedRouteIds)
      router.push(`/tenant/${tenant.slug}/routes`)
    } catch {
      setSubmitError("No se han podido guardar las rutas seleccionadas. Inténtalo de nuevo.")
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleCancel() {
    if (!tenant) {
      return
    }

    router.push(`/tenant/${tenant.slug}/routes`)
  }

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
                <BreadcrumbLink href={`/tenant/${tenant.slug}/routes`}>Rutas</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Seleccionar de biblioteca</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:p-6">
          <section className="min-w-0 rounded-xl border bg-card p-4 md:p-6">
            <div className="mb-4">
              <h1 className="text-lg font-semibold">Seleccionar rutas de la biblioteca</h1>
              <p className="text-sm text-muted-foreground">
                Selecciona rutas globales para añadirlas al tenant {tenant.name}.
              </p>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={selectedRouteIds.length === 0 || isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar"}
              </Button>
              <Input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Buscar una ruta..."
                className="sm:ml-auto sm:max-w-sm"
              />
              <Button
                variant="outline"
                onClick={handleToggleSelectAllFiltered}
                disabled={filteredRouteIds.length === 0}
              >
                {allFilteredSelected ? "Deseleccionar todas" : "Seleccionar todas"}
              </Button>
            </div>

            <p className="mb-3 text-sm text-muted-foreground">
              {selectedRouteIds.length} seleccionadas · {filteredRouteIds.length} filtradas
            </p>

            <RouteLibraryTable
              routes={allRoutes}
              mode="select"
              excludedRouteIds={assignedRouteIds}
              selectedRouteIds={selectedRouteIds}
              onSelectedRouteIdsChange={setSelectedRouteIds}
              onFilteredRouteIdsChange={setFilteredRouteIds}
              searchText={searchText}
              onSearchTextChange={setSearchText}
              emptyMessage="No hay rutas disponibles para añadir con los filtros actuales."
              filterDialogTitle="Filtros de biblioteca"
              filterDialogDescription="Filtra rutas para seleccionar las que quieras añadir al tenant."
            />

            {submitError && <p className="mt-3 text-sm text-destructive">{submitError}</p>}
          </section>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
