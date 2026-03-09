"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Blocks,
  CalendarDays,
  ChevronsUpDown,
  Ellipsis,
  Home,
  LifeBuoy,
  MapPin,
  Mountain,
  Navigation,
  PanelsTopLeft,
  Plus,
  Route,
  Search,
  Settings,
  Smartphone,
  type LucideIcon,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
  { title: "Configuración", icon: Settings },
]

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  tenantName?: string
  tenantSlug?: string
}

export function AppSidebar({
  tenantName = "Hotel Taüll",
  tenantSlug = "hotel-taull",
  ...props
}: AppSidebarProps) {
  const pathname = usePathname()
  const tenantBasePath = `/tenant/${tenantSlug}`
  const kioskBasePath = `${tenantBasePath}/kiosks`
  const isKioskSectionActive =
    pathname === kioskBasePath || pathname.startsWith(`${kioskBasePath}/`)

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
    { title: "Puntos de interés", icon: MapPin },
    { title: "Eventos", icon: CalendarDays },
    { title: "Instalaciones", icon: Smartphone },
    { title: "Navegación", icon: Navigation },
    { title: "Páginas verticales", icon: PanelsTopLeft },
    { title: "Modulos", icon: Blocks },
    { title: "Kioskos", href: kioskBasePath, icon: Smartphone, isActive: isKioskSectionActive },
  ]

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="h-16 justify-center border-b border-sidebar-border">
        <div className="flex items-center gap-1">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-[#962f2f] text-white">
              <Mountain className="size-4" />
            </div>
            <span className="truncate text-sm font-semibold leading-tight">{tenantName}</span>
            <ChevronsUpDown className="ml-auto size-4" />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
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
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          {supportMenu.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton disabled>
                <item.icon />
                <span>{item.title}</span>
              </SidebarMenuButton>
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
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="rounded-lg bg-violet-100 text-violet-700">
                  AÖ
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Anton Òdena</span>
                <span className="truncate text-xs text-muted-foreground">
                  anton@montpackers.com
                </span>
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
