"use client"

import Link from "next/link"
import * as React from "react"
import { ArrowLeft, ImagePlus, Loader2, Trash2, Upload } from "lucide-react"

import type { Tenant } from "@/lib/mock-data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  ROUTE_ASSET_TYPES,
  ROUTE_DIFFICULTIES,
  ROUTE_DIRECTIONS,
  ROUTE_ORIENTATIONS,
  ROUTE_REGIONS,
  ROUTE_SPORTS,
  type RouteAsset,
  type RouteAssetType,
  type RouteDifficulty,
  type RouteDirection,
  type RouteGpxFile,
  type RouteGpxMetrics,
  type RouteLibraryItem,
  type RouteOrientation,
  type RouteRegion,
  type RouteSport,
} from "@/lib/routes-data"
import {
  assignRoutesToTenant,
  createRoute,
  getNextAvailableRouteCode,
  isRouteCodeAvailable,
  isRouteCodeValid,
} from "@/lib/route-storage"
import {
  createImageAssetId,
  getFileExtension,
  getImagePayloadSize,
  IMAGE_UPLOAD_ACCEPT,
  MAX_IMAGE_UPLOAD_BYTES,
  MAX_IMAGE_UPLOAD_COUNT,
  optimizeImageFile,
  validateImageFile,
} from "@/lib/image-upload"
import { cn } from "@/lib/utils"

const GLOBAL_TENANT_VALUE = "__global__"
const MAX_ROUTE_NAME_LENGTH = 37
const MAX_ROUTE_IMAGES = MAX_IMAGE_UPLOAD_COUNT
const MAX_ROUTE_IMAGE_BYTES = MAX_IMAGE_UPLOAD_BYTES
const ROUTE_IMAGE_ACCEPT = IMAGE_UPLOAD_ACCEPT
const ROUTE_GPX_ACCEPT = ".gpx,application/gpx+xml,application/xml,text/xml"
const ALLOWED_GPX_EXTENSIONS = new Set(["gpx"])
const ALLOWED_GPX_MIME_TYPES = new Set([
  "",
  "application/gpx+xml",
  "application/xml",
  "text/xml",
  "application/octet-stream",
])

type RouteFormMode = "admin" | "tenant"

type RouteFormProps = {
  mode: RouteFormMode
  cancelHref: string
  tenant?: Tenant
  tenants?: Tenant[]
  onCreated: (route: RouteLibraryItem, assignedTenantSlug?: string) => void
}

type RouteFormState = {
  name: string
  description: string
  routeCode: string
  difficulty: RouteDifficulty
  sport: RouteSport
  distanceKm: string
  duration: string
  elevationGainM: string
  isCircular: boolean
  isBeginnerFriendly: boolean
  isFamilyFriendly: boolean
  orientation: RouteOrientation
  direction: RouteDirection
  region: RouteRegion
  assets: RouteAsset[]
  gpxFile: RouteGpxFile | null
  gpxMetrics: RouteGpxMetrics | null
}

type RouteFormErrors = Partial<
  Record<
    "name" | "routeCode" | "distanceKm" | "duration" | "elevationGainM" | "assets" | "gpx",
    string
  >
>

type GpxPoint = {
  lat: number
  lon: number
  ele: number | null
  timeMs: number | null
}

function buildInitialState(): RouteFormState {
  return {
    name: "",
    description: "",
    routeCode: "",
    difficulty: ROUTE_DIFFICULTIES[0],
    sport: ROUTE_SPORTS[0],
    distanceKm: "",
    duration: "",
    elevationGainM: "",
    isCircular: false,
    isBeginnerFriendly: false,
    isFamilyFriendly: false,
    orientation: ROUTE_ORIENTATIONS[0],
    direction: ROUTE_DIRECTIONS[0],
    region: ROUTE_REGIONS[0],
    assets: [],
    gpxFile: null,
    gpxMetrics: null,
  }
}

function fileToText(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ""))
    reader.onerror = () => reject(new Error("No se ha podido leer el archivo GPX"))
    reader.readAsText(file)
  })
}

function parseDurationToMinutes(value: string) {
  const match = value.trim().match(/^(\d{1,3}):([0-5]\d)$/)

  if (!match) {
    return null
  }

  return Number(match[1]) * 60 + Number(match[2])
}

function formatDurationFromMinutes(value: number) {
  const totalMinutes = Math.max(0, Math.round(value))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
}

function formatDistanceForInput(value: number) {
  return Number(value.toFixed(2)).toString()
}

