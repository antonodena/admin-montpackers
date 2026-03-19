"use client"

import { useRouter } from "next/navigation"

import { PoiCreateScreen } from "@/components/pois/poi-create-screen"
import { useResolvedTenants } from "@/hooks/use-resolved-tenant"
import type { PoiLibraryItem } from "@/lib/poi-storage"

export default function NewPoiPage() {
  const router = useRouter()
  const allTenants = useResolvedTenants()

  function handleCreated(poi: PoiLibraryItem) {
    router.push(`/admin/pois/${poi.id}`)
  }

  return (
    <section className="min-w-0">
      <PoiCreateScreen
        mode="admin"
        cancelHref="/admin/pois"
        tenants={allTenants}
        onCreated={handleCreated}
      />
    </section>
  )
}
