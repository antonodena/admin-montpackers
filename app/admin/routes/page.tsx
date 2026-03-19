"use client"

import * as React from "react"

import { CreateRouteAction } from "@/components/routes/create-route-action"
import { PageSectionCard } from "@/components/shared/page-section-card"
import { RouteLibraryTable } from "@/components/routes/route-library-table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { RouteLibraryItem } from "@/lib/routes-data"
import { getAllRoutes } from "@/lib/route-storage"

export default function AdminRoutesPage() {
  const [routes, setRoutes] = React.useState<RouteLibraryItem[]>(() => getAllRoutes())
  const [routeToDelete, setRouteToDelete] = React.useState<RouteLibraryItem | null>(null)

  function handleDeleteRoute() {
    if (!routeToDelete) {
      return
    }

    setRoutes((current) => current.filter((route) => route.id !== routeToDelete.id))
    setRouteToDelete(null)
  }

  return (
    <PageSectionCard
      title="Biblioteca de rutas"
      description="Listado global de rutas con filtros avanzados para gestión editorial."
    >
      <RouteLibraryTable
        routes={routes}
        mode="browse"
        onRequestDeleteRoute={setRouteToDelete}
        toolbarAction={<CreateRouteAction href="/admin/routes/new" />}
      />

      <AlertDialog
        open={Boolean(routeToDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setRouteToDelete(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar ruta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará <span className="font-medium">{routeToDelete?.name}</span> del
              listado actual.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDeleteRoute}>
              Eliminar ruta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageSectionCard>
  )
}
