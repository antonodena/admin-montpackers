"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import * as React from "react"

import { AdminSidebar } from "@/components/admin/admin-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { getTenantBySlug } from "@/lib/mock-data"
import { getRouteById } from "@/lib/route-storage"

type Crumb = {
  label: string
  href?: string
}

function getBreadcrumbs(pathname: string): Crumb[] {
  const crumbs: Crumb[] = [{ label: "Admin panel", href: "/admin/tenants" }]

  if (pathname.startsWith("/admin/tenants")) {
    crumbs.push({ label: "Tenants", href: "/admin/tenants" })
    const tenantSlug = pathname.split("/")[3]
    if (tenantSlug) {
      if (tenantSlug === "new") {
        crumbs.push({ label: "Nuevo tenant" })
        return crumbs
      }
      const tenant = getTenantBySlug(tenantSlug)
      crumbs.push({ label: tenant?.name ?? tenantSlug })
    }
    return crumbs
  }

  if (pathname.startsWith("/admin/users")) {
    crumbs.push({ label: "Usuarios" })
    return crumbs
  }

  if (pathname.startsWith("/admin/routes")) {
    crumbs.push({ label: "Biblioteca de rutas", href: "/admin/routes" })
    const routeId = pathname.split("/")[3]
    const action = pathname.split("/")[4]
    if (routeId) {
      if (routeId === "new") {
        crumbs.push({ label: "Nueva ruta" })
        return crumbs
      }
      const route = getRouteById(routeId)
      crumbs.push({ label: route?.name ?? routeId, href: `/admin/routes/${routeId}` })
      if (action === "edit") {
        crumbs.push({ label: "Editar ruta" })
      }
    }
    return crumbs
  }

  return crumbs
}

type AdminShellProps = {
  children: React.ReactNode
}

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname()
  const breadcrumbs = getBreadcrumbs(pathname)

  return (
    <SidebarProvider defaultOpen>
      <AdminSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border/40 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />

          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1

                return (
                  <React.Fragment key={`${crumb.label}-${index}`}>
                    <BreadcrumbItem className={index === 0 ? "hidden md:block" : undefined}>
                      {isLast || !crumb.href ? (
                        <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link href={crumb.href}>{crumb.label}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {!isLast && (
                      <BreadcrumbSeparator
                        className={index === 0 ? "hidden md:block" : undefined}
                      />
                    )}
                  </React.Fragment>
                )
              })}
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