function formatFileSize(sizeBytes: number) {
  if (sizeBytes >= 1024 * 1024) {
    return `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`
  }

  if (sizeBytes >= 1024) {
    return `${Math.round(sizeBytes / 1024)} KB`
  }

  return `${sizeBytes} B`
}

function formatMetricDistance(value: number | null) {
  if (value === null) {
    return "No disponible"
  }

  return `${Number(value.toFixed(2))} km`
}

function formatMetricElevation(value: number | null) {
  if (value === null) {
    return "No disponible"
  }

  return `${Math.round(value)} m`
}

function formatMetricDuration(value: number | null) {
  if (value === null) {
    return "No disponible"
  }

  return formatDurationFromMinutes(value)
}

function getAuthorName(mode: RouteFormMode, tenant: Tenant | undefined, selectedTenant?: Tenant) {
  if (mode === "tenant") {
    return tenant?.name ?? "Montpackers"
  }

  return selectedTenant?.name ?? "Montpackers"
}

function haversineDistanceMeters(from: Pick<GpxPoint, "lat" | "lon">, to: Pick<GpxPoint, "lat" | "lon">) {
  const earthRadiusMeters = 6371000
  const toRadians = (value: number) => (value * Math.PI) / 180
  const deltaLat = toRadians(to.lat - from.lat)
  const deltaLon = toRadians(to.lon - from.lon)
  const fromLat = toRadians(from.lat)
  const toLat = toRadians(to.lat)

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(fromLat) *
      Math.cos(toLat) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return earthRadiusMeters * c
}

function getElementsByLocalName(parent: Document | Element, localName: string) {
  return Array.from(parent.getElementsByTagNameNS("*", localName))
}

function getFirstChildText(parent: Element, localName: string) {
  const element = getElementsByLocalName(parent, localName)[0]
  return element?.textContent?.trim() ?? null
}

function parseGpxPoint(element: Element) {
  const lat = Number(element.getAttribute("lat"))
  const lon = Number(element.getAttribute("lon"))

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return null
  }

  const elevationValue = getFirstChildText(element, "ele")
  const timeValue = getFirstChildText(element, "time")
  const elevation = elevationValue === null ? null : Number(elevationValue)
  const timeMs = timeValue === null ? null : Date.parse(timeValue)

  return {
    lat,
    lon,
    ele: Number.isFinite(elevation) ? elevation : null,
    timeMs: Number.isFinite(timeMs) ? timeMs : null,
  } satisfies GpxPoint
}

function parseGpxMetrics(content: string): RouteGpxMetrics {
  const parser = new DOMParser()
  const xmlDocument = parser.parseFromString(content, "application/xml")

  if (xmlDocument.getElementsByTagName("parsererror").length > 0) {
    throw new Error("El archivo GPX no contiene un XML válido.")
  }

  const root = xmlDocument.documentElement

  if (!root || root.localName.toLowerCase() !== "gpx") {
    throw new Error("El archivo debe tener una raíz <gpx> válida.")
  }

  const trackSegments = getElementsByLocalName(root, "trkseg")
    .map((segment) =>
      getElementsByLocalName(segment, "trkpt")
        .map(parseGpxPoint)
        .filter((point): point is GpxPoint => point !== null)
    )
    .filter((segment) => segment.length > 0)

  const routePoints = getElementsByLocalName(root, "rtept")
    .map(parseGpxPoint)
    .filter((point): point is GpxPoint => point !== null)

  const segments =
    trackSegments.length > 0
      ? trackSegments
      : routePoints.length > 0
        ? [routePoints]
        : []

  if (!segments.some((segment) => segment.length > 1)) {
    throw new Error("El GPX no contiene suficientes puntos utilizables.")
  }

  let distanceMeters = 0
  let elevationGainM = 0

  for (const segment of segments) {
    for (let index = 1; index < segment.length; index += 1) {
      const previous = segment[index - 1]
      const current = segment[index]

      distanceMeters += haversineDistanceMeters(previous, current)

      if (previous.ele !== null && current.ele !== null && current.ele > previous.ele) {
        elevationGainM += current.ele - previous.ele
      }
    }
  }

  const timedPoints = segments
    .flat()
    .filter((point) => point.timeMs !== null)

  const durationMin =
    timedPoints.length >= 2
      ? Math.max(0, Math.round(((timedPoints.at(-1)?.timeMs ?? 0) - timedPoints[0].timeMs!) / 60000))
      : null

  return {
    distanceKm: Number.isFinite(distanceMeters)
      ? Number((distanceMeters / 1000).toFixed(2))
      : null,
    elevationGainM: Number.isFinite(elevationGainM) ? Math.round(elevationGainM) : null,
    durationMin,
  }
}

