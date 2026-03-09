"use client"

import Link from "next/link"
import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import { Eye, MoreHorizontal, Plus } from "lucide-react"

import { ColumnHeader } from "@/components/admin/column-header"
import { DataTable } from "@/components/admin/data-table"
import { AddRouteChoiceDialog } from "@/components/tenant/add-route-choice-dialog"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { tenants } from "@/lib/mock-data"
import type { RouteLibraryItem } from "@/lib/routes-data"
import { getTenantRoutes } from "@/lib/route-storage"
import { getCreatedTenantsFromStorage, mergeTenants } from "@/lib/tenant-storage"

function formatDuration(durationMin: number) {
  const hours = Math.floor(durationMin / 60)
  const minutes = durationMin % 60

  if (hours === 0) {
    return `${minutes} min`
  }

  if (minutes === 0) {
    return `${hours} h`
  }

  return `${hours} h ${minutes} min`
}

function buildColumns(): ColumnDef<RouteLibraryItem>[] {
  return [
    {
      accessorKey: "coverImageUrl",
      header: "Portada",
      cell: ({ row }) => (
        <div className="h-12 w-20 overflow-hidden rounded-md border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={row.original.coverImageUrl}
            alt={row.original.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      ),
      enableSorting: false,
      enableColumnFilter: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => <ColumnHeader column={column} title="Nombre" />,
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      filterFn: (row, _columnId, filterValue) => {
        const query = String(filterValue).toLowerCase().trim()
        if (!query) {
          return true
        }

        return (
          row.original.name.toLowerCase().includes(query) ||
          row.original.author.toLowerCase().includes(query)
        )
      },
    },
    {
      accessorKey: "sport",
      header: ({ column }) => <ColumnHeader column={column} title="Deporte" />,
    },
    {
      accessorKey: "difficulty",
      header: ({ column }) => <ColumnHeader column={column} title="Dificultad" />,
    },
    {
      accessorKey: "distanceKm",
      header: ({ column }) => <ColumnHeader column={column} title="Distancia" />,
      cell: ({ row }) => `${row.original.distanceKm.toFixed(1)} km`,
    },
    {
      accessorKey: "durationMin",
      header: ({ column }) => <ColumnHeader column={column} title="Duración" />,
      cell: ({ row }) => formatDuration(row.original.durationMin),
    },
    {
      accessorKey: "author",
      header: ({ column }) => <ColumnHeader column={column} title="Autor" />,
    },
    {
      id: "actions",
      header: "Acciones",
      enableSorting: false,
      enableColumnFilter: false,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/admin/routes/${row.original.id}`}>
                <Eye className="size-4" />
                Ver ruta
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]
}

export default function TenantRoutesPage() {
  const router = useRouter()
  const params = useParams<{ tenantSlug: string }>()
  const tenantSlug = params.tenantSlug

  const [createdTenants, setCreatedTenants] = React.useState(getCreatedTenantsFromStorage())
  const [tenantRoutes, setTenantRoutes] = React.useState<RouteLibraryItem[]>([])
  const [isAddRouteChoiceOpen, setIsAddRouteChoiceOpen] = React.useState(false)

  React.useEffect(() => {
    setCreatedTenants(getCreatedTenantsFromStorage())
  }, [])

  const allTenants = React.useMemo(
    () => mergeTenants(tenants, createdTenants),
    [createdTenants]
  )

  const tenant = allTenants.find((item) => item.slug === tenantSlug)

  const columns = React.useMemo(() => buildColumns(), [])

  const refreshRoutes = React.useCallback(() => {
    if (!tenantSlug) {
      return
    }

    setTenantRoutes(getTenantRoutes(tenantSlug))
  }, [tenantSlug])

  React.useEffect(() => {
    refreshRoutes()
  }, [refreshRoutes])

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
                <BreadcrumbPage>Rutas</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <section className="rounded-xl border bg-card p-4 md:p-6">
            <div className="mb-4">
              <h1 className="text-lg font-semibold">Rutas del tenant</h1>
              <p className="text-sm text-muted-foreground">
                Gestiona las rutas asociadas a {tenant.name} desde la biblioteca global.
              </p>
            </div>

            <DataTable
              columns={columns}
              data={tenantRoutes}
              filterColumn="name"
              filterPlaceholder="Buscar por nombre o autor..."
              toolbarAction={
                <Button onClick={() => setIsAddRouteChoiceOpen(true)}>
                  <Plus className="size-4" />
                  Añadir ruta
                </Button>
              }
            />
          </section>
        </main>

        <AddRouteChoiceDialog
          open={isAddRouteChoiceOpen}
          onOpenChange={setIsAddRouteChoiceOpen}
          onSelectFromLibrary={() => router.push(`/tenant/${tenant.slug}/routes/select`)}
          onCreateRoute={() => router.push(`/tenant/${tenant.slug}/routes/new`)}
        />
      </SidebarInset>
    </SidebarProvider>
  )
}
