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
import { Badge } from "@/components/ui/badge"
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
import { Field, FieldContent, FieldLabel } from "@/components/ui/field"
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

type PoiLibraryTableMode = "browse" | "select"

type PoiLibraryTableProps = {
  pois: PoiLibraryItem[]
  mode?: PoiLibraryTableMode
  excludedPoiIds?: string[]
  selectedPoiIds?: string[]
  onSelectedPoiIdsChange?: (next: string[]) => void
  onFilteredPoiIdsChange?: (ids: string[]) => void
  searchText?: string
  onSearchTextChange?: (value: string) => void
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

function getColumnResponsiveClass(mode: PoiLibraryTableMode, columnId: string) {
  if (columnId === "select" && mode === "select") {
    return ""
  }

  if (mode === "browse" && columnId === "actions") {
    return ""
  }

  switch (columnId) {
    case "coverImageUrl":
      return "hidden lg:table-cell"
    case "subtype":
      return "hidden md:table-cell"
    default:
      return ""
  }
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values))
}

function FilterSummaryBadge({ children }: { children: React.ReactNode }) {
  return (
    <Badge variant="outline" className="font-normal">
      {children}
    </Badge>
  )
}

function FilterCountBadge({ count }: { count: number }) {
  return (
    <Badge variant="secondary" className="pointer-events-none">
      {count}
    </Badge>
  )
}

function TableActionTrigger() {
  return (
    <Button variant="ghost" size="icon-sm">
      <span className="sr-only">Abrir menú</span>
      <MoreHorizontal />
    </Button>
  )
}

function FilterSearchField({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <Field>
      <FieldLabel htmlFor="poi-search-filter">Buscar por nombre, tipo o subtipo</FieldLabel>
      <FieldContent>
        <Input
          id="poi-search-filter"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Ej: Mirador, hotel boutique, restaurante..."
        />
      </FieldContent>
    </Field>
  )
}

