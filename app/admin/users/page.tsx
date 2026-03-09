"use client"

import { DataTable } from "@/components/admin/data-table"
import { usersColumns } from "@/components/admin/users-columns"
import { users } from "@/lib/mock-data"

export default function AdminUsersPage() {
  return (
    <section className="rounded-xl border bg-card p-4 md:p-6">
      <div className="mb-4">
        <h1 className="text-lg font-semibold">Usuarios registrados</h1>
        <p className="text-sm text-muted-foreground">
          Consulta de usuarios y acceso rápido al tenant asociado.
        </p>
      </div>

      <DataTable
        columns={usersColumns}
        data={users}
        filterColumn="name"
        filterPlaceholder="Filtrar por nombre o correo..."
      />
    </section>
  )
}
