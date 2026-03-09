"use client"

import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"

import { ColumnHeader } from "@/components/admin/column-header"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { AdminUser } from "@/lib/mock-data"

export const usersColumns: ColumnDef<AdminUser>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <ColumnHeader column={column} title="Nombre" />,
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    filterFn: (row, _columnId, filterValue) => {
      const query = String(filterValue).toLowerCase().trim()
      if (!query) {
        return true
      }

      return (
        row.original.name.toLowerCase().includes(query) ||
        row.original.email.toLowerCase().includes(query)
      )
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => <ColumnHeader column={column} title="Correo" />,
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.original.email}</span>
    ),
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menú</span>
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/admin/tenants/${row.original.tenantSlug}`}>Ver tenant</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/tenant/${row.original.tenantSlug}`}>Acceder tenant</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    enableSorting: false,
    enableColumnFilter: false,
  },
]
