"use client"

import Link from "next/link"
import * as React from "react"
import { Plus } from "lucide-react"

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
import { Button } from "@/components/ui/button"
import type { RouteLibraryItem } from "@/lib/routes-data"
import { getAllRoutes } from "@/lib/route-storage"

export default function AdminRoutesPage() {
  const [routes, setRoutes] = React.useState<RouteLibraryItem[]>(() => getAllRoutes())
  const [routeToDelete, setRouteToDelete] = React.useState<RouteLibraryItem | null>(null)

  React.useEffect(() => {
    setRoutes(getAllRoutes())
  }, [])

  function handleDeleteRoute() {
    if (!routeToDelete) {
      return
    }

    setRoutes((current) => current.filter((route) => route.id !== routeToDelete.id))
    setRouteToDelete(null)
  }

  return (
    <section className="min-w-0 rounded-xl border bg-card p-4 md:p-6">
      <div className="mb-4">
        <h1 className="text-lg font-semibold">Biblioteca de rutas</h1>
        <p className="text-sm text-muted-foreground">
          Listado global de rutas con filtros avanzados para gestión editorial.
        </p>
      </div>

      <RouteLibraryTable
        routes={routes}
        mode="browse"
        onRequestDeleteRoute={setRouteToDelete}
        toolbarAction={
          <Button asChild>
            <Link href="/admin/routes/new">
              <Plus className="size-4" />
              Crear ruta
            </Link>
          </Button>
        }
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
    </section>
  )
}
