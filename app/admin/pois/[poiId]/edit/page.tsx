"use client"

import Link from "next/link"
import * as React from "react"
import { useParams } from "next/navigation"
import { ArrowLeft, Pencil } from "lucide-react"

import { Button } from "@/components/ui/button"
import { getPoiById } from "@/lib/poi-storage"

export default function EditPoiPage() {
  const params = useParams<{ poiId: string }>()
  const poiId = params.poiId

  const [isReady, setIsReady] = React.useState(false)
  const [poiName, setPoiName] = React.useState("")

  React.useEffect(() => {
    const poi = getPoiById(poiId)
    setPoiName(poi?.name ?? "")
    setIsReady(true)
  }, [poiId])

  if (!isReady) {
    return (
      <section className="rounded-xl border bg-card p-5">
        <p className="text-sm text-muted-foreground">Cargando POI...</p>
      </section>
    )
  }

  if (!poiName) {
    return (
      <section className="rounded-xl border bg-card p-5">
        <h1 className="text-lg font-semibold">POI no encontrado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          El POI con id <span className="font-medium text-foreground">{poiId}</span> no está
          disponible.
        </p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/admin/pois">
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
        <h1 className="text-lg font-semibold">Editar POI</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Edición de <span className="font-medium text-foreground">{poiName}</span> pendiente de
        siguiente iteración.
      </p>
    </section>
  )
}