async function parseGpxUpload(file: File) {
  const extension = getFileExtension(file.name)
  const mimeType = file.type.trim().toLowerCase()

  if (!ALLOWED_GPX_EXTENSIONS.has(extension) || !ALLOWED_GPX_MIME_TYPES.has(mimeType)) {
    throw new Error("El archivo GPX debe tener extensión .gpx y un MIME XML válido.")
  }

  const content = await fileToText(file)
  const gpxMetrics = parseGpxMetrics(content)

  return {
    gpxFile: {
      fileName: file.name,
      mimeType: mimeType || "application/gpx+xml",
      sizeBytes: file.size,
      content,
    } satisfies RouteGpxFile,
    gpxMetrics,
  }
}

function buildRouteErrors(state: RouteFormState): RouteFormErrors {
  const errors: RouteFormErrors = {}
  const name = state.name.trim()
  const routeCode = state.routeCode.trim().toUpperCase()
  const distanceKm = Number(state.distanceKm)
  const elevationGainM = Number(state.elevationGainM)
  const durationMin = parseDurationToMinutes(state.duration)

  if (!name) {
    errors.name = "El nombre de la ruta es obligatorio."
  } else if (name.length > MAX_ROUTE_NAME_LENGTH) {
    errors.name = `El nombre no puede superar ${MAX_ROUTE_NAME_LENGTH} caracteres.`
  }

  if (!routeCode) {
    errors.routeCode = "El código único de la ruta es obligatorio."
  } else if (!isRouteCodeValid(routeCode)) {
    errors.routeCode = "Usa el formato MONT seguido de al menos dos dígitos."
  } else if (!isRouteCodeAvailable(routeCode)) {
    errors.routeCode = "Este código ya existe."
  }

  if (!state.gpxFile) {
    errors.gpx = "Añade un archivo GPX válido para crear la ruta."
  }

  if (Number.isNaN(distanceKm) || distanceKm <= 0) {
    errors.distanceKm = "La distancia debe ser un número mayor que 0."
  }

  if (durationMin === null || durationMin <= 0) {
    errors.duration = "La duración debe tener formato hh:mm."
  }

  if (!Number.isInteger(elevationGainM) || elevationGainM < 0) {
    errors.elevationGainM = "El desnivel debe ser un entero igual o mayor que 0."
  }

  if (state.assets.length === 0) {
    errors.assets = "Añade al menos una imagen para crear la ruta."
  } else if (getImagePayloadSize(state.assets) > MAX_ROUTE_IMAGE_BYTES) {
    errors.assets = "Las imágenes superan el límite total de 4MB."
  }

  return errors
}

