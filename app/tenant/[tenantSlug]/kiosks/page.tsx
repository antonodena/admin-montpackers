"use client"

import Link from "next/link"
import * as React from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Clapperboard, LoaderCircle, Trash2, Upload } from "lucide-react"

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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  buildKioskVideoAssetKey,
  deleteKioskVideoBlob,
  getKioskVideoBlob,
  KIOSK_VIDEO_DELETE_FAILED,
  KIOSK_VIDEO_READ_FAILED,
  KIOSK_VIDEO_SAVE_FAILED,
  KIOSK_VIDEO_STORAGE_UNAVAILABLE,
  saveKioskVideoBlob,
} from "@/lib/kiosk-video-storage"
import {
  getTenantKioskConfigs,
  saveTenantKioskConfig,
  type KioskConfig,
  type KioskId,
  type KioskVideoAsset,
} from "@/lib/kiosk-storage"
import { tenants } from "@/lib/mock-data"
import { getCreatedTenantsFromStorage, mergeTenants } from "@/lib/tenant-storage"
import { cn } from "@/lib/utils"

const KIOSK_OPTIONS: { id: KioskId; label: string }[] = [
  { id: "hall", label: "Hall" },
  { id: "recepcion", label: "Recepción" },
]

const SCREENSAVER_VIDEO_MAX_SIZE = 50 * 1024 * 1024
const SCREENSAVER_VIDEO_ALLOWED_EXTENSIONS = ["mp4"]
const SCREENSAVER_VIDEO_ALLOWED_MIME_TYPES = ["video/mp4"]

type KioskConfigDraft = {
  id: KioskId
  name: string
  infoMessage: string
  lat: string
  lng: string
  screensaverVideo: KioskVideoAsset | null
  pendingVideoFile: File | null
  previewUrl: string | null
  shouldDeleteVideo: boolean
  isVideoPreviewLoading: boolean
  previewLoadFailed: boolean
  videoError: string | null
}

type KioskDraftMap = Record<KioskId, KioskConfigDraft>

function parseCoordinate(value: string) {
  const normalized = value.trim().replace(",", ".")
  if (!normalized) {
    return null
  }

  const parsed = Number(normalized)
  if (Number.isNaN(parsed)) {
    return null
  }

  return parsed
}

function getFileExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() ?? ""
}

function isMimeAllowed(fileType: string, allowedMimeTypes: string[]) {
  return fileType.length === 0 || allowedMimeTypes.includes(fileType)
}

