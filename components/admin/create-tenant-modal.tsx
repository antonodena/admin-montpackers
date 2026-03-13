"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, Check, ImagePlus, Palette } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
              <div
                key={stepItem.title}
                className={cn(
                  "rounded-lg border p-3 transition-colors",
                  isActive && "border-primary/50 bg-primary/5",
                  isDone && "border-emerald-300 bg-emerald-50/60"
                )}
              >
                <div className="mb-2 flex items-center gap-2">
                  <div
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full border text-xs font-semibold",
                      isDone && "border-emerald-500 bg-emerald-500 text-white",
                      isActive && "border-primary text-primary"
                    )}
                  >
                    {isDone ? <Check className="size-3.5" /> : index + 1}
                  </div>
                  <p className="text-sm font-medium">{stepItem.title}</p>
                </div>
                <p className="text-xs text-muted-foreground">{stepItem.description}</p>
              </div>
            )
          })}
        </div>

        {state.step === 0 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="hotelName" className="text-sm font-medium">
                Nombre del hotel
              </label>
              <Input
                id="hotelName"
                value={state.hotelName}
                onChange={(event) => handleHotelNameChange(event.target.value)}
                placeholder="Ej. Hotel Taüll"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="tenantSlug" className="text-sm font-medium">
                Slug
              </label>
              <Input
                id="tenantSlug"
                value={state.slug}
                onChange={(event) => handleSlugChange(event.target.value)}
                placeholder="hotel-taull"
              />
              <p className="text-xs text-muted-foreground">
                Se autogenera a partir del nombre y puedes editarlo manualmente.
              </p>
              {state.slug.length > 0 && normalizedSlug !== state.slug && (
                <p className="text-xs text-amber-600">
                  El slug contiene caracteres inválidos. Usa letras minúsculas, números y guiones.
                </p>
              )}
              {state.slug.length > 0 && normalizedSlug === state.slug && !isSlugValid && (
                <p className="text-xs text-rose-600">Formato de slug no válido.</p>
              )}
              {state.slug.length > 0 && normalizedSlug === state.slug && isSlugValid && !slugAvailable && (
                <p className="text-xs text-rose-600">Este slug ya existe.</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="tenantSiteUrl" className="text-sm font-medium">
                URL del tenant
              </label>
              <Input id="tenantSiteUrl" value={siteUrl} readOnly />
            </div>
          </div>
        )}

        {state.step === 1 && (
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="logo" className="text-sm font-medium">
                  Logo del hotel
                </label>
                <Input
                  id="logo"
                  type="file"
                  accept={getTenantAssetAccept("logo")}
                  onChange={(event) => handleAssetUpload("logo", event.target.files)}
                />
                <p className="text-xs text-muted-foreground">PNG/JPG/JPEG/SVG · máximo 2MB</p>
                {state.logoFileName && <p className="text-xs text-muted-foreground">{state.logoFileName}</p>}
                {state.logoError && <p className="text-xs text-rose-600">{state.logoError}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="favicon" className="text-sm font-medium">
                  Favicon
                </label>
                <Input
                  id="favicon"
                  type="file"
                  accept={getTenantAssetAccept("favicon")}
                  onChange={(event) => handleAssetUpload("favicon", event.target.files)}
                />
                <p className="text-xs text-muted-foreground">ICO/PNG/SVG · máximo 512KB</p>
                {state.faviconFileName && <p className="text-xs text-muted-foreground">{state.faviconFileName}</p>}
                {state.faviconError && <p className="text-xs text-rose-600">{state.faviconError}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="brandColor" className="text-sm font-medium">
                  Color de marca
                </label>
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
                    onChange={(event) => handleColorTextChange(event.target.value)}
                    placeholder="#9F1239"
                  />
                </div>
                {!isValidHexColor(state.brandColor) && (
                  <p className="text-xs text-rose-600">Introduce un color HEX válido (ej. #9F1239).</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border bg-muted/30 p-4">
              <p className="mb-3 text-sm font-medium">Preview de tenant</p>
              <div className="rounded-xl border bg-card p-4">
                <div className="mb-4 h-2 rounded-full" style={{ backgroundColor: displayColor }} />
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 rounded-lg">
                    <AvatarImage src={state.logoDataUrl} alt={normalizedName || "Logo"} />
                    <AvatarFallback className="rounded-lg bg-muted">
                      <ImagePlus className="size-4 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{normalizedName || "Nombre del hotel"}</p>
                    <p className="truncate text-xs text-muted-foreground">{siteUrl}</p>
                  </div>
                  <Avatar className="h-8 w-8 rounded-md border">
                    <AvatarImage src={state.faviconDataUrl} alt="Favicon" />
                    <AvatarFallback className="rounded-md bg-muted">
                      <Palette className="size-3.5 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
            </div>
          </div>
        )}

        {state.submitError && <p className="text-sm text-rose-600">{state.submitError}</p>}

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setState((current) => ({ ...current, step: 0 }))}
            disabled={state.step === 0 || state.isSubmitting}
          >
            <ArrowLeft className="size-4" />
            Anterior
          </Button>

          {state.step === 0 ? (
            <Button
              onClick={() => setState((current) => ({ ...current, step: 1 }))}
              disabled={!canContinue}
            >
              Siguiente
              <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button onClick={handleCreateTenant} disabled={!canContinue || state.isSubmitting}>
              {state.isSubmitting ? "Creando tenant..." : "Crear tenant"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