export function RouteForm({
  mode,
  cancelHref,
  tenant,
  tenants = [],
  onCreated,
}: RouteFormProps) {
  const imageInputRef = React.useRef<HTMLInputElement>(null)
  const gpxInputRef = React.useRef<HTMLInputElement>(null)
  const imageDragCounterRef = React.useRef(0)
  const gpxDragCounterRef = React.useRef(0)

  const [formState, setFormState] = React.useState<RouteFormState>(buildInitialState)
  const [errors, setErrors] = React.useState<RouteFormErrors>({})
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isImageDragActive, setIsImageDragActive] = React.useState(false)
  const [isGpxDragActive, setIsGpxDragActive] = React.useState(false)
  const [selectedTenantSlug, setSelectedTenantSlug] = React.useState(
    mode === "tenant" ? tenant?.slug ?? "" : GLOBAL_TENANT_VALUE
  )

  const selectedTenant = tenants.find((item) => item.slug === selectedTenantSlug)
  const authorName = getAuthorName(mode, tenant, selectedTenant)
  const assignedTenantSlug = mode === "tenant" ? tenant?.slug : selectedTenant?.slug

  React.useEffect(() => {
    setFormState((current) => {
      if (current.routeCode) {
        return current
      }

      return {
        ...current,
        routeCode: getNextAvailableRouteCode(),
      }
    })
  }, [])

  const handleImageSelection = React.useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) {
        return
      }

      setSubmitError(null)
      setErrors((current) => ({ ...current, assets: undefined }))

      const incomingFiles = Array.from(files)

      if (formState.assets.length + incomingFiles.length > MAX_ROUTE_IMAGES) {
        setErrors((current) => ({
          ...current,
          assets: `Solo se permiten ${MAX_ROUTE_IMAGES} imágenes por ruta.`,
        }))
        return
      }

      try {
        const nextAssets: RouteAsset[] = []

        for (const file of incomingFiles) {
          const validationError = validateImageFile(file)
          if (validationError) {
            throw new Error(validationError)
          }

          const optimized = await optimizeImageFile(file)
          nextAssets.push({
            id: createImageAssetId("route-asset"),
            dataUrl: optimized.dataUrl,
            fileName: file.name,
            mimeType: optimized.mimeType,
            kind: "vista",
          })
        }

        const mergedAssets = [...formState.assets, ...nextAssets]

        if (getImagePayloadSize(mergedAssets) > MAX_ROUTE_IMAGE_BYTES) {
          throw new Error("Las imágenes superan el límite total de 4MB.")
        }

        React.startTransition(() => {
          setFormState((current) => ({
            ...current,
            assets: [...current.assets, ...nextAssets],
          }))
        })
      } catch (error) {
        setErrors((current) => ({
          ...current,
          assets:
            error instanceof Error ? error.message : "No se han podido cargar las imágenes.",
        }))
      }
    },
    [formState.assets]
  )

  const handleGpxSelection = React.useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) {
      return
    }

    const nextFile = files[0]

    setSubmitError(null)
    setErrors((current) => ({ ...current, gpx: undefined }))

    try {
      const { gpxFile, gpxMetrics } = await parseGpxUpload(nextFile)

      React.startTransition(() => {
        setFormState((current) => ({
          ...current,
          gpxFile,
          gpxMetrics,
          distanceKm:
            gpxMetrics.distanceKm !== null
              ? formatDistanceForInput(gpxMetrics.distanceKm)
              : current.distanceKm,
          elevationGainM:
            gpxMetrics.elevationGainM !== null
              ? String(Math.round(gpxMetrics.elevationGainM))
              : current.elevationGainM,
          duration:
            gpxMetrics.durationMin !== null
              ? formatDurationFromMinutes(gpxMetrics.durationMin)
              : current.duration,
        }))
        setErrors((current) => ({
          ...current,
          gpx: undefined,
          distanceKm: gpxMetrics.distanceKm !== null ? undefined : current.distanceKm,
          elevationGainM: gpxMetrics.elevationGainM !== null ? undefined : current.elevationGainM,
          duration: gpxMetrics.durationMin !== null ? undefined : current.duration,
        }))
      })
    } catch (error) {
      setErrors((current) => ({
        ...current,
        gpx:
          error instanceof Error ? error.message : "No se ha podido cargar el archivo GPX.",
      }))
    }
  }, [])

  function updateAsset(assetId: string, kind: RouteAssetType) {
    setFormState((current) => ({
      ...current,
      assets: current.assets.map((asset) =>
        asset.id === assetId ? { ...asset, kind } : asset
      ),
    }))
  }

  function removeAsset(assetId: string) {
    setFormState((current) => ({
      ...current,
      assets: current.assets.filter((asset) => asset.id !== assetId),
    }))
  }

  function removeGpxFile() {
    setFormState((current) => ({
      ...current,
      gpxFile: null,
      gpxMetrics: null,
    }))
    setErrors((current) => ({
      ...current,
      gpx: "Añade un archivo GPX válido para crear la ruta.",
    }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    const nextErrors = buildRouteErrors(formState)

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      setSubmitError("Revisa los campos marcados antes de guardar.")
      return
    }

    const durationMin = parseDurationToMinutes(formState.duration)

    if (durationMin === null) {
      setErrors((current) => ({
        ...current,
        duration: "La duración debe tener formato hh:mm.",
      }))
      setSubmitError("Revisa los campos marcados antes de guardar.")
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const route = createRoute({
        routeCode: formState.routeCode.trim().toUpperCase(),
        name: formState.name.trim(),
        description: formState.description.trim(),
        difficulty: formState.difficulty,
        sport: formState.sport,
        distanceKm: Number(formState.distanceKm),
        durationMin,
        elevationGainM: Number(formState.elevationGainM),
        isCircular: formState.isCircular,
        isBeginnerFriendly: formState.isBeginnerFriendly,
        isFamilyFriendly: formState.isFamilyFriendly,
        orientation: formState.orientation,
        direction: formState.direction,
        region: formState.region,
        author: authorName,
        assets: formState.assets,
        gpxFile: formState.gpxFile,
        gpxMetrics: formState.gpxMetrics,
      })

      if (assignedTenantSlug) {
        assignRoutesToTenant(assignedTenantSlug, [route.id])
      }

      onCreated(route, assignedTenantSlug)
    } catch {
      setSubmitError("No se ha podido crear la ruta. Inténtalo de nuevo.")
      setIsSubmitting(false)
      return
    }

    setIsSubmitting(false)
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Datos básicos</CardTitle>
          <CardDescription>
            Define el contexto editorial y la información principal de la ruta.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <FieldGroup>
            {mode === "admin" && (
              <Field>
                <FieldLabel htmlFor="routeTenant">Tenant</FieldLabel>
                <FieldContent>
                  <Select value={selectedTenantSlug} onValueChange={setSelectedTenantSlug}>
                    <SelectTrigger id="routeTenant" className="w-full">
                      <SelectValue placeholder="Selecciona un tenant" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value={GLOBAL_TENANT_VALUE}>
                          Biblioteca global (Montpackers)
                        </SelectItem>
                        {tenants.map((item) => (
                          <SelectItem key={item.slug} value={item.slug}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    Si no seleccionas un tenant, la ruta quedará en la biblioteca global.
                  </FieldDescription>
                </FieldContent>
              </Field>
            )}

            <Field data-invalid={Boolean(errors.name)}>
              <FieldLabel htmlFor="routeName">Nombre</FieldLabel>
              <FieldContent>
                <Input
                  id="routeName"
                  value={formState.name}
                  maxLength={MAX_ROUTE_NAME_LENGTH}
                  aria-invalid={Boolean(errors.name)}
                  onChange={(event) => {
                    const nextName = event.target.value.slice(0, MAX_ROUTE_NAME_LENGTH)
                    setFormState((current) => ({ ...current, name: nextName }))
                    setErrors((current) => ({ ...current, name: undefined }))
                  }}
                  placeholder="Ej: Circular lagos de Tristaina"
                />
                <div className="text-right text-xs text-muted-foreground">
                  {formState.name.length}/{MAX_ROUTE_NAME_LENGTH}
                </div>
                <FieldError>{errors.name}</FieldError>
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="routeDescription">Descripción de la ruta</FieldLabel>
              <FieldContent>
                <Textarea
                  id="routeDescription"
                  value={formState.description}
                  className="min-h-28"
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Resumen editorial de la ruta..."
                />
              </FieldContent>
            </Field>

            <div className="grid gap-6 lg:grid-cols-2">
              <Field data-invalid={Boolean(errors.routeCode)}>
                <FieldLabel htmlFor="routeCode">Código único de la ruta</FieldLabel>
                <FieldContent>
                  <Input
                    id="routeCode"
                    value={formState.routeCode}
                    aria-invalid={Boolean(errors.routeCode)}
                    onChange={(event) => {
                      const nextValue = event.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9]/g, "")
                      setFormState((current) => ({
                        ...current,
                        routeCode: nextValue,
                      }))
                      setErrors((current) => ({ ...current, routeCode: undefined }))
                    }}
                    placeholder="MONT00"
                  />
                  <FieldDescription>
                    Usa `MONT` seguido de al menos dos dígitos.
                  </FieldDescription>
                  <FieldError>{errors.routeCode}</FieldError>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="routeAuthor">Autor</FieldLabel>
                <FieldContent>
                  <Input id="routeAuthor" value={authorName} readOnly />
                  <FieldDescription>
                    Se deriva automáticamente del contexto de creación.
                  </FieldDescription>
                </FieldContent>
              </Field>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Archivo GPX</CardTitle>
          <CardDescription>
            Sube el track GPX para asociarlo a la ruta y autocompletar métricas.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <input
            ref={gpxInputRef}
            id="routeGpx"
            type="file"
            accept={ROUTE_GPX_ACCEPT}
            className="hidden"
            onChange={(event) => {
              void handleGpxSelection(event.target.files)
              event.target.value = ""
            }}
          />

          <Field data-invalid={Boolean(errors.gpx)}>
            <FieldLabel htmlFor="routeGpx">Archivo GPX</FieldLabel>
            <FieldContent>
              <div
                className={cn(
                  "rounded-xl border border-dashed transition-colors",
                  isGpxDragActive
                    ? "border-primary bg-primary/5"
                    : "border-border/70 bg-muted/20"
                )}
                onDragEnter={(event) => {
                  event.preventDefault()
                  gpxDragCounterRef.current += 1
                  setIsGpxDragActive(true)
                }}
                onDragOver={(event) => {
                  event.preventDefault()
                  event.dataTransfer.dropEffect = "copy"
                }}
                onDragLeave={(event) => {
                  event.preventDefault()
                  gpxDragCounterRef.current = Math.max(0, gpxDragCounterRef.current - 1)

                  if (gpxDragCounterRef.current === 0) {
                    setIsGpxDragActive(false)
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault()
                  gpxDragCounterRef.current = 0
                  setIsGpxDragActive(false)
                  void handleGpxSelection(event.dataTransfer.files)
                }}
              >
                <div
                  role="button"
                  tabIndex={0}
                  className="flex w-full flex-col items-center justify-center gap-3 p-8 text-center"
                  onClick={() => gpxInputRef.current?.click()}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      gpxInputRef.current?.click()
                    }
                  }}
                >
                  <Upload className="size-5 text-muted-foreground" />
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">
                      {formState.gpxFile
                        ? "Arrastra un GPX para reemplazar el actual"
                        : "Arrastra un GPX aquí o selecciónalo manualmente"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Solo archivos `.gpx`. El fichero es obligatorio para crear la ruta.
                    </p>
                  </div>
                  <Button type="button" variant="outline">
                    <Upload data-icon="inline-start" />
                    {formState.gpxFile ? "Reemplazar GPX" : "Seleccionar GPX"}
                  </Button>
                </div>
              </div>
              <FieldDescription>
                Si el GPX incluye track, elevación y tiempo, rellenaremos distancia, desnivel y
                duración automáticamente.
              </FieldDescription>
              <FieldError>{errors.gpx}</FieldError>
            </FieldContent>
          </Field>

          {formState.gpxFile && (
            <div className="rounded-xl border bg-muted/20 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">{formState.gpxFile.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(formState.gpxFile.sizeBytes)} · {formState.gpxFile.mimeType}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={() => gpxInputRef.current?.click()}>
                    <Upload data-icon="inline-start" />
                    Reemplazar
                  </Button>
                  <Button type="button" variant="ghost" onClick={removeGpxFile}>
                    <Trash2 data-icon="inline-start" />
                    Eliminar
                  </Button>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border bg-background p-3">
                  <p className="text-xs text-muted-foreground">Distancia detectada</p>
                  <p className="text-sm font-medium">
                    {formatMetricDistance(formState.gpxMetrics?.distanceKm ?? null)}
                  </p>
                </div>
                <div className="rounded-lg border bg-background p-3">
                  <p className="text-xs text-muted-foreground">Desnivel positivo detectado</p>
                  <p className="text-sm font-medium">
                    {formatMetricElevation(formState.gpxMetrics?.elevationGainM ?? null)}
                  </p>
                </div>
                <div className="rounded-lg border bg-background p-3">
                  <p className="text-xs text-muted-foreground">Duración detectada</p>
                  <p className="text-sm font-medium">
                    {formatMetricDuration(formState.gpxMetrics?.durationMin ?? null)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Imágenes</CardTitle>
          <CardDescription>
            Arrastra imágenes o súbelas manualmente y clasifícalas por tipo.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <input
            ref={imageInputRef}
            type="file"
            accept={ROUTE_IMAGE_ACCEPT}
            multiple
            className="hidden"
            onChange={(event) => {
              void handleImageSelection(event.target.files)
              event.target.value = ""
            }}
          />

          <div
            className={cn(
              "rounded-xl border border-dashed transition-colors",
              isImageDragActive
                ? "border-primary bg-primary/5"
                : "border-border/70 bg-muted/20"
            )}
            onDragEnter={(event) => {
              event.preventDefault()
              imageDragCounterRef.current += 1
              setIsImageDragActive(true)
            }}
            onDragOver={(event) => {
              event.preventDefault()
              event.dataTransfer.dropEffect = "copy"
            }}
            onDragLeave={(event) => {
              event.preventDefault()
              imageDragCounterRef.current = Math.max(0, imageDragCounterRef.current - 1)

              if (imageDragCounterRef.current === 0) {
                setIsImageDragActive(false)
              }
            }}
            onDrop={(event) => {
              event.preventDefault()
              imageDragCounterRef.current = 0
              setIsImageDragActive(false)
              void handleImageSelection(event.dataTransfer.files)
            }}
          >
            <div
              role="button"
              tabIndex={0}
              className="flex w-full flex-col items-center justify-center gap-3 p-8 text-center"
              onClick={() => imageInputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  imageInputRef.current?.click()
                }
              }}
            >
              <ImagePlus className="size-5 text-muted-foreground" />
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">
                  Arrastra imágenes aquí o selecciona archivos
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, JPEG, WEBP o SVG. Máximo {MAX_ROUTE_IMAGES} imágenes y 4MB en total.
                </p>
              </div>
              <Button type="button" variant="outline">
                <Upload data-icon="inline-start" />
                Seleccionar imágenes
              </Button>
            </div>
          </div>

          {errors.assets && <p className="text-sm text-destructive">{errors.assets}</p>}

          {formState.assets.length > 0 && (
            <div className="overflow-hidden rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vista previa</TableHead>
                    <TableHead>Archivo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="w-[120px] text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formState.assets.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell>
                        <div className="h-14 w-20 overflow-hidden rounded-md border bg-muted">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={asset.dataUrl}
                            alt={asset.fileName}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{asset.fileName}</span>
                          <span className="text-xs text-muted-foreground">
                            {asset.kind === "vista"
                              ? "Usada como portada si es la primera vista."
                              : "Asset de apoyo"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={asset.kind}
                          onValueChange={(value) =>
                            updateAsset(asset.id, value as RouteAssetType)
                          }
                        >
                          <SelectTrigger className="w-full min-w-40">
                            <SelectValue placeholder="Tipo de imagen" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {ROUTE_ASSET_TYPES.map((assetType) => (
                                <SelectItem key={assetType} value={assetType}>
                                  {assetType}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button type="button" variant="ghost" onClick={() => removeAsset(asset.id)}>
                          <Trash2 data-icon="inline-start" />
                          Eliminar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Información de la ruta</CardTitle>
          <CardDescription>
            Completa los datos técnicos y el contexto de uso de la ruta.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <FieldGroup>
            <div className="grid gap-6 lg:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="routeDifficulty">Dificultad</FieldLabel>
                <FieldContent>
                  <Select
                    value={formState.difficulty}
                    onValueChange={(value) =>
                      setFormState((current) => ({
                        ...current,
                        difficulty: value as RouteDifficulty,
                      }))
                    }
                  >
                    <SelectTrigger id="routeDifficulty" className="w-full">
                      <SelectValue placeholder="Selecciona dificultad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {ROUTE_DIFFICULTIES.map((difficulty) => (
                          <SelectItem key={difficulty} value={difficulty}>
                            {difficulty}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="routeSport">Deporte</FieldLabel>
                <FieldContent>
                  <Select
                    value={formState.sport}
                    onValueChange={(value) =>
                      setFormState((current) => ({
                        ...current,
                        sport: value as RouteSport,
                      }))
                    }
                  >
                    <SelectTrigger id="routeSport" className="w-full">
                      <SelectValue placeholder="Selecciona deporte" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {ROUTE_SPORTS.map((sport) => (
                          <SelectItem key={sport} value={sport}>
                            {sport}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>

              <Field data-invalid={Boolean(errors.distanceKm)}>
                <FieldLabel htmlFor="routeDistance">Distancia en km</FieldLabel>
                <FieldContent>
                  <Input
                    id="routeDistance"
                    type="number"
                    min={0}
                    step={0.1}
                    value={formState.distanceKm}
                    aria-invalid={Boolean(errors.distanceKm)}
                    onChange={(event) => {
                      setFormState((current) => ({
                        ...current,
                        distanceKm: event.target.value,
                      }))
                      setErrors((current) => ({ ...current, distanceKm: undefined }))
                    }}
                  />
                  <FieldError>{errors.distanceKm}</FieldError>
                </FieldContent>
              </Field>

              <Field data-invalid={Boolean(errors.duration)}>
                <FieldLabel htmlFor="routeDuration">Duración en hh:mm</FieldLabel>
                <FieldContent>
                  <Input
                    id="routeDuration"
                    value={formState.duration}
                    aria-invalid={Boolean(errors.duration)}
                    onChange={(event) => {
                      setFormState((current) => ({
                        ...current,
                        duration: event.target.value,
                      }))
                      setErrors((current) => ({ ...current, duration: undefined }))
                    }}
                    placeholder="03:45"
                  />
                  <FieldError>{errors.duration}</FieldError>
                </FieldContent>
              </Field>

              <Field data-invalid={Boolean(errors.elevationGainM)}>
                <FieldLabel htmlFor="routeElevation">Desnivel positivo</FieldLabel>
                <FieldContent>
                  <Input
                    id="routeElevation"
                    type="number"
                    min={0}
                    step={1}
                    value={formState.elevationGainM}
                    aria-invalid={Boolean(errors.elevationGainM)}
                    onChange={(event) => {
                      setFormState((current) => ({
                        ...current,
                        elevationGainM: event.target.value,
                      }))
                      setErrors((current) => ({ ...current, elevationGainM: undefined }))
                    }}
                  />
                  <FieldError>{errors.elevationGainM}</FieldError>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="routeRegion">Región o valle</FieldLabel>
                <FieldContent>
                  <Select
                    value={formState.region}
                    onValueChange={(value) =>
                      setFormState((current) => ({
                        ...current,
                        region: value as RouteRegion,
                      }))
                    }
                  >
                    <SelectTrigger id="routeRegion" className="w-full">
                      <SelectValue placeholder="Selecciona región" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {ROUTE_REGIONS.map((region) => (
                          <SelectItem key={region} value={region}>
                            {region}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="routeOrientation">Orientación</FieldLabel>
                <FieldContent>
                  <Select
                    value={formState.orientation}
                    onValueChange={(value) =>
                      setFormState((current) => ({
                        ...current,
                        orientation: value as RouteOrientation,
                      }))
                    }
                  >
                    <SelectTrigger id="routeOrientation" className="w-full">
                      <SelectValue placeholder="Selecciona orientación" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {ROUTE_ORIENTATIONS.map((orientation) => (
                          <SelectItem key={orientation} value={orientation}>
                            {orientation}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="routeDirection">Dirección</FieldLabel>
                <FieldContent>
                  <Select
                    value={formState.direction}
                    onValueChange={(value) =>
                      setFormState((current) => ({
                        ...current,
                        direction: value as RouteDirection,
                      }))
                    }
                  >
                    <SelectTrigger id="routeDirection" className="w-full">
                      <SelectValue placeholder="Selecciona dirección" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {ROUTE_DIRECTIONS.map((direction) => (
                          <SelectItem key={direction} value={direction}>
                            {direction}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>
            </div>

            <FieldSet>
              <FieldLegend>Opciones de la ruta</FieldLegend>
              <div data-slot="checkbox-group" className="grid gap-4 lg:grid-cols-3">
                <Field orientation="horizontal">
                  <Checkbox
                    id="routeCircular"
                    checked={formState.isCircular}
                    onCheckedChange={(checked) =>
                      setFormState((current) => ({
                        ...current,
                        isCircular: checked === true,
                      }))
                    }
                  />
                  <FieldContent>
                    <FieldLabel htmlFor="routeCircular">Ruta circular</FieldLabel>
                    <FieldDescription>La ruta termina en el mismo punto de inicio.</FieldDescription>
                  </FieldContent>
                </Field>

                <Field orientation="horizontal">
                  <Checkbox
                    id="routeBeginner"
                    checked={formState.isBeginnerFriendly}
                    onCheckedChange={(checked) =>
                      setFormState((current) => ({
                        ...current,
                        isBeginnerFriendly: checked === true,
                      }))
                    }
                  />
                  <FieldContent>
                    <FieldLabel htmlFor="routeBeginner">Iniciación</FieldLabel>
                    <FieldDescription>
                      Indica si es una ruta apta para principiantes.
                    </FieldDescription>
                  </FieldContent>
                </Field>

                <Field orientation="horizontal">
                  <Checkbox
                    id="routeFamily"
                    checked={formState.isFamilyFriendly}
                    onCheckedChange={(checked) =>
                      setFormState((current) => ({
                        ...current,
                        isFamilyFriendly: checked === true,
                      }))
                    }
                  />
                  <FieldContent>
                    <FieldLabel htmlFor="routeFamily">Familiar</FieldLabel>
                    <FieldDescription>Marca si es adecuada para un público familiar.</FieldDescription>
                  </FieldContent>
                </Field>
              </div>
            </FieldSet>
          </FieldGroup>
        </CardContent>
      </Card>

      {submitError && <p className="text-sm text-destructive">{submitError}</p>}

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href={cancelHref}>
            <ArrowLeft data-icon="inline-start" />
            Volver
          </Link>
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 data-icon="inline-start" className="animate-spin" />
              Guardando ruta...
            </>
          ) : (
            "Crear ruta"
          )}
        </Button>
      </div>
    </form>
  )
}
