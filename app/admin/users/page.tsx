"use client"

import { DataTable } from "@/components/admin/data-table"
import { PageSectionCard } from "@/components/shared/page-section-card"
import { usersColumns } from "@/components/admin/users-columns"
import { users } from "@/lib/mock-data"

export default function AdminUsersPage() {
  return (
    <PageSectionCard
      title="Usuarios registrados"
      description="Consulta de usuarios y acceso rápido al tenant asociado."
    >
      <DataTable
        columns={usersColumns}
        data={users}
        filterColumn="name"
        filterPlaceholder="Filtrar por nombre o correo..."
      />
    </PageSectionCard>
  )
}
