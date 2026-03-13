"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { RouteCreateScreen } from "@/components/routes/route-create-screen"
import { useResolvedTenants } from "@/hooks/use-resolved-tenant"
import type { RouteLibraryItem } from "@/lib/routes-data"

export default function NewRoutePage() {
  const router = useRouter()
  const allTenants = useResolvedTenants()

  function handleCreated(route: RouteLibraryItem) {
    router.push(`/admin/routes/${route.id}`)
  }

  return (
    <section className="min-w-0">
      <RouteCreateScreen
        mode="admin"
        cancelHref="/admin/routes"
        tenants={allTenants}
        onCreated={handleCreated}
      />
    </section>
  )
}
