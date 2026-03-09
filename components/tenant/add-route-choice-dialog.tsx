"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type AddRouteChoiceDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectFromLibrary: () => void
  onCreateRoute: () => void
}

export function AddRouteChoiceDialog({
  open,
  onOpenChange,
  onSelectFromLibrary,
  onCreateRoute,
}: AddRouteChoiceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Añadir ruta</DialogTitle>
          <DialogDescription>
            Elige si quieres añadir rutas existentes desde la biblioteca o crear una ruta nueva.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          <Button
            type="button"
            onClick={() => {
              onOpenChange(false)
              onSelectFromLibrary()
            }}
          >
            Seleccionar de la biblioteca
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false)
              onCreateRoute()
            }}
          >
            Crear ruta
          </Button>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
