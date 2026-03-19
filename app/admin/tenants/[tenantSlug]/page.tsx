"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowRight, Building2 } from "lucide-react"

import { PageMessageCard } from "@/components/shared/page-message-card"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { users } from "@/lib/mock-data"
import { useResolvedTenant } from "@/hooks/use-resolved-tenant"

export default function TenantDetailPage() {
  const params = useParams<{ tenantSlug: string }>()
  const tenant = useResolvedTenant(params.tenantSlug)

  if (!tenant) {
    return (
      <PageMessageCard
        title="Tenant no encontrado"
        description="Este tenant no existe o no está disponible en tu navegador actual."
        action={
          <Button asChild>
            <Link href="/admin/tenants">Volver a tenants</Link>
          </Button>
        }
      />
    )
  }

  const tenantUsers = users.filter((user) => user.tenantSlug === tenant.slug)

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-1">
            <CardDescription>Tenant</CardDescription>
            <CardTitle className="text-2xl tracking-tight">{tenant.name}</CardTitle>
            <CardDescription>{tenant.siteUrl}</CardDescription>
          </div>
          <CardAction>
            <Button asChild>
              <Link href={`/tenant/${tenant.slug}`}>
                Acceder tenant
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </CardAction>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="size-4 text-muted-foreground" />
            <CardTitle className="text-base">Usuarios asociados</CardTitle>
          </div>
          <CardDescription>Usuarios con acceso directo a este tenant.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
          {tenantUsers.map((user) => (
            <div key={user.id} className="rounded-md border bg-muted/50 px-3 py-2">
              {user.name} · {user.email}
            </div>
          ))}
          {tenantUsers.length === 0 && <p>Sin usuarios asociados.</p>}
        </CardContent>
      </Card>
    </div>
  )
}
