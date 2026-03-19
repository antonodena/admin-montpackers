"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, Check, ImagePlus, Palette } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import type { Tenant } from "@/lib/mock-data"
import {
  DEFAULT_TENANT_BRAND_COLOR,
  fileToDataUrl,
  getTenantAssetAccept,
  getTenantBrandColor,
  normalizeTenantBrandColorInput,
  type TenantAssetTarget,
  validateTenantAssetFile,
  validateTenantName,
} from "@/lib/tenant-form"
import {
  buildTenantUrl,
  isSlugAvailable,
  isSlugFormatValid,
  isValidHexColor,
  sanitizeSlug,
  slugifyHotelName,
  upsertStoredTenant,
} from "@/lib/tenant-storage"
import { cn } from "@/lib/utils"

const ONBOARDING_STEPS = [
  { title: "Identidad", description: "Datos base del tenant" },
  { title: "Branding", description: "Activos y color de marca" },
] as const

type Step = 0 | 1

type CreateTenantModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingTenants: Tenant[]
  onTenantCreated?: (tenant: Tenant) => void
}

function initialState() {
  return {
    step: 0 as Step,
    hotelName: "",
    slug: "",
    isSlugTouched: false,
    logoDataUrl: "",
    logoFileName: "",
    logoError: "",
    faviconDataUrl: "",
    faviconFileName: "",
    faviconError: "",
    brandColor: DEFAULT_TENANT_BRAND_COLOR,
    isSubmitting: false,
    submitError: "",
  }
}

