"use client"

import Link from "next/link"
import * as React from "react"
import { useParams } from "next/navigation"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
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
    <section className="space-y-4">
      <article className="overflow-hidden rounded-xl border bg-card">
        <div className="h-48 w-full bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={routeData.coverImageUrl}
            alt={routeData.name}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="p-5">
          <h1 className="text-xl font-semibold">{routeData.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {routeData.routeCode} · {routeData.region} · {routeData.sport} · {routeData.difficulty}
          </p>
          {routeData.description && (
            <p className="mt-3 text-sm text-muted-foreground">{routeData.description}</p>
          )}
          <div className="mt-4 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
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
          </div>

          <Button asChild className="mt-5">
            <Link href={`/admin/routes/${routeData.id}/edit`}>
              Editar ruta
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </article>
    </section>
  )
}
