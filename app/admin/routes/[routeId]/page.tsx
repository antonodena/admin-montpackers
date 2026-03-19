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
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getRouteById } from "@/lib/route-storage"

function formatDuration(durationMin: number) {
  const hours = Math.floor(durationMin / 60)
  const minutes = durationMin % 60

  if (hours === 0) {
    return `${minutes} min`
  }

  if (minutes === 0) {
    return `${hours} h`
  }

  return `${hours} h ${minutes} min`
}

export default function RouteDetailPage() {
  const params = useParams<{ routeId: string }>()
  const routeId = params.routeId
  const routeData = React.useMemo(() => getRouteById(routeId), [routeId])

  if (!routeData) {
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
    <Card className="overflow-hidden gap-0 py-0">
        <div className="h-48 w-full bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={routeData.coverImageUrl}
            alt={routeData.name}
            className="h-full w-full object-cover"
          />
        </div>
        <CardHeader className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <CardTitle className="text-xl">{routeData.name}</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{routeData.routeCode}</Badge>
              <Badge variant="secondary">{routeData.region}</Badge>
              <Badge variant="secondary">{routeData.sport}</Badge>
              <Badge variant="secondary">{routeData.difficulty}</Badge>
            </div>
            {routeData.description ? (
              <CardDescription>{routeData.description}</CardDescription>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
          <p>Tenants relacionados: {routeData.tenantCount}</p>
          <p>Distancia: {routeData.distanceKm.toFixed(1)} km</p>
          <p>Desnivel: {routeData.elevationGainM} m</p>
          <p>Duración: {formatDuration(routeData.durationMin)}</p>
          <p>Circular: {routeData.isCircular ? "Sí" : "No"}</p>
          <p>Iniciación: {routeData.isBeginnerFriendly ? "Sí" : "No"}</p>
          <p>Familiar: {routeData.isFamilyFriendly ? "Sí" : "No"}</p>
          <p>Orientación: {routeData.orientation}</p>
          <p>Dirección: {routeData.direction}</p>
          <p>Autor: {routeData.author}</p>
        </CardContent>
        <CardFooter>
          <Button asChild>
            <Link href={`/admin/routes/${routeData.id}/edit`}>
              Editar ruta
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </CardFooter>
    </Card>
  )
}