function validateScreensaverVideoFile(file: File) {
  const extension = getFileExtension(file.name)

  if (!SCREENSAVER_VIDEO_ALLOWED_EXTENSIONS.includes(extension)) {
    return "El salvapantalla debe ser un archivo MP4."
  }

  if (!isMimeAllowed(file.type, SCREENSAVER_VIDEO_ALLOWED_MIME_TYPES)) {
    return "El archivo seleccionado no es un vídeo MP4 válido."
  }

  if (file.size > SCREENSAVER_VIDEO_MAX_SIZE) {
    return "El vídeo supera el límite de 50MB."
  }

  return null
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 }).format(size / (1024 * 1024))} MB`
  }

  if (size >= 1024) {
    return `${new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 }).format(size / 1024)} KB`
  }

  return `${size} B`
}

function revokePreviewUrl(previewUrl: string | null) {
  if (previewUrl && previewUrl.startsWith("blob:")) {
    URL.revokeObjectURL(previewUrl)
  }
}

function revokeAllDraftPreviewUrls(draftMap: KioskDraftMap | null) {
  if (!draftMap) {
    return
  }

  for (const draft of Object.values(draftMap)) {
    revokePreviewUrl(draft.previewUrl)
  }
}

function getVideoStorageErrorMessage(error: unknown, action: "save" | "load" | "delete") {
  const code = error instanceof Error ? error.message : ""

  if (code === KIOSK_VIDEO_STORAGE_UNAVAILABLE) {
    return "Este navegador no permite guardar vídeos localmente."
  }

  if (action === "save" && code === KIOSK_VIDEO_SAVE_FAILED) {
    return "No se ha podido guardar el vídeo en el navegador. Libera espacio e inténtalo de nuevo."
  }

  if (action === "delete" && code === KIOSK_VIDEO_DELETE_FAILED) {
    return "No se ha podido eliminar el vídeo guardado. Inténtalo de nuevo."
  }

  if (action === "load" && code === KIOSK_VIDEO_READ_FAILED) {
    return "No se ha podido cargar el vídeo guardado."
  }

  if (action === "save") {
    return "No se ha podido guardar el vídeo en el navegador. Inténtalo de nuevo."
  }

  if (action === "delete") {
    return "No se ha podido eliminar el vídeo guardado. Inténtalo de nuevo."
  }

  return "No se ha podido cargar el vídeo guardado."
}

function configToDraft(config: KioskConfig): KioskConfigDraft {
  return {
    id: config.id,
    name: config.name,
    infoMessage: config.infoMessage,
    lat: String(config.location.lat),
    lng: String(config.location.lng),
    screensaverVideo: config.screensaverVideo,
    pendingVideoFile: null,
    previewUrl: null,
    shouldDeleteVideo: false,
    isVideoPreviewLoading: false,
    previewLoadFailed: false,
    videoError: null,
  }
}

function configMapToDraftMap(configMap: Record<KioskId, KioskConfig>): KioskDraftMap {
  return {
    hall: configToDraft(configMap.hall),
    recepcion: configToDraft(configMap.recepcion),
  }
}

function sanitizeKioskId(value: string | null): KioskId {
  return value === "recepcion" ? "recepcion" : "hall"
}

export default function TenantKiosksPage() {
  const params = useParams<{ tenantSlug: string }>()
  const searchParams = useSearchParams()

  const tenantSlug = params.tenantSlug
  const activeKioskId = sanitizeKioskId(searchParams.get("kiosk"))
  const activeKioskLabel = KIOSK_OPTIONS.find((item) => item.id === activeKioskId)?.label ?? "Hall"

  const [createdTenants, setCreatedTenants] = React.useState(getCreatedTenantsFromStorage())
  const [kioskDrafts, setKioskDrafts] = React.useState<KioskDraftMap | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)
  const [saveMessage, setSaveMessage] = React.useState<string | null>(null)
  const [isDragActive, setIsDragActive] = React.useState(false)

  const videoInputRef = React.useRef<HTMLInputElement | null>(null)
  const dragCounterRef = React.useRef(0)
  const previousActiveKioskIdRef = React.useRef<KioskId | null>(null)
  const kioskDraftsRef = React.useRef<KioskDraftMap | null>(null)

  React.useEffect(() => {
    kioskDraftsRef.current = kioskDrafts
  }, [kioskDrafts])

  React.useEffect(() => {
    setCreatedTenants(getCreatedTenantsFromStorage())
  }, [])

  React.useEffect(() => {
    return () => {
      revokeAllDraftPreviewUrls(kioskDraftsRef.current)
    }
  }, [])

  const allTenants = React.useMemo(
    () => mergeTenants(tenants, createdTenants),
    [createdTenants]
  )

  const tenant = allTenants.find((item) => item.slug === tenantSlug)
  const activeDraft = kioskDrafts?.[activeKioskId] ?? null

  const activeVideoMetadata =
    !activeDraft || activeDraft.shouldDeleteVideo
      ? null
      : activeDraft.pendingVideoFile
        ? {
            fileName: activeDraft.pendingVideoFile.name,
            size: activeDraft.pendingVideoFile.size,
          }
        : activeDraft.screensaverVideo

  const updateActiveDraft = React.useCallback(
    (updater: (currentDraft: KioskConfigDraft) => KioskConfigDraft) => {
      setKioskDrafts((current) => {
        if (!current) {
          return current
        }

        return {
          ...current,
          [activeKioskId]: updater(current[activeKioskId]),
        }
      })
    },
    [activeKioskId]
  )

  React.useEffect(() => {
    if (!tenantSlug) {
      return
    }

    revokeAllDraftPreviewUrls(kioskDraftsRef.current)
    const tenantConfigs = getTenantKioskConfigs(tenantSlug)
    setKioskDrafts(configMapToDraftMap(tenantConfigs))
    setFormError(null)
    setSaveMessage(null)
    setIsDragActive(false)
    dragCounterRef.current = 0
  }, [tenantSlug])

  React.useEffect(() => {
    const previousKioskId = previousActiveKioskIdRef.current

    if (previousKioskId && previousKioskId !== activeKioskId) {
      setKioskDrafts((current) => {
        if (!current) {
          return current
        }

        const previousDraft = current[previousKioskId]
        if (!previousDraft.previewUrl) {
          return current
        }

        revokePreviewUrl(previousDraft.previewUrl)

        return {
          ...current,
          [previousKioskId]: {
            ...previousDraft,
            previewUrl: null,
            isVideoPreviewLoading: false,
          },
        }
      })
    }

    previousActiveKioskIdRef.current = activeKioskId
    setIsDragActive(false)
    dragCounterRef.current = 0
  }, [activeKioskId])

  React.useEffect(() => {
    if (!tenantSlug || !activeDraft || activeDraft.shouldDeleteVideo || activeDraft.previewUrl) {
      return
    }

    if (activeDraft.pendingVideoFile) {
      const pendingFile = activeDraft.pendingVideoFile
      const previewUrl = URL.createObjectURL(pendingFile)

      setKioskDrafts((current) => {
        if (!current) {
          revokePreviewUrl(previewUrl)
          return current
        }

        const latestDraft = current[activeKioskId]
        if (
          !latestDraft ||
          latestDraft.previewUrl ||
          latestDraft.pendingVideoFile !== pendingFile ||
          latestDraft.shouldDeleteVideo
        ) {
          revokePreviewUrl(previewUrl)
          return current
        }

        return {
          ...current,
          [activeKioskId]: {
            ...latestDraft,
            previewUrl,
            isVideoPreviewLoading: false,
            previewLoadFailed: false,
          },
        }
      })

      return
    }

    const savedVideo = activeDraft.screensaverVideo

    if (!savedVideo || activeDraft.isVideoPreviewLoading || activeDraft.previewLoadFailed) {
      return
    }

    let isCancelled = false

    updateActiveDraft((current) => ({
      ...current,
      isVideoPreviewLoading: true,
    }))

    void getKioskVideoBlob(savedVideo.assetKey)
      .then((blob) => {
        if (isCancelled) {
          return
        }

        if (!blob) {
          updateActiveDraft((current) => ({
            ...current,
            isVideoPreviewLoading: false,
            previewLoadFailed: true,
            videoError: "El vídeo guardado no está disponible. Súbelo de nuevo o elimínalo.",
          }))
          return
        }

        const previewUrl = URL.createObjectURL(blob)

        setKioskDrafts((current) => {
          if (!current) {
            revokePreviewUrl(previewUrl)
            return current
          }

          const latestDraft = current[activeKioskId]
          if (
            !latestDraft ||
            latestDraft.previewUrl ||
            latestDraft.pendingVideoFile ||
            latestDraft.shouldDeleteVideo ||
            latestDraft.screensaverVideo?.assetKey !== savedVideo.assetKey
          ) {
            revokePreviewUrl(previewUrl)
            return current
          }

          return {
            ...current,
            [activeKioskId]: {
              ...latestDraft,
              previewUrl,
              isVideoPreviewLoading: false,
              previewLoadFailed: false,
              videoError: null,
            },
          }
        })
      })
      .catch((error) => {
        if (isCancelled) {
          return
        }

        updateActiveDraft((current) => ({
          ...current,
          isVideoPreviewLoading: false,
          previewLoadFailed: true,
          videoError: getVideoStorageErrorMessage(error, "load"),
        }))
      })

    return () => {
      isCancelled = true
    }
  }, [activeDraft, activeKioskId, tenantSlug, updateActiveDraft])

  function openVideoPicker() {
    videoInputRef.current?.click()
  }

  function resetVideoInput() {
    if (videoInputRef.current) {
      videoInputRef.current.value = ""
    }
  }

  function handleVideoSelection(fileList: FileList | null) {
    if (!fileList || fileList.length === 0 || !activeDraft) {
      return
    }

    const file = fileList[0]
    const validationError = validateScreensaverVideoFile(file)

    if (validationError) {
      updateActiveDraft((current) => ({
        ...current,
        videoError: validationError,
      }))
      setFormError(null)
      setSaveMessage(null)
      resetVideoInput()
      return
    }

    const previewUrl = URL.createObjectURL(file)

    updateActiveDraft((current) => {
      revokePreviewUrl(current.previewUrl)

      return {
        ...current,
        pendingVideoFile: file,
        previewUrl,
        shouldDeleteVideo: false,
        isVideoPreviewLoading: false,
        previewLoadFailed: false,
        videoError: null,
      }
    })

    setFormError(null)
    setSaveMessage(null)
    resetVideoInput()
  }

  function handleVideoInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    handleVideoSelection(event.target.files)
  }

  function handleRemoveVideo() {
    if (!activeDraft) {
      return
    }

    updateActiveDraft((current) => {
      revokePreviewUrl(current.previewUrl)

      return {
        ...current,
        pendingVideoFile: null,
        previewUrl: null,
        shouldDeleteVideo: true,
        isVideoPreviewLoading: false,
        previewLoadFailed: false,
        videoError: null,
      }
    })

    setFormError(null)
    setSaveMessage(null)
    resetVideoInput()
  }

  async function handleSaveConfig(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!tenantSlug || !activeDraft || isSaving) {
      return
    }

    const name = activeDraft.name.trim()
    const lat = parseCoordinate(activeDraft.lat)
    const lng = parseCoordinate(activeDraft.lng)

    if (!name) {
      setFormError("El nombre del tótem es obligatorio.")
      setSaveMessage(null)
      return
    }

    if (lat === null || lat < -90 || lat > 90) {
      setFormError("La latitud debe estar entre -90 y 90.")
      setSaveMessage(null)
      return
    }

    if (lng === null || lng < -180 || lng > 180) {
      setFormError("La longitud debe estar entre -180 y 180.")
      setSaveMessage(null)
      return
    }

    setIsSaving(true)
    setFormError(null)
    setSaveMessage(null)

    let rollbackOperation:
      | {
          type: "delete"
          assetKey: string
        }
      | {
          type: "restore"
          assetKey: string
          blob: Blob
        }
      | null = null

    try {
      let nextScreensaverVideo = activeDraft.shouldDeleteVideo ? null : activeDraft.screensaverVideo

      if (activeDraft.pendingVideoFile) {
        const assetKey = buildKioskVideoAssetKey(tenantSlug, activeDraft.id)
        const previousBlob = activeDraft.screensaverVideo
          ? await getKioskVideoBlob(activeDraft.screensaverVideo.assetKey)
          : null

        await saveKioskVideoBlob(assetKey, activeDraft.pendingVideoFile)
        rollbackOperation = previousBlob
          ? {
              type: "restore",
              assetKey,
              blob: previousBlob,
            }
          : {
              type: "delete",
              assetKey,
            }

        nextScreensaverVideo = {
          assetKey,
          fileName: activeDraft.pendingVideoFile.name,
          mimeType: activeDraft.pendingVideoFile.type || "video/mp4",
          size: activeDraft.pendingVideoFile.size,
          updatedAt: Date.now(),
        }
      } else if (activeDraft.shouldDeleteVideo && activeDraft.screensaverVideo) {
        const previousBlob = await getKioskVideoBlob(activeDraft.screensaverVideo.assetKey)

        await deleteKioskVideoBlob(activeDraft.screensaverVideo.assetKey)
        rollbackOperation = previousBlob
          ? {
              type: "restore",
              assetKey: activeDraft.screensaverVideo.assetKey,
              blob: previousBlob,
            }
          : null
        nextScreensaverVideo = null
      }

      const configToSave: KioskConfig = {
        id: activeDraft.id,
        name,
        infoMessage: activeDraft.infoMessage,
        location: {
          lat,
          lng,
        },
        screensaverVideo: nextScreensaverVideo,
      }

      saveTenantKioskConfig(tenantSlug, configToSave)

      updateActiveDraft((current) => {
        const nextDraft = configToDraft(configToSave)

        if (nextScreensaverVideo && current.previewUrl) {
          return {
            ...nextDraft,
            previewUrl: current.previewUrl,
            isVideoPreviewLoading: false,
          }
        }

        revokePreviewUrl(current.previewUrl)
        return nextDraft
      })

      setSaveMessage("Configuración guardada correctamente.")
    } catch (error) {
      const errorCode = error instanceof Error ? error.message : ""
      const isVideoStorageError =
        errorCode === KIOSK_VIDEO_STORAGE_UNAVAILABLE ||
        errorCode === KIOSK_VIDEO_SAVE_FAILED ||
        errorCode === KIOSK_VIDEO_READ_FAILED ||
        errorCode === KIOSK_VIDEO_DELETE_FAILED

      if (!isVideoStorageError && rollbackOperation) {
        try {
          if (rollbackOperation.type === "restore") {
            await saveKioskVideoBlob(rollbackOperation.assetKey, rollbackOperation.blob)
          } else {
            await deleteKioskVideoBlob(rollbackOperation.assetKey)
          }
        } catch {
          // Ignore rollback failures and surface the original error to the user.
        }
      }

      if (isVideoStorageError) {
        setFormError(getVideoStorageErrorMessage(error, activeDraft.shouldDeleteVideo ? "delete" : "save"))
      } else {
        setFormError("No se ha podido guardar la configuración. Inténtalo de nuevo.")
      }
    } finally {
      setIsSaving(false)
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
        <header className="fixed top-0 right-0 z-30 flex h-16 w-full items-center gap-2 border-b border-border/40 bg-background px-4 md:w-[calc(100%-var(--sidebar-width))] md:peer-data-[state=collapsed]:w-[calc(100%-var(--sidebar-width-icon))]">
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
                <BreadcrumbPage>Kioskos</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div aria-hidden="true" className="h-16 shrink-0" />

        <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <section className="rounded-xl border bg-card p-4 md:p-6">
            <div className="mb-6">
              <h1 className="text-lg font-semibold">Configuración de kioskos</h1>
              <p className="text-sm text-muted-foreground">
                Edita el contenido mostrado en cada tótem del tenant {tenant.name}.
              </p>
            </div>

            {!activeDraft ? (
              <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                Cargando configuración de kiosko...
              </div>
            ) : (
              <form className="flex flex-col gap-6" onSubmit={handleSaveConfig}>
                <Card>
                  <CardHeader>
                    <CardTitle>Nombre del tótem</CardTitle>
                    <CardDescription>
                      Nombre visible del kiosko seleccionado ({activeKioskLabel}).
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Input
                      value={activeDraft.name}
                      onChange={(event) => {
                        const nextValue = event.target.value
                        updateActiveDraft((current) => ({ ...current, name: nextValue }))
                        setFormError(null)
                        setSaveMessage(null)
                      }}
                      placeholder={`Nombre para ${activeKioskLabel}`}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Mensaje editable de información</CardTitle>
                    <CardDescription>
                      Mensaje que se mostrará en el kiosko para orientar al usuario.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    <textarea
                      className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      value={activeDraft.infoMessage}
                      onChange={(event) => {
                        const nextValue = event.target.value
                        updateActiveDraft((current) => ({ ...current, infoMessage: nextValue }))
                        setSaveMessage(null)
                      }}
                      placeholder="Mensaje mostrado en kiosko..."
                    />
                    <p className="text-right text-xs text-muted-foreground">
                      {activeDraft.infoMessage.length} caracteres
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Vídeo salvapantalla</CardTitle>
                    <CardDescription>
                      Sube un MP4 para mostrarlo en bucle cuando el kiosko esté inactivo.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept=".mp4,video/mp4"
                      className="hidden"
                      onChange={handleVideoInputChange}
                    />

                    <div
                      className={cn(
                        "rounded-xl border border-dashed transition-colors",
                        isDragActive
                          ? "border-primary bg-primary/5"
                          : "border-border/70 bg-muted/20"
                      )}
                      onDragEnter={(event) => {
                        event.preventDefault()
                        dragCounterRef.current += 1
                        setIsDragActive(true)
                      }}
                      onDragOver={(event) => {
                        event.preventDefault()
                        event.dataTransfer.dropEffect = "copy"
                      }}
                      onDragLeave={(event) => {
                        event.preventDefault()
                        dragCounterRef.current = Math.max(0, dragCounterRef.current - 1)

                        if (dragCounterRef.current === 0) {
                          setIsDragActive(false)
                        }
                      }}
                      onDrop={(event) => {
                        event.preventDefault()
                        dragCounterRef.current = 0
                        setIsDragActive(false)
                        handleVideoSelection(event.dataTransfer.files)
                      }}
                    >
                      {activeDraft.previewUrl ? (
                        <div className="space-y-4 p-4">
                          <div className="overflow-hidden rounded-lg border bg-black">
                            <video
                              className="aspect-video w-full"
                              src={activeDraft.previewUrl}
                              controls
                              loop
                              muted
                              playsInline
                              preload="metadata"
                            />
                          </div>
                          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {activeVideoMetadata?.fileName ?? "Vídeo cargado"}
                              </p>
                              {activeVideoMetadata?.size !== undefined && (
                                <p className="text-xs text-muted-foreground">
                                  {formatFileSize(activeVideoMetadata.size)}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button type="button" variant="outline" onClick={openVideoPicker}>
                                <Upload className="size-4" />
                                Reemplazar
                              </Button>
                              <Button type="button" variant="outline" onClick={handleRemoveVideo}>
                                <Trash2 className="size-4" />
                                Eliminar
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          role="button"
                          tabIndex={0}
                          className="flex w-full flex-col items-center justify-center gap-3 p-8 text-center"
                          onClick={openVideoPicker}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault()
                              openVideoPicker()
                            }
                          }}
                        >
                          <div className="flex size-12 items-center justify-center rounded-full border bg-background">
                            <Clapperboard className="size-5 text-muted-foreground" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium">
                              Arrastra un MP4 aquí o haz click para seleccionarlo
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Solo MP4, hasta 50MB. El vídeo se aplicará al guardar la configuración.
                            </p>
                          </div>
                          <Button type="button" variant="outline">
                            <Upload className="size-4" />
                            Seleccionar vídeo
                          </Button>
                        </div>
                      )}
                    </div>

                    {activeDraft.isVideoPreviewLoading && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <LoaderCircle className="size-4 animate-spin" />
                        Cargando preview del vídeo guardado...
                      </div>
                    )}

                    {activeDraft.pendingVideoFile && !activeDraft.shouldDeleteVideo && (
                      <p className="text-xs text-amber-700">
                        El nuevo vídeo quedará guardado cuando envíes el formulario.
                      </p>
                    )}

                    {activeDraft.shouldDeleteVideo && (
                      <p className="text-xs text-amber-700">
                        El vídeo se eliminará cuando guardes la configuración.
                      </p>
                    )}

                    {activeDraft.videoError && (
                      <p className="text-sm text-rose-600">{activeDraft.videoError}</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Lugar del tótem (coordenadas)</CardTitle>
                    <CardDescription>
                      Define latitud y longitud para posicionar el kiosko en el mapa.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="flex flex-col gap-2">
                        <label htmlFor="kiosk-latitude" className="text-sm font-medium">
                          Latitud
                        </label>
                        <Input
                          id="kiosk-latitude"
                          type="number"
                          step="any"
                          value={activeDraft.lat}
                          onChange={(event) => {
                            const nextValue = event.target.value
                            updateActiveDraft((current) => ({ ...current, lat: nextValue }))
                            setFormError(null)
                            setSaveMessage(null)
                          }}
                          placeholder="Ej. 42.5051"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label htmlFor="kiosk-longitude" className="text-sm font-medium">
                          Longitud
                        </label>
                        <Input
                          id="kiosk-longitude"
                          type="number"
                          step="any"
                          value={activeDraft.lng}
                          onChange={(event) => {
                            const nextValue = event.target.value
                            updateActiveDraft((current) => ({ ...current, lng: nextValue }))
                            setFormError(null)
                            setSaveMessage(null)
                          }}
                          placeholder="Ej. 1.5209"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {formError && <p className="text-sm text-rose-600">{formError}</p>}
                {saveMessage && <p className="text-sm text-emerald-600">{saveMessage}</p>}

                <div className="flex justify-end">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? "Guardando..." : "Guardar configuración"}
                  </Button>
                </div>
              </form>
            )}
          </section>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
