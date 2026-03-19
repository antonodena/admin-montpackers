"use client"

import Link from "next/link"
import * as React from "react"
import { ImagePlus, Trash2, Upload } from "lucide-react"

import type { Tenant } from "@/lib/mock-data"
import type { PoiLibraryItem, PoiType } from "@/lib/poi-storage"
import { createPoi, createPoiAndAssign, POI_TYPES } from "@/lib/poi-storage"
import {
  getImagePayloadSize,
  IMAGE_UPLOAD_ACCEPT,
  MAX_IMAGE_UPLOAD_BYTES,
  optimizeImageFile,
  validateImageFile,
} from "@/lib/image-upload"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
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
import { cn } from "@/lib/utils"

const GLOBAL_TENANT_VALUE = "__global__"

type PoiFormMode = "admin" | "tenant"

type PoiFormProps = {
  mode: PoiFormMode
  cancelHref: string
  tenant?: Tenant
  tenants?: Tenant[]
  onCreated: (poi: PoiLibraryItem, assignedTenantSlug?: string) => void
}

type PoiFormState = {
  name: string
  type: PoiType
  subtype: string
  coverImageUrl: string
  coverImageName: string
}

type PoiFormErrors = Partial<Record<"name" | "subtype" | "coverImage", string>>

function buildInitialState(): PoiFormState {
  return {
    name: "",
    type: POI_TYPES[0],
    subtype: "",
    coverImageUrl: "",
    coverImageName: "",
  }
}

function buildPoiErrors(state: PoiFormState): PoiFormErrors {
  const errors: PoiFormErrors = {}

  if (!state.name.trim()) {
    errors.name = "El nombre del POI es obligatorio."
  }

  if (!state.subtype.trim()) {
    errors.subtype = "El subtipo del POI es obligatorio."
  }

  if (!state.coverImageUrl) {
    errors.coverImage = "Añade una imagen de portada para crear el POI."
  }

  return errors
}

