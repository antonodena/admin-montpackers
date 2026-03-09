"use client"

import Link from "next/link"
import * as React from "react"
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Eye, Filter, MoreHorizontal, Pencil, Trash2 } from "lucide-react"

import { ColumnHeader } from "@/components/admin/column-header"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { POI_TYPES, type PoiLibraryItem, type PoiType } from "@/lib/poi-storage"
import { cn } from "@/lib/utils"

type PoiLibraryTableProps = {
  pois: PoiLibraryItem[]
  onRequestDeletePoi?: (poi: PoiLibraryItem) => void
  toolbarAction?: React.ReactNode
  emptyMessage?: string
  filterDialogTitle?: string
  filterDialogDescription?: string
}

type MultiSelectFilterProps<T extends string> = {
  label: string
  options: readonly T[]
  selected: T[]
  onChange: (next: T[]) => void
}

function MultiSelectFilter<T extends string>({
  label,
  options,
  selected,
  onChange,
}: MultiSelectFilterProps<T>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <span>{label}</span>
          {selected.length > 0 && (
            <span className="text-muted-foreground">({selected.length})</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option}
            checked={selected.includes(option)}
            onCheckedChange={(checked) => {
              const isChecked = checked === true

              if (isChecked) {
                onChange(Array.from(new Set([...selected, option])))
                return
              }

              onChange(selected.filter((item) => item !== option))
            }}
          >
            {option}
          </DropdownMenuCheckboxItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => onChange([])}>Limpiar</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function includesOrAll<T>(selected: T[], current: T) {
  if (selected.length === 0) {
    return true
  }

  return selected.includes(current)
}

function getColumnResponsiveClass(columnId: string) {
  switch (columnId) {
    case "coverImageUrl":
      return "hidden lg:table-cell"
    case "subtype":
      return "hidden md:table-cell"
    default:
      return ""
  }
}

export function PoiLibraryTable({
  pois,
  onRequestDeletePoi,
  toolbarAction,
  emptyMessage = "Sin POIs para los filtros seleccionados.",
  filterDialogTitle = "Filtros de biblioteca de POIs",
  filterDialogDescription = "Busca y filtra POIs por categoría y términos editoriales.",
}: PoiLibraryTableProps) {
  const [isFiltersDialogOpen, setIsFiltersDialogOpen] = React.useState(false)
  const [searchText, setSearchText] = React.useState("")
  const [selectedTypes, setSelectedTypes] = React.useState<PoiType[]>([])
  const [sorting, setSorting] = React.useState<SortingState>([])

  const filteredPois = React.useMemo(() => {
    const query = searchText.trim().toLowerCase()

    return pois.filter((poi) => {
      const matchesSearch =
        query.length === 0 ||
        poi.name.toLowerCase().includes(query) ||
        poi.type.toLowerCase().includes(query) ||
        poi.subtype.toLowerCase().includes(query)

      const matchesType = includesOrAll(selectedTypes, poi.type)

      return matchesSearch && matchesType
    })
  }, [pois, searchText, selectedTypes])

  const columns = React.useMemo<ColumnDef<PoiLibraryItem>[]>(
    () => [
      {
        accessorKey: "coverImageUrl",
        header: "Portada",
        cell: ({ row }) => (
          <div className="h-12 w-20 overflow-hidden rounded-md border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={row.original.coverImageUrl}
              alt={row.original.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "name",
        header: ({ column }) => <ColumnHeader column={column} title="Nombre" />,
        cell: ({ row }) => (
          <span className="block max-w-[240px] truncate font-medium">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "type",
        header: ({ column }) => <ColumnHeader column={column} title="Tipo" />,
      },
      {
        accessorKey: "subtype",
        header: ({ column }) => <ColumnHeader column={column} title="Subtipo" />,
        cell: ({ row }) => (
          <span className="block max-w-[220px] truncate text-muted-foreground">
            {row.original.subtype}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Acciones",
        enableSorting: false,
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
                <Link href={`/admin/pois/${row.original.id}`}>
                  <Eye className="size-4" />
                  Ver POI
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/admin/pois/${row.original.id}/edit`}>
                  <Pencil className="size-4" />
                  Editar POI
                </Link>
              </DropdownMenuItem>
              {onRequestDeletePoi && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={(event) => {
                      event.preventDefault()
                      onRequestDeletePoi(row.original)
                    }}
                  >
                    <Trash2 className="size-4" />
                    Eliminar POI
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [onRequestDeletePoi]
  )

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filteredPois,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  React.useEffect(() => {
    table.setPageIndex(0)
  }, [searchText, selectedTypes, table])

  const pageCount = table.getPageCount()
  const currentPage = table.getState().pagination.pageIndex

  const hasActiveFilters = searchText.trim().length > 0 || selectedTypes.length > 0

  const appliedFilterLabels = React.useMemo(() => {
    const labels: string[] = []
    const query = searchText.trim()

    if (query.length > 0) {
      labels.push(`Búsqueda: ${query}`)
    }

    for (const type of selectedTypes) {
      labels.push(`Tipo: ${type}`)
    }

    return labels
  }, [searchText, selectedTypes])

  function clearAllFilters() {
    setSearchText("")
    setSelectedTypes([])
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          onClick={() => setIsFiltersDialogOpen(true)}
          className="justify-start"
        >
          <Filter className="size-4" />
          Filtros
          {appliedFilterLabels.length > 0 && (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
              {appliedFilterLabels.length}
            </span>
          )}
        </Button>

        <Button variant="outline" disabled={!hasActiveFilters} onClick={clearAllFilters}>
          Limpiar filtros
        </Button>

        {toolbarAction ? <div className="sm:ml-auto">{toolbarAction}</div> : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Filtros aplicados</span>
        {appliedFilterLabels.length > 0 ? (
          appliedFilterLabels.map((label, index) => (
            <span
              key={`${label}-${index}`}
              className="inline-flex items-center rounded-md border bg-muted px-2 py-1 text-xs"
            >
              {label}
            </span>
          ))
        ) : (
          <span className="text-xs text-muted-foreground">Ninguno</span>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(getColumnResponsiveClass(header.column.id))}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(getColumnResponsiveClass(cell.column.id))}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Mostrando {table.getRowModel().rows.length} de {filteredPois.length} POIs filtrados.
        </p>
        <Pagination className="mx-0 w-auto justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(event) => {
                  event.preventDefault()
                  table.previousPage()
                }}
                className={
                  !table.getCanPreviousPage() ? "pointer-events-none opacity-50" : undefined
                }
              />
            </PaginationItem>

            {Array.from({ length: pageCount }).map((_, index) => (
              <PaginationItem key={index}>
                <PaginationLink
                  href="#"
                  isActive={index === currentPage}
                  onClick={(event) => {
                    event.preventDefault()
                    table.setPageIndex(index)
                  }}
                >
                  {index + 1}
                </PaginationLink>
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(event) => {
                  event.preventDefault()
                  table.nextPage()
                }}
                className={!table.getCanNextPage() ? "pointer-events-none opacity-50" : undefined}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      <Dialog open={isFiltersDialogOpen} onOpenChange={setIsFiltersDialogOpen}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{filterDialogTitle}</DialogTitle>
            <DialogDescription>{filterDialogDescription}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="poi-search-filter">
                Buscar por nombre, tipo o subtipo
              </label>
              <Input
                id="poi-search-filter"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Ej: Mirador, hotel boutique, restaurante..."
              />
            </div>

            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              <MultiSelectFilter
                label="Tipo"
                options={POI_TYPES}
                selected={selectedTypes}
                onChange={setSelectedTypes}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={clearAllFilters}>
              Resetear
            </Button>
            <DialogClose asChild>
              <Button>Cerrar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
