"use client"

import Link from "next/link"
import * as React from "react"
import { useParams } from "next/navigation"
import { ArrowLeft, Pencil } from "lucide-react"

import { PageMessageCard } from "@/components/shared/page-message-card"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getRouteById } from "@/lib/route-storage"

export default function EditRoutePage() {
  const params = useParams<{ routeId: string }>()
  const routeId = params.routeId
  const routeName = React.useMemo(() => getRouteById(routeId)?.name ?? "", [routeId])

  if (!routeName) {
    return (
      <PageMessageCard
        title="Ruta no encontrada"
        description={
          <>
            La ruta con id <span className="font-medium text-foreground">{routeId}</span> no está
            disponible.
          </>
        }
        action={
          <Button asChild variant="outline">
            <Link href="/admin/routes">
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
          <CardTitle>Editar ruta</CardTitle>
        </div>
        <CardDescription>
          Edición de <span className="font-medium text-foreground">{routeName}</span> pendiente de
          siguiente iteración.
        </CardDescription>
      </CardHeader>
    </Card>
  )
}
