"use client"

import Link from "next/link"
import * as React from "react"
import { useParams } from "next/navigation"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { PageMessageCard } from "@/components/shared/page-message-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
      <PageMessageCard description="Cargando POI..." />
    )
  }

  if (!poiData) {
    return (
      <PageMessageCard
        title="POI no encontrado"
        description={
          <>
            El POI con id <span className="font-medium text-foreground">{poiId}</span> no está
            disponible.
          </>
        }
        action={
          <Button asChild variant="outline">
            <Link href="/admin/pois">
              <ArrowLeft data-icon="inline-start" />
              Volver a biblioteca
            </Link>
          </Button>
        }
      />
    )
  }

  return (
    <Card className="overflow-hidden gap-0 py-0">
        <div className="h-48 w-full bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={poiData.coverImageUrl}
            alt={poiData.name}
            className="h-full w-full object-cover"
          />
        </div>
        <CardHeader className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <CardTitle className="text-xl">{poiName}</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{poiData.type}</Badge>
              <Badge variant="outline">{poiData.subtype}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
          <p>Tipo: {poiData.type}</p>
          <p>Subtipo: {poiData.subtype}</p>
          <p className="md:col-span-2">Id interno: {poiData.id}</p>
        </CardContent>
        <CardFooter>
          <Button asChild>
            <Link href={`/admin/pois/${poiData.id}/edit`}>
              Editar POI
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </CardFooter>
    </Card>
  )
}
