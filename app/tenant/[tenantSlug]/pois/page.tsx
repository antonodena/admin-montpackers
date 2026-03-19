"use client"

import Link from "next/link"
import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import { Eye, MoreHorizontal, Plus } from "lucide-react"

import { ColumnHeader } from "@/components/admin/column-header"
import { DataTable } from "@/components/admin/data-table"
import { AppSidebar } from "@/components/app-sidebar"
import { AddPoiChoiceDialog } from "@/components/tenant/add-poi-choice-dialog"
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
import { useResolvedTenant } from "@/hooks/use-resolved-tenant"
import type { PoiLibraryItem } from "@/lib/poi-storage"
import { getTenantPois } from "@/lib/poi-storage"

function buildColumns(): ColumnDef<PoiLibraryItem>[] {
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
          row.original.type.toLowerCase().includes(query) ||
          row.original.subtype.toLowerCase().includes(query)
        )
      },
    },
    {
      accessorKey: "type",
      header: ({ column }) => <ColumnHeader column={column} title="Tipo" />,
    },
    {
      accessorKey: "subtype",
      header: ({ column }) => <ColumnHeader column={column} title="Subtipo" />,
      cell: ({ row }) => (
        <span className="block max-w-[240px] truncate text-muted-foreground">
          {row.original.subtype}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Acciones",
      enableSorting: false,
      enableColumnFilter: false,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm">
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/admin/pois/${row.original.id}`}>
                <Eye className="size-4" />
                Ver POI
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]
}

export default function TenantPoisPage() {
  const router = useRouter()
  const params = useParams<{ tenantSlug: string }>()
  const tenantSlug = params.tenantSlug

  const tenant = useResolvedTenant(tenantSlug)
  const [tenantPois] = React.useState<PoiLibraryItem[]>(() =>
    tenantSlug ? getTenantPois(tenantSlug) : []
  )
  const [isAddPoiChoiceOpen, setIsAddPoiChoiceOpen] = React.useState(false)

  const columns = React.useMemo(() => buildColumns(), [])

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
                <BreadcrumbPage>Puntos de interés</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <PageSectionCard
            title="POIs del tenant"
            description={`Gestiona los puntos de interés asociados a ${tenant.name} desde la biblioteca global.`}
          >
            <DataTable
              columns={columns}
              data={tenantPois}
              filterColumn="name"
              filterPlaceholder="Buscar por nombre, tipo o subtipo..."
              toolbarAction={
                <Button onClick={() => setIsAddPoiChoiceOpen(true)}>
                  <Plus data-icon="inline-start" />
                  Añadir POI
                </Button>
              }
            />
          </PageSectionCard>
        </main>

        <AddPoiChoiceDialog
          open={isAddPoiChoiceOpen}
          onOpenChange={setIsAddPoiChoiceOpen}
          onSelectFromLibrary={() => router.push(`/tenant/${tenant.slug}/pois/select`)}
          onCreatePoi={() => router.push(`/tenant/${tenant.slug}/pois/new`)}
        />
      </SidebarInset>
    </SidebarProvider>
  )
}