export function PoiLibraryTable({
  pois,
  mode = "browse",
  excludedPoiIds = [],
  selectedPoiIds,
  onSelectedPoiIdsChange,
  onFilteredPoiIdsChange,
  searchText,
  onSearchTextChange,
  onRequestDeletePoi,
  toolbarAction,
  emptyMessage = "Sin POIs para los filtros seleccionados.",
  filterDialogTitle = "Filtros de biblioteca de POIs",
  filterDialogDescription = "Busca y filtra POIs por categoría y términos editoriales.",
}: PoiLibraryTableProps) {
  const [isFiltersDialogOpen, setIsFiltersDialogOpen] = React.useState(false)
  const [internalSelectedPoiIds, setInternalSelectedPoiIds] = React.useState<string[]>([])
  const [internalSearchText, setInternalSearchText] = React.useState("")
  const [selectedTypes, setSelectedTypes] = React.useState<PoiType[]>([])
  const [sorting, setSorting] = React.useState<SortingState>([])

  const usesExternalSearchControl =
    typeof searchText === "string" || typeof onSearchTextChange === "function"

  const effectiveSearchText = searchText ?? internalSearchText

  const setEffectiveSearchText = React.useCallback(
    (next: string) => {
      if (onSearchTextChange) {
        onSearchTextChange(next)
        return
      }

      setInternalSearchText(next)
    },
    [onSearchTextChange]
  )

  const effectiveSelectedPoiIds = selectedPoiIds ?? internalSelectedPoiIds

  const setEffectiveSelectedPoiIds = React.useCallback(
    (next: string[]) => {
      if (onSelectedPoiIdsChange) {
        onSelectedPoiIdsChange(next)
        return
      }

      setInternalSelectedPoiIds(next)
    },
    [onSelectedPoiIdsChange]
  )

  const excludedPoiIdSet = React.useMemo(() => new Set(excludedPoiIds), [excludedPoiIds])

  const visiblePois = React.useMemo(
    () => pois.filter((poi) => !excludedPoiIdSet.has(poi.id)),
    [pois, excludedPoiIdSet]
  )

  const filteredPois = React.useMemo(() => {
    const query = effectiveSearchText.trim().toLowerCase()

    return visiblePois.filter((poi) => {
      const matchesSearch =
        query.length === 0 ||
        poi.name.toLowerCase().includes(query) ||
        poi.type.toLowerCase().includes(query) ||
        poi.subtype.toLowerCase().includes(query)

      const matchesType = includesOrAll(selectedTypes, poi.type)

      return matchesSearch && matchesType
    })
  }, [visiblePois, effectiveSearchText, selectedTypes])

  React.useEffect(() => {
    onFilteredPoiIdsChange?.(filteredPois.map((poi) => poi.id))
  }, [filteredPois, onFilteredPoiIdsChange])

  const columns = React.useMemo<ColumnDef<PoiLibraryItem>[]>(() => {
    const baseColumns: ColumnDef<PoiLibraryItem>[] = []

    if (mode === "select") {
      baseColumns.push({
        id: "select",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const checked = effectiveSelectedPoiIds.includes(row.original.id)

          return (
            <input
              type="checkbox"
              checked={checked}
              onChange={() => {
                if (checked) {
                  setEffectiveSelectedPoiIds(
                    effectiveSelectedPoiIds.filter((item) => item !== row.original.id)
                  )
                } else {
                  setEffectiveSelectedPoiIds(
                    uniqueStrings([...effectiveSelectedPoiIds, row.original.id])
                  )
                }
              }}
              aria-label={`Seleccionar POI ${row.original.name}`}
            />
          )
        },
      })
    }

    baseColumns.push(
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
      }
    )

    if (mode === "browse") {
      baseColumns.push({
        id: "actions",
        header: "Acciones",
        enableSorting: false,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <TableActionTrigger />
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
      })
    }

    return baseColumns
  }, [mode, effectiveSelectedPoiIds, onRequestDeletePoi, setEffectiveSelectedPoiIds])

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
  }, [effectiveSearchText, selectedTypes, table])

  React.useEffect(() => {
    if (mode === "select" && excludedPoiIds.length > 0 && effectiveSelectedPoiIds.length > 0) {
      const excludedSet = new Set(excludedPoiIds)
      const next = effectiveSelectedPoiIds.filter((poiId) => !excludedSet.has(poiId))
      if (next.length !== effectiveSelectedPoiIds.length) {
        setEffectiveSelectedPoiIds(next)
      }
    }
  }, [mode, excludedPoiIds, effectiveSelectedPoiIds, setEffectiveSelectedPoiIds])

  const pageCount = table.getPageCount()
  const currentPage = table.getState().pagination.pageIndex

  const hasActiveFilters = effectiveSearchText.trim().length > 0 || selectedTypes.length > 0

  const appliedFilterLabels = React.useMemo(() => {
    const labels: string[] = []
    const query = effectiveSearchText.trim()

    if (query.length > 0) {
      labels.push(`Búsqueda: ${query}`)
    }

    for (const type of selectedTypes) {
      labels.push(`Tipo: ${type}`)
    }

    return labels
  }, [effectiveSearchText, selectedTypes])

  function clearAllFilters() {
    setEffectiveSearchText("")
    setSelectedTypes([])
  }

  return (
    <div className="min-w-0 flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          onClick={() => setIsFiltersDialogOpen(true)}
          className="justify-start"
        >
          <Filter data-icon="inline-start" />
          Filtros
          {appliedFilterLabels.length > 0 && (
            <FilterCountBadge count={appliedFilterLabels.length} />
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
            <FilterSummaryBadge key={`${label}-${index}`}>
              {label}
            </FilterSummaryBadge>
          ))
        ) : (
          <span className="text-xs text-muted-foreground">Ninguno</span>
        )}
      </div>

      <div className="min-w-0 rounded-md border">
        <Table containerClassName="overflow-hidden" className="table-fixed w-full">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(getColumnResponsiveClass(mode, header.column.id))}
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
                      className={cn(getColumnResponsiveClass(mode, cell.column.id))}
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

          <div className="flex flex-col gap-4">
            {!usesExternalSearchControl && (
              <FilterSearchField value={effectiveSearchText} onChange={setEffectiveSearchText} />
            )}

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
