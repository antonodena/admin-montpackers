"use client"

import Link from "next/link"
import * as React from "react"
import { useParams } from "next/navigation"
import { ArrowLeft, Pencil } from "lucide-react"

import { Button } from "@/components/ui/button"
import { getRouteById } from "@/lib/route-storage"

export default function EditRoutePage() {
  const params = useParams<{ routeId: string }>()
  const routeId = params.routeId
  const routeName = React.useMemo(() => getRouteById(routeId)?.name ?? "", [routeId])

  if (!routeName) {
    return (
      <section className="rounded-xl border bg-card p-5">
        <h1 className="text-lg font-semibold">Ruta no encontrada</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          La ruta con id <span className="font-medium text-foreground">{routeId}</span> no está
          disponible.
        </p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/admin/routes">
            <ArrowLeft className="size-4" />
            Volver a biblioteca
          </Link>
        </Button>
      </section>
    )
  }

  return (
    <section className="rounded-xl border bg-card p-5">
      <div className="mb-2 flex items-center gap-2">
        <Pencil className="size-5" />
        <h1 className="text-lg font-semibold">Editar ruta</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Edición de <span className="font-medium text-foreground">{routeName}</span> pendiente de
        siguiente iteración.
      </p>
    </section>
  )
}
