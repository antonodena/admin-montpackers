"use client"

import Link from "next/link"
import * as React from "react"
import { Plus } from "lucide-react"

import { PoiLibraryTable } from "@/components/pois/poi-library-table"
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
import type { PoiLibraryItem } from "@/lib/poi-storage"
import { getAllPois } from "@/lib/poi-storage"

export default function AdminPoisPage() {
  const [pois, setPois] = React.useState<PoiLibraryItem[]>(() => getAllPois())
  const [poiToDelete, setPoiToDelete] = React.useState<PoiLibraryItem | null>(null)

  React.useEffect(() => {
    setPois(getAllPois())
  }, [])

  function handleDeletePoi() {
    if (!poiToDelete) {
      return
    }

    setPois((current) => current.filter((poi) => poi.id !== poiToDelete.id))
    setPoiToDelete(null)
  }

  return (
    <section className="rounded-xl border bg-card p-4 md:p-6">
      <div className="mb-4">
        <h1 className="text-lg font-semibold">Biblioteca de POIs</h1>
        <p className="text-sm text-muted-foreground">
          Listado global de POIs con filtros avanzados para gestión editorial.
        </p>
      </div>

      <PoiLibraryTable
        pois={pois}
        onRequestDeletePoi={setPoiToDelete}
        toolbarAction={
          <Button asChild>
            <Link href="/admin/pois/new">
              <Plus className="size-4" />
              Crear POI
            </Link>
          </Button>
        }
      />

      <AlertDialog
        open={Boolean(poiToDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setPoiToDelete(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar POI?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará <span className="font-medium">{poiToDelete?.name}</span> del
              listado actual.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDeletePoi}>
              Eliminar POI
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
