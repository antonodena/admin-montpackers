"use client"

import * as React from "react"
import {
  BellRing,
  Building2,
  Check,
  Copy,
  Globe,
  Palette,
  ShieldCheck,
  Upload,
  UserRoundCog,
  Users,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldTitle,
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
import { Textarea } from "@/components/ui/textarea"
import { useTenantSettings } from "@/hooks/use-tenant-settings"
import { getTenantAssetAccept } from "@/lib/tenant-form"
import { cn } from "@/lib/utils"

type SectionProps = {
  tenantSlug: string
}

function initials(value: string) {
  return value
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

function SectionFeedback({
  error,
  success,
}: {
  error: string | null
  success: string | null
}) {
  if (!error && !success) {
    return null
  }

  const isError = Boolean(error)
  return (
    <div
      className={cn(
        "rounded-md border px-3 py-2 text-sm",
        isError
          ? "border-destructive/30 bg-destructive/5 text-destructive"
          : "border-primary/20 bg-primary/5 text-primary"
      )}
    >
      {error ?? success}
    </div>
  )
}

function SectionActions({
  onSave,
  onReset,
  disableSave,
  disableReset,
  isSaving,
  feedback,
}: {
  onSave: () => unknown
  onReset: () => void
  disableSave?: boolean
  disableReset?: boolean
  isSaving?: boolean
  feedback: { error: string | null; success: string | null }
}) {
  return (
    <div className="flex flex-col gap-3">
      <SectionFeedback error={feedback.error} success={feedback.success} />
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onReset} disabled={disableReset}>
          Restablecer
        </Button>
        <Button onClick={() => void onSave()} disabled={disableSave}>
          {isSaving ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>
    </div>
  )
}

export function TenantGeneralSettingsSection({ tenantSlug }: SectionProps) {
  const { tenant, general, savingSection } = useTenantSettings(tenantSlug)

  if (!tenant || !general.values) {
    return null
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 />
            General
          </CardTitle>
          <CardDescription>
            Gestiona la identidad principal del hotel y el idioma del panel administrativo.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Datos del hotel</CardTitle>
          <CardDescription>
            Estos cambios afectan al nombre visible del tenant en el panel.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <FieldGroup>
            <Field data-invalid={general.feedback.error ? true : undefined}>
              <FieldLabel htmlFor="hotel-name">Nombre del hotel</FieldLabel>
              <Input
                id="hotel-name"
                value={general.values.hotelName}
                aria-invalid={general.feedback.error ? true : undefined}
                onChange={(event) => general.setField("hotelName", event.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="hotel-description">Descripción</FieldLabel>
              <Textarea
                id="hotel-description"
                value={general.values.description}
                onChange={(event) => general.setField("description", event.target.value)}
                placeholder="Describe brevemente la propuesta del hotel."
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="hotel-address">Dirección del hotel</FieldLabel>
              <Textarea
                id="hotel-address"
                value={general.values.address}
                onChange={(event) => general.setField("address", event.target.value)}
                placeholder="Calle, ciudad, provincia y código postal."
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="admin-language">Idioma del admin</FieldLabel>
              <Select
                value={general.values.adminLanguage}
                onValueChange={(value) =>
                  general.setField("adminLanguage", value as "es" | "ca" | "en")
                }
              >
                <SelectTrigger id="admin-language" className="w-full">
                  <SelectValue placeholder="Selecciona idioma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="ca">Català</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 border-t">
          <SectionActions
            onSave={general.save}
            onReset={general.reset}
            disableReset={!general.dirty}
            disableSave={!general.dirty}
            isSaving={savingSection === "general"}
            feedback={general.feedback}
          />
        </CardFooter>
      </Card>
    </div>
  )
}

export function TenantAppearanceSettingsSection({ tenantSlug }: SectionProps) {
  const { tenant, appearance, savingSection } = useTenantSettings(tenantSlug)

  if (!tenant) {
    return null
  }

  const logoSrc = appearance.values.logoDataUrl || tenant.logoDataUrl || tenant.imageUrl
  const faviconSrc = appearance.values.faviconDataUrl || tenant.faviconDataUrl

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_360px]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette />
            Apariencia
          </CardTitle>
          <CardDescription>
            Ajusta la identidad visual del tenant y cómo se presenta en el panel.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <FieldGroup>
            <Field data-invalid={appearance.values.logoError ? true : undefined}>
              <FieldLabel htmlFor="tenant-logo">Logo</FieldLabel>
              <Input
                id="tenant-logo"
                type="file"
                accept={getTenantAssetAccept("logo")}
                aria-invalid={appearance.values.logoError ? true : undefined}
                onChange={(event) =>
                  void appearance.handleAssetUpload("logo", event.target.files)
                }
              />
              <FieldDescription>PNG, JPG, JPEG o SVG. Máximo 2MB.</FieldDescription>
              <FieldError>{appearance.values.logoError}</FieldError>
            </Field>

            <Field data-invalid={appearance.values.faviconError ? true : undefined}>
              <FieldLabel htmlFor="tenant-favicon">Favicon</FieldLabel>
              <Input
                id="tenant-favicon"
                type="file"
                accept={getTenantAssetAccept("favicon")}
                aria-invalid={appearance.values.faviconError ? true : undefined}
                onChange={(event) =>
                  void appearance.handleAssetUpload("favicon", event.target.files)
                }
              />
              <FieldDescription>ICO, PNG o SVG. Máximo 512KB.</FieldDescription>
              <FieldError>{appearance.values.faviconError}</FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="tenant-brand-color">Color del tenant</FieldLabel>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  id="tenant-brand-color-picker"
                  type="color"
                  className="h-11 w-full shrink-0 sm:w-18"
                  value={appearance.values.brandColor}
                  onChange={(event) =>
                    appearance.setField("brandColor", event.target.value.toUpperCase())
                  }
                />
                <Input
                  id="tenant-brand-color"
                  value={appearance.values.brandColor}
                  onChange={(event) =>
                    appearance.setField("brandColor", event.target.value.toUpperCase())
                  }
                />
              </div>
              <FieldDescription>Usa un color HEX de 6 dígitos.</FieldDescription>
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 border-t">
          <SectionActions
            onSave={appearance.save}
            onReset={appearance.reset}
            disableReset={!appearance.dirty}
            disableSave={!appearance.dirty}
            isSaving={savingSection === "appearance"}
            feedback={appearance.feedback}
          />
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>Vista rápida del branding aplicado al tenant.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div
            className="rounded-2xl p-5 text-white"
            style={{ backgroundColor: appearance.values.brandColor }}
          >
            <div className="flex items-center gap-3">
              <Avatar className="size-14 rounded-2xl border border-white/20 bg-white/10">
                <AvatarImage src={logoSrc} alt={tenant.name} />
                <AvatarFallback className="rounded-2xl bg-white/15 text-white">
                  {initials(tenant.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold">{tenant.name}</p>
                <p className="truncate text-sm text-white/80">{tenant.siteUrl}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-muted/20 p-4">
            <p className="text-sm font-medium">Favicon</p>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-xl border bg-background">
                {faviconSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={faviconSrc} alt="Favicon" className="size-6 object-contain" />
                ) : (
                  <Upload className="text-muted-foreground" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Se usará en pestañas del navegador y accesos rápidos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function TenantDomainsSettingsSection({ tenantSlug }: SectionProps) {
  const { domainData } = useTenantSettings(tenantSlug)
  const [copiedField, setCopiedField] = React.useState<string | null>(null)

  const handleCopy = React.useCallback(async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedField(key)
      window.setTimeout(() => setCopiedField(null), 1600)
    } catch {
      setCopiedField(null)
    }
  }, [])

  if (!domainData) {
    return null
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe />
            Dominios
          </CardTitle>
          <CardDescription>
            Información de publicación del tenant. El slug y el subdominio son solo lectura en esta versión.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="tenant-slug">Slug</FieldLabel>
              <Input id="tenant-slug" value={domainData.slug} readOnly />
            </Field>

            <Field>
              <FieldLabel htmlFor="tenant-url">URL del subdominio</FieldLabel>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input id="tenant-url" value={domainData.siteUrl} readOnly />
                <Button
                  variant="outline"
                  onClick={() => void handleCopy("siteUrl", domainData.siteUrl)}
                >
                  {copiedField === "siteUrl" ? <Check /> : <Copy />}
                  Copiar URL
                </Button>
              </div>
            </Field>

            <Field>
              <FieldLabel htmlFor="tenant-iframe">Embeded / iframe</FieldLabel>
              <Textarea
                id="tenant-iframe"
                value={domainData.iframeSnippet}
                readOnly
                className="min-h-28 font-mono text-xs"
              />
              <FieldDescription>
                Snippet generado a partir del `siteUrl` actual del tenant.
              </FieldDescription>
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-end border-t">
          <Button
            variant="outline"
            onClick={() => void handleCopy("iframeSnippet", domainData.iframeSnippet)}
          >
            {copiedField === "iframeSnippet" ? <Check /> : <Copy />}
            Copiar iframe
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export function TenantAccountSettingsSection({ tenantSlug }: SectionProps) {
  const { account, savingSection } = useTenantSettings(tenantSlug)

  if (!account.values) {
    return null
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserRoundCog />
            Usuario y contraseña
          </CardTitle>
          <CardDescription>
            Gestiona tu perfil local de administración dentro de este tenant.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
          <CardDescription>Estos datos alimentan el footer y la identidad del usuario actual.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <FieldGroup>
            <Field data-invalid={account.feedback.error ? true : undefined}>
              <FieldLabel htmlFor="account-display-name">Nombre</FieldLabel>
              <Input
                id="account-display-name"
                value={account.values.displayName}
                aria-invalid={account.feedback.error ? true : undefined}
                onChange={(event) => account.setField("displayName", event.target.value)}
              />
            </Field>

            <Field data-invalid={account.feedback.error ? true : undefined}>
              <FieldLabel htmlFor="account-username">Usuario</FieldLabel>
              <Input
                id="account-username"
                value={account.values.username}
                aria-invalid={account.feedback.error ? true : undefined}
                onChange={(event) => account.setField("username", event.target.value)}
              />
              <FieldDescription>
                Usa entre 3 y 32 caracteres con letras, números, punto, guion o guion bajo.
              </FieldDescription>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Seguridad</CardTitle>
          <CardDescription>
            La contraseña es local al navegador en esta iteración y no se conecta a autenticación real.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <FieldGroup>
            <Field data-invalid={account.feedback.error ? true : undefined}>
              <FieldLabel htmlFor="new-password">Nueva contraseña</FieldLabel>
              <Input
                id="new-password"
                type="password"
                value={account.values.newPassword}
                aria-invalid={account.feedback.error ? true : undefined}
                onChange={(event) => account.setField("newPassword", event.target.value)}
              />
            </Field>

            <Field data-invalid={account.feedback.error ? true : undefined}>
              <FieldLabel htmlFor="confirm-password">Confirmar contraseña</FieldLabel>
              <Input
                id="confirm-password"
                type="password"
                value={account.values.confirmPassword}
                aria-invalid={account.feedback.error ? true : undefined}
                onChange={(event) => account.setField("confirmPassword", event.target.value)}
              />
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 border-t">
          <SectionActions
            onSave={account.save}
            onReset={account.reset}
            disableReset={!account.dirty}
            disableSave={!account.dirty}
            isSaving={savingSection === "account"}
            feedback={account.feedback}
          />
        </CardFooter>
      </Card>
    </div>
  )
}

export function TenantTeamSettingsSection({ tenantSlug }: SectionProps) {
  const { team, savingSection } = useTenantSettings(tenantSlug)

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users />
            Equipo
          </CardTitle>
          <CardDescription>
            Revisa quién tiene acceso al tenant y gestiona invitaciones o roles.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invitar miembro</CardTitle>
          <CardDescription>
            La invitación se mantiene localmente y se registrará como pendiente hasta guardar.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <FieldGroup>
            <FieldGroup className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="invite-name">Nombre</FieldLabel>
                <Input
                  id="invite-name"
                  value={team.invite.name}
                  onChange={(event) => team.setInviteField("name", event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="invite-email">Correo</FieldLabel>
                <Input
                  id="invite-email"
                  type="email"
                  value={team.invite.email}
                  onChange={(event) => team.setInviteField("email", event.target.value)}
                />
              </Field>
            </FieldGroup>

            <Field>
              <FieldLabel htmlFor="invite-role">Rol</FieldLabel>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Select
                  value={team.invite.role}
                  onValueChange={(value) =>
                    team.setInviteField("role", value as "owner" | "admin" | "viewer")
                  }
                >
                  <SelectTrigger id="invite-role" className="w-full">
                    <SelectValue placeholder="Selecciona rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={team.inviteMember}>
                  Añadir al borrador
                </Button>
              </div>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Miembros con acceso</CardTitle>
          <CardDescription>Roles y estado de acceso al tenant.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {team.values.map((member) => (
            <div
              key={member.id}
              className="flex flex-col gap-4 rounded-xl border p-4 lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar className="size-11">
                  <AvatarFallback>{initials(member.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-medium">{member.name}</p>
                  <p className="truncate text-sm text-muted-foreground">{member.email}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ShieldCheck />
                  <span>{member.status === "pending" ? "Pendiente" : "Activo"}</span>
                </div>
                <Select
                  value={member.role}
                  onValueChange={(value) =>
                    team.updateMember(member.id, {
                      role: value as "owner" | "admin" | "viewer",
                    })
                  }
                >
                  <SelectTrigger className="w-full min-w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => team.removeMember(member.id)}>
                  Quitar acceso
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
        <CardFooter className="flex flex-col gap-3 border-t">
          <SectionActions
            onSave={team.save}
            onReset={team.reset}
            disableReset={!team.dirty}
            disableSave={!team.dirty}
            isSaving={savingSection === "team"}
            feedback={team.feedback}
          />
        </CardFooter>
      </Card>
    </div>
  )
}

export function TenantNotificationsSettingsSection({ tenantSlug }: SectionProps) {
  const { notifications, savingSection } = useTenantSettings(tenantSlug)

  if (!notifications.values) {
    return null
  }

  const notificationValues = notifications.values

  const items = [
    {
      key: "newRoutesAvailable" as const,
      title: "Nuevas rutas disponibles",
      description: "Aviso cuando haya nuevas rutas asignables o publicadas para este tenant.",
    },
    {
      key: "assignedRouteUpdates" as const,
      title: "Cambios en rutas asignadas",
      description: "Notifica modificaciones relevantes en rutas ya disponibles en el tenant.",
    },
    {
      key: "kioskIncidents" as const,
      title: "Incidencias de kioskos",
      description: "Recibe avisos cuando un kiosko pierda configuración o presente incidencias.",
    },
    {
      key: "teamAccessChanges" as const,
      title: "Invitaciones y cambios de acceso",
      description: "Avisa de altas, bajas o cambios de rol dentro del equipo.",
    },
    {
      key: "weeklySummary" as const,
      title: "Resumen semanal",
      description: "Agrupa actividad y cambios importantes en un resumen de periodicidad semanal.",
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellRing />
            Notificaciones
          </CardTitle>
          <CardDescription>
            Configura qué tipos de aviso quieres mantener activos para este tenant.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <FieldSet>
            {items.map((item) => (
              <Field key={item.key} orientation="horizontal">
                <Checkbox
                  checked={notificationValues[item.key]}
                  onCheckedChange={() => notifications.toggle(item.key)}
                />
                <FieldContent>
                  <FieldTitle>{item.title}</FieldTitle>
                  <FieldDescription>{item.description}</FieldDescription>
                </FieldContent>
              </Field>
            ))}
          </FieldSet>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 border-t">
          <SectionActions
            onSave={notifications.save}
            onReset={notifications.reset}
            disableReset={!notifications.dirty}
            disableSave={!notifications.dirty}
            isSaving={savingSection === "notifications"}
            feedback={notifications.feedback}
          />
        </CardFooter>
      </Card>
    </div>
  )
}
