"use client"

import Link from "next/link"
import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, PlusCircle } from "lucide-react"

import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { tenants } from "@/lib/mock-data"
import {
  ROUTE_DIFFICULTIES,
  ROUTE_REGIONS,
  ROUTE_SPORTS,
  type RouteDifficulty,
  type RouteRegion,
  type RouteSport,
} from "@/lib/routes-data"
import { createRouteAndAssign } from "@/lib/route-storage"
import { getCreatedTenantsFromStorage, mergeTenants } from "@/lib/tenant-storage"

type CreateRouteFormState = {
  name: string
  coverImageUrl: string
  region: RouteRegion
  sport: RouteSport
  difficulty: RouteDifficulty
  isCircular: boolean
  isFamilyFriendly: boolean
  distanceKm: string
  elevationGainM: string
  durationMin: string
  author: string
}

function buildInitialFormState(): CreateRouteFormState {
  return {
    name: "",
    coverImageUrl: "",
    region: ROUTE_REGIONS[0],
    sport: ROUTE_SPORTS[0],
    difficulty: ROUTE_DIFFICULTIES[0],
    isCircular: false,
    isFamilyFriendly: false,
    distanceKm: "",
    elevationGainM: "",
    durationMin: "",
    author: "",
  }
}

function isValidHttpUrl(value: string) {
  try {
    const parsed = new URL(value)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

export default function TenantCreateRoutePage() {
  const router = useRouter()
  const params = useParams<{ tenantSlug: string }>()
  const tenantSlug = params.tenantSlug

  const [createdTenants, setCreatedTenants] = React.useState(getCreatedTenantsFromStorage())
  const [formState, setFormState] = React.useState<CreateRouteFormState>(buildInitialFormState)
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    setCreatedTenants(getCreatedTenantsFromStorage())
  }, [])

  const allTenants = React.useMemo(
    () => mergeTenants(tenants, createdTenants),
    [createdTenants]
  )

  const tenant = allTenants.find((item) => item.slug === tenantSlug)

  function validateForm() {
    const name = formState.name.trim()
    const coverImageUrl = formState.coverImageUrl.trim()
    const author = formState.author.trim()

    if (!name) {
      return "El nombre de la ruta es obligatorio."
    }

    if (!coverImageUrl || !isValidHttpUrl(coverImageUrl)) {
      return "Introduce una URL válida de portada (http/https)."
    }

    if (!author) {
      return "El autor de la ruta es obligatorio."
    }

    const distanceKm = Number(formState.distanceKm)
    if (Number.isNaN(distanceKm) || distanceKm <= 0) {
      return "La distancia debe ser un número mayor que 0."
    }

    const elevationGainM = Number(formState.elevationGainM)
    if (Number.isNaN(elevationGainM) || elevationGainM < 0) {
      return "El desnivel debe ser un número igual o mayor que 0."
    }

    const durationMin = Number(formState.durationMin)
    if (Number.isNaN(durationMin) || durationMin <= 0) {
      return "La duración debe ser un número mayor que 0."
    }

    return null
  }

  async function handleCreateRoute(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isSubmitting || !tenant) {
      return
    }

    setSubmitError(null)
    const validationError = validateForm()

    if (validationError) {
      setSubmitError(validationError)
      return
    }

    setIsSubmitting(true)

    try {
      createRouteAndAssign(tenant.slug, {
        name: formState.name.trim(),
        coverImageUrl: formState.coverImageUrl.trim(),
        region: formState.region,
        sport: formState.sport,
        difficulty: formState.difficulty,
        isCircular: formState.isCircular,
        isFamilyFriendly: formState.isFamilyFriendly,
        distanceKm: Number(formState.distanceKm),
        elevationGainM: Number(formState.elevationGainM),
        durationMin: Number(formState.durationMin),
        author: formState.author.trim(),
      })

      router.push(`/tenant/${tenant.slug}/routes?created=1`)
    } catch {
      setSubmitError("No se ha podido crear la ruta. Inténtalo de nuevo.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!tenant) {
    return (
      <section className="m-6 rounded-xl border bg-card p-5">
        <h1 className="text-lg font-semibold">Tenant no encontrado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          El tenant que intentas abrir no existe en esta instancia.
        </p>
        <div className="mt-4 flex gap-2">
          <Button asChild>
            <Link href="/admin/tenants">Volver a admin tenants</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Ir al tenant por defecto</Link>
          </Button>
        </div>
      </section>
    )
  }

  return (
    <SidebarProvider defaultOpen>
      <AppSidebar tenantName={tenant.name} tenantSlug={tenant.slug} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border/40 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/admin/tenants">Admin panel</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbLink href={`/tenant/${tenant.slug}`}>{tenant.name}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={`/tenant/${tenant.slug}/routes`}>Rutas</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Nueva ruta</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <section className="rounded-xl border bg-card p-4 md:p-6">
            <div className="mb-4 flex items-center gap-2">
              <PlusCircle className="size-5" />
              <h1 className="text-lg font-semibold">Crear ruta</h1>
            </div>

            <form className="grid gap-3 md:grid-cols-2" onSubmit={handleCreateRoute}>
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="routeName" className="text-sm font-medium">
                  Nombre de la ruta
                </label>
                <Input
                  id="routeName"
                  value={formState.name}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="Ej: Circular románico Vall de Boí"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label htmlFor="routeCover" className="text-sm font-medium">
                  URL de portada
                </label>
                <Input
                  id="routeCover"
                  value={formState.coverImageUrl}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      coverImageUrl: event.target.value,
                    }))
                  }
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="routeRegion" className="text-sm font-medium">
                  Región
                </label>
                <select
                  id="routeRegion"
                  className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                  value={formState.region}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      region: event.target.value as RouteRegion,
                    }))
                  }
                >
                  {ROUTE_REGIONS.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="routeSport" className="text-sm font-medium">
                  Deporte
                </label>
                <select
                  id="routeSport"
                  className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                  value={formState.sport}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      sport: event.target.value as RouteSport,
                    }))
                  }
                >
                  {ROUTE_SPORTS.map((sport) => (
                    <option key={sport} value={sport}>
                      {sport}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="routeDifficulty" className="text-sm font-medium">
                  Dificultad
                </label>
                <select
                  id="routeDifficulty"
                  className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                  value={formState.difficulty}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      difficulty: event.target.value as RouteDifficulty,
                    }))
                  }
                >
                  {ROUTE_DIFFICULTIES.map((difficulty) => (
                    <option key={difficulty} value={difficulty}>
                      {difficulty}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="routeAuthor" className="text-sm font-medium">
                  Autor
                </label>
                <Input
                  id="routeAuthor"
                  value={formState.author}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, author: event.target.value }))
                  }
                  placeholder="Nombre del autor"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="routeDistance" className="text-sm font-medium">
                  Distancia (km)
                </label>
                <Input
                  id="routeDistance"
                  type="number"
                  min={0}
                  step={0.1}
                  value={formState.distanceKm}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, distanceKm: event.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="routeElevation" className="text-sm font-medium">
                  Desnivel (m)
                </label>
                <Input
                  id="routeElevation"
                  type="number"
                  min={0}
                  step={1}
                  value={formState.elevationGainM}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      elevationGainM: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="routeDuration" className="text-sm font-medium">
                  Duración (min)
                </label>
                <Input
                  id="routeDuration"
                  type="number"
                  min={1}
                  step={1}
                  value={formState.durationMin}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, durationMin: event.target.value }))
                  }
                />
              </div>

              <label className="flex items-center gap-2 rounded-md border p-3 text-sm md:col-span-1">
                <input
                  type="checkbox"
                  checked={formState.isCircular}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      isCircular: event.target.checked,
                    }))
                  }
                />
                Ruta circular
              </label>

              <label className="flex items-center gap-2 rounded-md border p-3 text-sm md:col-span-1">
                <input
                  type="checkbox"
                  checked={formState.isFamilyFriendly}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      isFamilyFriendly: event.target.checked,
                    }))
                  }
                />
                Ruta familiar
              </label>

              {submitError && <p className="text-sm text-destructive md:col-span-2">{submitError}</p>}

              <div className="mt-2 flex flex-wrap gap-2 md:col-span-2">
                <Button asChild variant="outline">
                  <Link href={`/tenant/${tenant.slug}/routes`}>
                    <ArrowLeft className="size-4" />
                    Volver a rutas
                  </Link>
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creando ruta..." : "Crear y añadir ruta"}
                </Button>
              </div>
            </form>
          </section>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
