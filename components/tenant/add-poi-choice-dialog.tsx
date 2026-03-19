"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type AddPoiChoiceDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectFromLibrary: () => void
  onCreatePoi: () => void
}

export function AddPoiChoiceDialog({
  open,
  onOpenChange,
  onSelectFromLibrary,
  onCreatePoi,
}: AddPoiChoiceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Añadir POI</DialogTitle>
          <DialogDescription>
            Elige si quieres añadir POIs existentes desde la biblioteca o crear un POI nuevo.
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
              onCreatePoi()
            }}
          >
            Crear POI
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
