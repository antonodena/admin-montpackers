"use client"

import * as React from "react"

import { CreatePoiAction } from "@/components/pois/create-poi-action"
import { PoiLibraryTable } from "@/components/pois/poi-library-table"
import { PageSectionCard } from "@/components/shared/page-section-card"
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
    <PageSectionCard
      title="Biblioteca de POIs"
      description="Listado global de POIs con filtros avanzados para gestión editorial."
    >
      <PoiLibraryTable
        pois={pois}
        onRequestDeletePoi={setPoiToDelete}
        toolbarAction={<CreatePoiAction href="/admin/pois/new" />}
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
    </PageSectionCard>
  )
}
