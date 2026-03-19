"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import * as React from "react"
import {
  ArrowLeft,
  Blocks,
  Building2,
  CalendarDays,
  Bell,
  ChevronsUpDown,
  Ellipsis,
  Globe,
  Home,
  LifeBuoy,
  MapPin,
  Mountain,
  Navigation,
  Palette,
  PanelsTopLeft,
  Plus,
  Route,
  Search,
  Settings,
  Smartphone,
  Users,
  UserRoundCog,
  type LucideIcon,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { useResolvedTenant } from "@/hooks/use-resolved-tenant"
import {
  getTenantSettingsRecord,
  TENANT_SETTINGS_UPDATED_EVENT,
} from "@/lib/tenant-settings-storage"
import { users } from "@/lib/mock-data"

type MenuItem = {
  title: string
  icon: LucideIcon
  href?: string
  isActive?: boolean
}

const kiosks = [
  { id: "hall" as const, title: "Hall" },
  { id: "recepcion" as const, title: "Recepción" },
]

const supportMenu: MenuItem[] = [
  { title: "Ayuda y soporte", icon: LifeBuoy },
]

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  mode?: "main" | "settings"
  tenantName?: string
  tenantSlug?: string
}

export function AppSidebar({
  mode = "main",
  tenantName = "Hotel Taüll",
  tenantSlug = "hotel-taull",
  ...props
}: AppSidebarProps) {
  const pathname = usePathname()
  const resolvedTenant = useResolvedTenant(tenantSlug)
  const tenantBasePath = `/tenant/${tenantSlug}`
  const kioskBasePath = `${tenantBasePath}/kiosks`
  const modulesBasePath = `${tenantBasePath}/modules`
  const poisBasePath = `${tenantBasePath}/pois`
  const settingsBasePath = `${tenantBasePath}/settings`
  const isKioskSectionActive =
    pathname === kioskBasePath || pathname.startsWith(`${kioskBasePath}/`)
  const isModulesSectionActive =
    pathname === modulesBasePath || pathname.startsWith(`${modulesBasePath}/`)
  const isPoisSectionActive = pathname === poisBasePath || pathname.startsWith(`${poisBasePath}/`)
  const isSettingsSectionActive =
    pathname === settingsBasePath || pathname.startsWith(`${settingsBasePath}/`)

  const [profile, setProfile] = React.useState(() => ({
    displayName: "Anton Òdena",
    username: "anton",
  }))

  React.useEffect(() => {
    if (!resolvedTenant) {
      return
    }

    const tenant = resolvedTenant

    function syncProfile() {
      const settings = getTenantSettingsRecord(
        tenant,
        users.filter((user) => user.tenantSlug === tenant.slug)
      )
      setProfile({
        displayName: settings.account.displayName,
        username: settings.account.username,
      })
    }

    syncProfile()
    window.addEventListener(TENANT_SETTINGS_UPDATED_EVENT, syncProfile as EventListener)
    window.addEventListener("storage", syncProfile)

    return () => {
      window.removeEventListener(TENANT_SETTINGS_UPDATED_EVENT, syncProfile as EventListener)
      window.removeEventListener("storage", syncProfile)
    }
  }, [resolvedTenant])

  const displayTenantName = resolvedTenant?.name ?? tenantName
  const displayTenantLogo = resolvedTenant?.logoDataUrl ?? resolvedTenant?.imageUrl
  const displayTenantColor = resolvedTenant?.brandColor ?? "#962f2f"
  const tenantInitials = displayTenantName
    .split(" ")
    .slice(0, 2)
    .map((chunk) => chunk[0])
    .join("")
    .toUpperCase()

  const mainMenu: MenuItem[] = [
    { title: "Inicio", href: tenantBasePath, icon: Home, isActive: pathname === tenantBasePath },
    { title: "Buscar", icon: Search },
    {
      title: "Rutas",
      href: `${tenantBasePath}/routes`,
      icon: Route,
      isActive:
        pathname === `${tenantBasePath}/routes` ||
        pathname.startsWith(`${tenantBasePath}/routes/`),
    },
    {
      title: "Puntos de interés",
      href: poisBasePath,
      icon: MapPin,
      isActive: isPoisSectionActive,
    },
    { title: "Eventos", icon: CalendarDays },
    { title: "Instalaciones", icon: Smartphone },
    { title: "Navegación", icon: Navigation },
    { title: "Páginas verticales", icon: PanelsTopLeft },
    {
      title: "Módulos",
      href: modulesBasePath,
      icon: Blocks,
      isActive: isModulesSectionActive,
    },
    { title: "Kioskos", href: kioskBasePath, icon: Smartphone, isActive: isKioskSectionActive },
  ]
  const settingsMenu: MenuItem[] = [
    {
      title: "Volver al menú principal",
      href: tenantBasePath,
      icon: ArrowLeft,
    },
    {
      title: "General",
      href: `${settingsBasePath}/general`,
      icon: Building2,
      isActive: pathname === `${settingsBasePath}/general`,
    },
    {
      title: "Apariencia",
      href: `${settingsBasePath}/appearance`,
      icon: Palette,
      isActive: pathname === `${settingsBasePath}/appearance`,
    },
    {
      title: "Dominios",
      href: `${settingsBasePath}/domains`,
      icon: Globe,
      isActive: pathname === `${settingsBasePath}/domains`,
    },
    {
      title: "Usuario y contraseña",
      href: `${settingsBasePath}/account`,
      icon: UserRoundCog,
      isActive: pathname === `${settingsBasePath}/account`,
    },
    {
      title: "Equipo",
      href: `${settingsBasePath}/team`,
      icon: Users,
      isActive: pathname === `${settingsBasePath}/team`,
    },
    {
      title: "Notificaciones",
      href: `${settingsBasePath}/notifications`,
      icon: Bell,
      isActive: pathname === `${settingsBasePath}/notifications`,
    },
  ]
  const footerMenu: MenuItem[] = [
    ...supportMenu,
    {
      title: "Configuración",
      href: `${settingsBasePath}/general`,
      icon: Settings,
      isActive: isSettingsSectionActive,
    },
  ]

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="h-16 justify-center border-b border-sidebar-border">
        <div className="flex items-center gap-1">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div
              className="flex aspect-square size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg text-white"
              style={{ backgroundColor: displayTenantColor }}
            >
              {displayTenantLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={displayTenantLogo}
                  alt={displayTenantName}
                  className="size-full object-cover"
                />
              ) : (
                <Mountain className="size-4" />
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-semibold leading-tight">
                {displayTenantName}
              </span>
              {mode === "settings" && (
                <span className="truncate text-xs text-muted-foreground">Ajustes del tenant</span>
              )}
            </div>
            <ChevronsUpDown className="ml-auto size-4" />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {mode === "settings" ? (
          <SidebarGroup>
            <SidebarGroupLabel>Ajustes</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {settingsMenu.map((item, index) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={item.isActive}
                      tooltip={item.title}
                      className={index === 0 ? "mb-2" : undefined}
                    >
                      <Link href={item.href ?? "#"}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          <>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {mainMenu.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      {item.href ? (
                        <SidebarMenuButton asChild isActive={item.isActive} tooltip={item.title}>
                          <Link href={item.href}>
                            <item.icon />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      ) : (
                        <SidebarMenuButton disabled tooltip={item.title}>
                          <item.icon />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      )}
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>kioskos</SidebarGroupLabel>
              <SidebarGroupAction aria-label="Agregar kiosko" title="Agregar kiosko">
                <Plus />
              </SidebarGroupAction>
              <SidebarGroupContent>
                <SidebarMenu>
                  {kiosks.map((kiosk) => (
                    <SidebarMenuItem key={kiosk.title}>
                      <SidebarMenuButton asChild>
                        <Link href={`${kioskBasePath}?kiosk=${kiosk.id}`}>
                          <span>{kiosk.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isKioskSectionActive}>
                      <Link href={kioskBasePath}>
                        <Ellipsis />
                        <span>Ver todas</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          {footerMenu.map((item) => (
            <SidebarMenuItem key={item.title}>
              {item.href ? (
                <SidebarMenuButton asChild isActive={item.isActive}>
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              ) : (
                <SidebarMenuButton disabled>
                  <item.icon />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        <SidebarSeparator className="my-3" />

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="size-8 rounded-lg">
                <AvatarImage src="" alt={profile.displayName} />
                <AvatarFallback className="rounded-lg bg-muted text-foreground">
                  {profile.displayName
                    .split(" ")
                    .slice(0, 2)
                    .map((chunk) => chunk[0])
                    .join("")
                    .toUpperCase() || tenantInitials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{profile.displayName}</span>
                <span className="truncate text-xs text-muted-foreground">@{profile.username}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
