"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowRight, Building2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { users } from "@/lib/mock-data"
import { useResolvedTenant } from "@/hooks/use-resolved-tenant"

export default function TenantDetailPage() {
  const params = useParams<{ tenantSlug: string }>()
  const tenant = useResolvedTenant(params.tenantSlug)

  if (!tenant) {
    return (
      <section className="rounded-xl border bg-card p-5">
        <h1 className="text-lg font-semibold">Tenant no encontrado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Este tenant no existe o no está disponible en tu navegador actual.
        </p>
        <Button asChild className="mt-4">
          <Link href="/admin/tenants">Volver a tenants</Link>
        </Button>
      </section>
    )
  }

  const tenantUsers = users.filter((user) => user.tenantSlug === tenant.slug)

  return (
    <section className="space-y-4">
      <article className="rounded-xl border bg-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Tenant</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">{tenant.name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{tenant.siteUrl}</p>
          </div>
          <Button asChild>
            <Link href={`/tenant/${tenant.slug}`}>
              Acceder tenant
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </article>

      <article className="rounded-xl border bg-card p-5">
        <div className="mb-3 flex items-center gap-2">
          <Building2 className="size-4 text-muted-foreground" />
          <h2 className="text-base font-semibold">Usuarios asociados</h2>
        </div>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {tenantUsers.map((user) => (
            <li key={user.id} className="rounded-md bg-muted/50 px-3 py-2">
              {user.name} · {user.email}
            </li>
          ))}
          {tenantUsers.length === 0 && <li>Sin usuarios asociados.</li>}
        </ul>
      </article>
    </section>
  )
}