export function CreateTenantModal({
  open,
  onOpenChange,
  existingTenants,
  onTenantCreated,
}: CreateTenantModalProps) {
  const router = useRouter()

  const [state, setState] = React.useState(initialState)

  React.useEffect(() => {
    if (!open) {
      setState(initialState())
    }
  }, [open])

  const normalizedName = state.hotelName.trim()
  const normalizedSlug = sanitizeSlug(state.slug)
  const siteUrl = buildTenantUrl(normalizedSlug)

  const isSlugValid = normalizedSlug.length > 0 && isSlugFormatValid(normalizedSlug)
  const slugAvailable =
    normalizedSlug.length > 0 && isSlugAvailable(normalizedSlug, existingTenants)

  const identityStepValid =
    validateTenantName(state.hotelName) === null &&
    isSlugValid &&
    slugAvailable &&
    normalizedSlug === state.slug

  const brandingStepValid =
    state.logoDataUrl.length > 0 &&
    state.faviconDataUrl.length > 0 &&
    isValidHexColor(state.brandColor)

  const canContinue = state.step === 0 ? identityStepValid : brandingStepValid
  const displayColor = getTenantBrandColor(state.brandColor)
  const hotelNameError =
    state.hotelName.length > 0 ? validateTenantName(state.hotelName) : null
  const slugError =
    state.slug.length === 0
      ? null
      : normalizedSlug !== state.slug
        ? "El slug contiene caracteres inválidos. Usa letras minúsculas, números y guiones."
        : !isSlugValid
          ? "Formato de slug no válido."
          : !slugAvailable
            ? "Este slug ya existe."
            : null
  const brandColorError =
    state.brandColor.length > 0 && !isValidHexColor(state.brandColor)
      ? "Introduce un color HEX válido (ej. #9F1239)."
      : null

  function handleHotelNameChange(value: string) {
    setState((current) => ({
      ...current,
      hotelName: value,
      slug: current.isSlugTouched ? current.slug : slugifyHotelName(value),
    }))
  }

  function handleSlugChange(value: string) {
    setState((current) => ({
      ...current,
      isSlugTouched: true,
      slug: sanitizeSlug(value),
    }))
  }

  function handleColorTextChange(value: string) {
    const next = normalizeTenantBrandColorInput(value)

    if (next !== null) {
      setState((current) => ({ ...current, brandColor: next }))
    }
  }

  async function handleAssetUpload(target: TenantAssetTarget, fileList: FileList | null) {
    if (!fileList || fileList.length === 0) {
      return
    }

    const file = fileList[0]
    const validationError = validateTenantAssetFile(target, file)

    if (validationError) {
      setState((current) =>
        target === "logo"
          ? { ...current, logoError: validationError }
          : { ...current, faviconError: validationError }
      )
      return
    }

    try {
      const dataUrl = await fileToDataUrl(file)

      setState((current) =>
        target === "logo"
          ? {
              ...current,
              logoDataUrl: dataUrl,
              logoFileName: file.name,
              logoError: "",
            }
          : {
              ...current,
              faviconDataUrl: dataUrl,
              faviconFileName: file.name,
              faviconError: "",
            }
      )
    } catch {
      setState((current) =>
        target === "logo"
          ? { ...current, logoError: "No se ha podido cargar el archivo." }
          : { ...current, faviconError: "No se ha podido cargar el archivo." }
      )
    }
  }

  async function handleCreateTenant() {
    if (!identityStepValid || !brandingStepValid || state.isSubmitting) {
      return
    }

    setState((current) => ({ ...current, isSubmitting: true, submitError: "" }))

    try {
      const tenant: Tenant = {
        id: `tenant_local_${Date.now()}`,
        slug: normalizedSlug,
        name: normalizedName,
        siteUrl,
        imageUrl: state.logoDataUrl,
        logoDataUrl: state.logoDataUrl,
        faviconDataUrl: state.faviconDataUrl,
        brandColor: displayColor,
      }

      upsertStoredTenant(tenant)
      onTenantCreated?.(tenant)
      router.push(`/tenant/${tenant.slug}`)
      router.refresh()
    } catch {
      setState((current) => ({
        ...current,
        isSubmitting: false,
        submitError: "No se ha podido crear el tenant. Inténtalo de nuevo.",
      }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Crear nuevo tenant</DialogTitle>
          <DialogDescription>
            Configura la identidad y el branding del hotel para crear el tenant.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 md:grid-cols-2">
          {ONBOARDING_STEPS.map((stepItem, index) => {
            const isActive = index === state.step
            const isDone = index < state.step

            return (
              <Card
                key={stepItem.title}
                className={cn(
                  "gap-0 py-4 transition-colors",
                  isActive && "border-primary/50 bg-primary/5",
                  isDone && "border-emerald-300 bg-emerald-50/60"
                )}
              >
                <CardContent className="flex items-start gap-3 px-4">
                  <div
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                      isDone && "border-emerald-500 bg-emerald-500 text-white",
                      isActive && "border-primary text-primary"
                    )}
                  >
                    {isDone ? <Check className="size-3.5" /> : index + 1}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{stepItem.title}</p>
                      <Badge
                        variant={isDone ? "default" : isActive ? "secondary" : "outline"}
                        className="w-fit"
                      >
                        {isDone ? "Completado" : isActive ? "En curso" : `Paso ${index + 1}`}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{stepItem.description}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {state.step === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Identidad</CardTitle>
              <CardDescription>
                Define el nombre del hotel, su slug y la URL resultante del tenant.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <FieldGroup>
                <Field data-invalid={Boolean(hotelNameError)}>
                  <FieldLabel htmlFor="hotelName">Nombre del hotel</FieldLabel>
                  <FieldContent>
                    <Input
                      id="hotelName"
                      value={state.hotelName}
                      aria-invalid={Boolean(hotelNameError)}
                      onChange={(event) => handleHotelNameChange(event.target.value)}
                      placeholder="Ej. Hotel Taull"
                    />
                    <FieldDescription>
                      Se usara como nombre visible en el admin y en la experiencia del tenant.
                    </FieldDescription>
                    <FieldError>{hotelNameError}</FieldError>
                  </FieldContent>
                </Field>

                <Field data-invalid={Boolean(slugError)}>
                  <FieldLabel htmlFor="tenantSlug">Slug</FieldLabel>
                  <FieldContent>
                    <Input
                      id="tenantSlug"
                      value={state.slug}
                      aria-invalid={Boolean(slugError)}
                      onChange={(event) => handleSlugChange(event.target.value)}
                      placeholder="hotel-taull"
                    />
                    <FieldDescription>
                      Se autogenera a partir del nombre y puedes editarlo manualmente.
                    </FieldDescription>
                    <FieldError>{slugError}</FieldError>
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel htmlFor="tenantSiteUrl">URL del tenant</FieldLabel>
                  <FieldContent>
                    <Input id="tenantSiteUrl" value={siteUrl} readOnly />
                    <FieldDescription>
                      URL final que se abrira para gestionar el tenant creado.
                    </FieldDescription>
                  </FieldContent>
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>
        )}

        {state.step === 1 && (
          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Branding</CardTitle>
                <CardDescription>
                  Sube el logo, el favicon y define el color de marca del hotel.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                <FieldGroup>
                  <Field data-invalid={Boolean(state.logoError)}>
                    <FieldLabel htmlFor="logo">Logo del hotel</FieldLabel>
                    <FieldContent>
                      <Input
                        id="logo"
                        type="file"
                        accept={getTenantAssetAccept("logo")}
                        aria-invalid={Boolean(state.logoError)}
                        onChange={(event) => handleAssetUpload("logo", event.target.files)}
                      />
                      <FieldDescription>PNG/JPG/JPEG/SVG · maximo 2MB</FieldDescription>
                      {state.logoFileName ? (
                        <Badge variant="outline" className="w-fit">
                          {state.logoFileName}
                        </Badge>
                      ) : null}
                      <FieldError>{state.logoError}</FieldError>
                    </FieldContent>
                  </Field>

                  <Field data-invalid={Boolean(state.faviconError)}>
                    <FieldLabel htmlFor="favicon">Favicon</FieldLabel>
                    <FieldContent>
                      <Input
                        id="favicon"
                        type="file"
                        accept={getTenantAssetAccept("favicon")}
                        aria-invalid={Boolean(state.faviconError)}
                        onChange={(event) => handleAssetUpload("favicon", event.target.files)}
                      />
                      <FieldDescription>ICO/PNG/SVG · maximo 512KB</FieldDescription>
                      {state.faviconFileName ? (
                        <Badge variant="outline" className="w-fit">
                          {state.faviconFileName}
                        </Badge>
                      ) : null}
                      <FieldError>{state.faviconError}</FieldError>
                    </FieldContent>
                  </Field>

                  <Field data-invalid={Boolean(brandColorError)}>
                    <FieldLabel htmlFor="brandColor">Color de marca</FieldLabel>
                    <FieldContent>
                      <div className="flex items-center gap-3">
                        <Input
                          id="brandColorPicker"
                          type="color"
                          value={displayColor}
                          onChange={(event) =>
                            setState((current) => ({
                              ...current,
                              brandColor: event.target.value.toUpperCase(),
                            }))
                          }
                          className="h-10 w-16 p-1"
                        />
                        <Input
                          id="brandColor"
                          value={state.brandColor}
                          aria-invalid={Boolean(brandColorError)}
                          onChange={(event) => handleColorTextChange(event.target.value)}
                          placeholder="#9F1239"
                        />
                      </div>
                      <FieldDescription>
                        Define el color principal que se usara en el branding del tenant.
                      </FieldDescription>
                      <FieldError>{brandColorError}</FieldError>
                    </FieldContent>
                  </Field>
                </FieldGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>
                  Revisa rapidamente como se vera la identidad del tenant.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Badge variant="outline" className="w-fit">
                  Tenant demo
                </Badge>
                <Card className="gap-4 py-4 shadow-none">
                  <CardContent className="flex flex-col gap-4 px-4">
                    <div className="h-2 rounded-full" style={{ backgroundColor: displayColor }} />
                    <div className="flex items-center gap-3">
                      <Avatar className="size-12 rounded-lg">
                        <AvatarImage src={state.logoDataUrl} alt={normalizedName || "Logo"} />
                        <AvatarFallback className="rounded-lg bg-muted">
                          <ImagePlus className="size-4 text-muted-foreground" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">
                          {normalizedName || "Nombre del hotel"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{siteUrl}</p>
                      </div>
                      <Avatar className="size-8 rounded-md border">
                        <AvatarImage src={state.faviconDataUrl} alt="Favicon" />
                        <AvatarFallback className="rounded-md bg-muted">
                          <Palette className="size-3.5 text-muted-foreground" />
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </div>
        )}

        <FieldError>{state.submitError}</FieldError>

        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => setState((current) => ({ ...current, step: 0 }))}
            disabled={state.step === 0 || state.isSubmitting}
          >
            <ArrowLeft data-icon="inline-start" />
            Anterior
          </Button>

          {state.step === 0 ? (
            <Button
              type="button"
              onClick={() => setState((current) => ({ ...current, step: 1 }))}
              disabled={!canContinue}
            >
              Siguiente
              <ArrowRight data-icon="inline-end" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleCreateTenant}
              disabled={!canContinue || state.isSubmitting}
            >
              {state.isSubmitting ? "Creando tenant..." : "Crear tenant"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
