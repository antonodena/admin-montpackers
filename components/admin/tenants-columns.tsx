"use client"

import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"

import { ColumnHeader } from "@/components/admin/column-header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Tenant } from "@/lib/mock-data"

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

export const tenantsColumns: ColumnDef<Tenant>[] = [
  {
    accessorKey: "imageUrl",
    header: "Imagen",
    cell: ({ row }) => {
      const logoSrc = row.original.logoDataUrl ?? row.original.imageUrl

      return (
        <Avatar className="size-8 rounded-lg">
          <AvatarImage src={logoSrc} alt={row.original.name} />
          <AvatarFallback className="rounded-lg bg-muted text-xs">
            {initials(row.original.name)}
          </AvatarFallback>
        </Avatar>
      )
    },
    enableSorting: false,
    enableColumnFilter: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => <ColumnHeader column={column} title="Nombre del tenant" />,
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    filterFn: (row, _columnId, filterValue) => {
      const query = String(filterValue).toLowerCase().trim()
      if (!query) {
        return true
      }

      return (
        row.original.name.toLowerCase().includes(query) ||
        row.original.siteUrl.toLowerCase().includes(query)
      )
    },
  },
  {
    accessorKey: "siteUrl",
    header: ({ column }) => <ColumnHeader column={column} title="Site URL" />,
    cell: ({ row }) => (
      <a
        href={row.original.siteUrl}
        target="_blank"
        rel="noreferrer"
        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        {row.original.siteUrl}
      </a>
    ),
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <span className="sr-only">Abrir menú</span>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/tenant/${row.original.slug}`}>Acceder tenant</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/admin/tenants/${row.original.slug}`}>Ver tenant</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    enableSorting: false,
    enableColumnFilter: false,
  },
]
