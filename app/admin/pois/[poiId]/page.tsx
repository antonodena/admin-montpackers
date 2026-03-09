"use client"

import Link from "next/link"
import * as React from "react"
import { useParams } from "next/navigation"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { getPoiById } from "@/lib/poi-storage"

export default function PoiDetailPage() {
  const params = useParams<{ poiId: string }>()
  const poiId = params.poiId

  const [isReady, setIsReady] = React.useState(false)
  const [poiName, setPoiName] = React.useState("")
  const [poiData, setPoiData] = React.useState(() => getPoiById(poiId))

  React.useEffect(() => {
    const poi = getPoiById(poiId)
    setPoiData(poi)
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

  if (!poiData) {
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
    <section className="space-y-4">
      <article className="overflow-hidden rounded-xl border bg-card">
        <div className="h-48 w-full bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={poiData.coverImageUrl}
            alt={poiData.name}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="p-5">
          <h1 className="text-xl font-semibold">{poiName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {poiData.type} · {poiData.subtype}
          </p>
          <div className="mt-4 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
            <p>Tipo: {poiData.type}</p>
            <p>Subtipo: {poiData.subtype}</p>
            <p className="md:col-span-2">Id interno: {poiData.id}</p>
          </div>

          <Button asChild className="mt-5">
            <Link href={`/admin/pois/${poiData.id}/edit`}>
              Editar POI
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </article>
    </section>
  )
}
