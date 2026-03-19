"use client"

import Link from "next/link"
import * as React from "react"
import { useParams } from "next/navigation"
import { ArrowLeft, Pencil } from "lucide-react"

import { PageMessageCard } from "@/components/shared/page-message-card"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
      <PageMessageCard description="Cargando POI..." />
    )
  }

  if (!poiName) {
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
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Pencil className="size-5 text-muted-foreground" />
          <CardTitle>Editar POI</CardTitle>
        </div>
        <CardDescription>
          Edición de <span className="font-medium text-foreground">{poiName}</span> pendiente de
          siguiente iteración.
        </CardDescription>
      </CardHeader>
    </Card>
  )
}