export function PoiForm({
  mode,
  cancelHref,
  tenant,
  tenants = [],
  onCreated,
}: PoiFormProps) {
  const imageInputRef = React.useRef<HTMLInputElement>(null)
  const imageDragCounterRef = React.useRef(0)

  const [formState, setFormState] = React.useState<PoiFormState>(buildInitialState)
  const [errors, setErrors] = React.useState<PoiFormErrors>({})
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isImageDragActive, setIsImageDragActive] = React.useState(false)
  const [selectedTenantSlug, setSelectedTenantSlug] = React.useState(
    mode === "tenant" ? tenant?.slug ?? "" : GLOBAL_TENANT_VALUE
  )

  const selectedTenant = tenants.find((item) => item.slug === selectedTenantSlug)
  const assignedTenantSlug = mode === "tenant" ? tenant?.slug : selectedTenant?.slug

  const handleImageSelection = React.useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) {
      return
    }

    const nextFile = files[0]

    setSubmitError(null)
    setErrors((current) => ({ ...current, coverImage: undefined }))

    try {
      const validationError = validateImageFile(nextFile)
      if (validationError) {
        throw new Error(validationError)
      }

      const optimized = await optimizeImageFile(nextFile)

      if (getImagePayloadSize([{ dataUrl: optimized.dataUrl }]) > MAX_IMAGE_UPLOAD_BYTES) {
        throw new Error("La imagen supera el límite total de 4MB.")
      }

      React.startTransition(() => {
        setFormState((current) => ({
          ...current,
          coverImageUrl: optimized.dataUrl,
          coverImageName: nextFile.name,
        }))
      })
    } catch (error) {
      setErrors((current) => ({
        ...current,
        coverImage:
          error instanceof Error ? error.message : "No se ha podido cargar la imagen.",
      }))
    }
  }, [])

  function removeCoverImage() {
    setFormState((current) => ({
      ...current,
      coverImageUrl: "",
      coverImageName: "",
    }))
    setErrors((current) => ({
      ...current,
      coverImage: "Añade una imagen de portada para crear el POI.",
    }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    const nextErrors = buildPoiErrors(formState)

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      setSubmitError("Revisa los campos marcados antes de guardar.")
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const payload = {
        name: formState.name.trim(),
        type: formState.type,
        subtype: formState.subtype.trim(),
        coverImageUrl: formState.coverImageUrl,
      }

      const poi = assignedTenantSlug
        ? createPoiAndAssign(assignedTenantSlug, payload)
        : createPoi(payload)

      onCreated(poi, assignedTenantSlug)
    } catch {
      setSubmitError("No se ha podido crear el POI. Inténtalo de nuevo.")
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
            Define el contexto editorial principal del punto de interés.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <FieldGroup>
            {mode === "admin" && (
              <Field>
                <FieldLabel htmlFor="poiTenant">Tenant</FieldLabel>
                <FieldContent>
                  <Select value={selectedTenantSlug} onValueChange={setSelectedTenantSlug}>
                    <SelectTrigger id="poiTenant" className="w-full">
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
                    Si no seleccionas un tenant, el POI quedará solo en la biblioteca global.
                  </FieldDescription>
                </FieldContent>
              </Field>
            )}

            <Field data-invalid={Boolean(errors.name)}>
              <FieldLabel htmlFor="poiName">Nombre</FieldLabel>
              <FieldContent>
                <Input
                  id="poiName"
                  value={formState.name}
                  aria-invalid={Boolean(errors.name)}
                  onChange={(event) => {
                    setFormState((current) => ({ ...current, name: event.target.value }))
                    setErrors((current) => ({ ...current, name: undefined }))
                  }}
                  placeholder="Ej: Mirador de Sant Climent"
                />
                <FieldError>{errors.name}</FieldError>
              </FieldContent>
            </Field>

            <div className="grid gap-6 lg:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="poiType">Tipo</FieldLabel>
                <FieldContent>
                  <Select
                    value={formState.type}
                    onValueChange={(value) =>
                      setFormState((current) => ({
                        ...current,
                        type: value as PoiType,
                      }))
                    }
                  >
                    <SelectTrigger id="poiType" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {POI_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>

              <Field data-invalid={Boolean(errors.subtype)}>
                <FieldLabel htmlFor="poiSubtype">Subtipo</FieldLabel>
                <FieldContent>
                  <Input
                    id="poiSubtype"
                    value={formState.subtype}
                    aria-invalid={Boolean(errors.subtype)}
                    onChange={(event) => {
                      setFormState((current) => ({ ...current, subtype: event.target.value }))
                      setErrors((current) => ({ ...current, subtype: undefined }))
                    }}
                    placeholder="Ej: Panorámica de valle"
                  />
                  <FieldError>{errors.subtype}</FieldError>
                </FieldContent>
              </Field>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Portada</CardTitle>
          <CardDescription>
            Sube una imagen de portada para el POI. Se guardará optimizada en el navegador.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <input
            ref={imageInputRef}
            id="poiCoverImage"
            type="file"
            accept={IMAGE_UPLOAD_ACCEPT}
            className="hidden"
            onChange={(event) => {
              void handleImageSelection(event.target.files)
              event.target.value = ""
            }}
          />

          <Field data-invalid={Boolean(errors.coverImage)}>
            <FieldLabel htmlFor="poiCoverImage">Imagen de portada</FieldLabel>
            <FieldContent>
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
                <div className="flex flex-col items-center justify-center gap-3 px-6 py-8 text-center">
                  <div className="rounded-full bg-background p-3 shadow-sm">
                    <ImagePlus className="size-5 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="font-medium">Arrastra una imagen o selecciónala desde tu equipo</p>
                    <p className="text-sm text-muted-foreground">
                      Formatos soportados: PNG, JPG, WEBP o SVG. Máximo 4MB.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => imageInputRef.current?.click()}
                  >
                    <Upload data-icon="inline-start" />
                    Seleccionar imagen
                  </Button>
                </div>
              </div>

              {formState.coverImageUrl && (
                <div className="mt-4 overflow-hidden rounded-xl border">
                  <div className="aspect-[16/9] bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={formState.coverImageUrl}
                      alt={formState.name || "Vista previa del POI"}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4 p-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {formState.coverImageName || "Imagen cargada"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Portada que se usará en la biblioteca y en el tenant.
                      </p>
                    </div>
                    <Button type="button" variant="outline" onClick={removeCoverImage}>
                      <Trash2 data-icon="inline-start" />
                      Quitar
                    </Button>
                  </div>
                </div>
              )}

              <FieldDescription>
                Recomendado: una foto horizontal que represente claramente el punto de interés.
              </FieldDescription>
              <FieldError>{errors.coverImage}</FieldError>
            </FieldContent>
          </Field>
        </CardContent>
      </Card>

      {submitError && <p className="text-sm text-destructive">{submitError}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Crear POI"}
        </Button>
        <Button asChild variant="outline">
          <Link href={cancelHref}>Cancelar</Link>
        </Button>
      </div>
    </form>
  )
}
