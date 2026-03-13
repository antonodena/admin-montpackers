"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"

import { CreateTenantModal } from "@/components/admin/create-tenant-modal"
import { DataTable } from "@/components/admin/data-table"
import { tenantsColumns } from "@/components/admin/tenants-columns"
import { Button } from "@/components/ui/button"
import { useResolvedTenants } from "@/hooks/use-resolved-tenant"

export default function AdminTenantsPage() {
  const router = useRouter()
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const allTenants = useResolvedTenants()

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setIsCreateOpen(params.get("create") === "1")
  }, [])

  function handleCreateModalOpenChange(open: boolean) {
    setIsCreateOpen(open)

    const params = new URLSearchParams(window.location.search)
    if (open) {
      params.set("create", "1")
    } else {
      params.delete("create")
    }

    const query = params.toString()
    router.replace(query ? `/admin/tenants?${query}` : "/admin/tenants", { scroll: false })
  }

  return (
    <section className="rounded-xl border bg-card p-4 md:p-6">
      <div className="mb-4">
        <h1 className="text-lg font-semibold">Tenants</h1>
        <p className="text-sm text-muted-foreground">
          Gestión multi-tenant del panel de administración.
        </p>
      </div>

      <DataTable
        columns={tenantsColumns}
        data={allTenants}
        filterColumn="name"
        filterPlaceholder="Filtrar por tenant o site URL..."
        toolbarAction={
          <Button onClick={() => handleCreateModalOpenChange(true)}>
            <Plus className="size-4" />
            Crear nuevo tenant
          </Button>
        }
      />

      <CreateTenantModal
        open={isCreateOpen}
        onOpenChange={handleCreateModalOpenChange}
        existingTenants={allTenants}
      />
    </section>
  )
}
