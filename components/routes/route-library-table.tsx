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
import { Slider } from "@/components/ui/slider"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ROUTE_AUTHORS,
  ROUTE_DIFFICULTIES,
  ROUTE_REGIONS,
  ROUTE_SPORTS,
  type RouteDifficulty,
  type RouteLibraryItem,
  type RouteRegion,
  type RouteSport,
} from "@/lib/routes-data"
import { cn } from "@/lib/utils"

type YesNoFilter = "Sí" | "No"

type NumberRange = [number, number]

type RouteLibraryTableMode = "browse" | "select"

type RouteLibraryTableProps = {
  routes: RouteLibraryItem[]
  mode?: RouteLibraryTableMode
  excludedRouteIds?: string[]
  selectedRouteIds?: string[]
  onSelectedRouteIdsChange?: (next: string[]) => void
  onFilteredRouteIdsChange?: (ids: string[]) => void
  searchText?: string
  onSearchTextChange?: (value: string) => void
  onRequestDeleteRoute?: (route: RouteLibraryItem) => void
  toolbarAction?: React.ReactNode
  emptyMessage?: string
  filterDialogTitle?: string
  filterDialogDescription?: string
}

const DISTANCE_DEFAULT_RANGE: NumberRange = [0, 100]
const ELEVATION_DEFAULT_RANGE: NumberRange = [0, 3000]
const DURATION_DEFAULT_RANGE: NumberRange = [0, 720]
const YES_NO_OPTIONS: YesNoFilter[] = ["Sí", "No"]

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
              } else {
                onChange(selected.filter((item) => item !== option))
              }
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

type RangeFilterProps = {
  label: string
  value: NumberRange
  min: number
  max: number
  step: number
  unit: string
  onChange: (next: NumberRange) => void
}

function RangeFilter({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: RangeFilterProps) {
  return (
    <div className="space-y-2 rounded-lg border p-3">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {value[0]}
          {unit} - {value[1]}
          {unit}
        </span>
      </div>
      <Slider
        value={value}
        min={min}
        max={max}
        step={step}
        onValueChange={(next) => {
          if (next.length === 2) {
            onChange([next[0], next[1]])
          }
        }}
      />
    </div>
  )
}

function formatDuration(durationMin: number) {
  const hours = Math.floor(durationMin / 60)
  const minutes = durationMin % 60

  if (hours === 0) {
    return `${minutes} min`
  }

  if (minutes === 0) {
    return `${hours} h`
  }

  return `${hours} h ${minutes} min`
}

function includesOrAll<T>(selected: T[], current: T) {
  if (selected.length === 0) {
    return true
  }

  return selected.includes(current)
}

function getColumnResponsiveClass(mode: RouteLibraryTableMode, columnId: string) {
  if (columnId === "select" && mode === "select") {
    return ""
  }

  if (mode === "browse" && columnId === "actions") {
    return ""
  }

  switch (columnId) {
    case "difficulty":
      return "hidden sm:table-cell"
    case "sport":
      return "hidden md:table-cell"
    case "distanceKm":
      return "hidden lg:table-cell"
    case "durationMin":
      return "hidden lg:table-cell"
    case "coverImageUrl":
      return "hidden xl:table-cell"
    case "tenantCount":
      return "hidden xl:table-cell"
    case "isCircular":
      return "hidden xl:table-cell"
    case "isFamilyFriendly":
      return "hidden xl:table-cell"
    case "elevationGainM":
      return "hidden xl:table-cell"
    case "author":
      return "hidden 2xl:table-cell"
    default:
      return ""
  }
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values))
}

export function RouteLibraryTable({
  routes,
  mode = "browse",
  excludedRouteIds = [],
  selectedRouteIds,
  onSelectedRouteIdsChange,
  onFilteredRouteIdsChange,
  searchText,
  onSearchTextChange,
  onRequestDeleteRoute,
  toolbarAction,
  emptyMessage = "Sin rutas para los filtros seleccionados.",
  filterDialogTitle = "Filtros de biblioteca de rutas",
  filterDialogDescription = "Busca y filtra rutas por categoría, atributos y rangos numéricos.",
}: RouteLibraryTableProps) {
  const [isFiltersDialogOpen, setIsFiltersDialogOpen] = React.useState(false)
  const [internalSelectedRouteIds, setInternalSelectedRouteIds] = React.useState<string[]>([])
  const [internalSearchText, setInternalSearchText] = React.useState("")

  const [selectedRegions, setSelectedRegions] = React.useState<RouteRegion[]>([])
  const [selectedSports, setSelectedSports] = React.useState<RouteSport[]>([])
  const [selectedDifficulties, setSelectedDifficulties] = React.useState<RouteDifficulty[]>([])
  const [selectedCircular, setSelectedCircular] = React.useState<YesNoFilter[]>([])
  const [selectedFamily, setSelectedFamily] = React.useState<YesNoFilter[]>([])
  const [selectedAuthors, setSelectedAuthors] = React.useState<string[]>([])
  const [distanceRange, setDistanceRange] = React.useState<NumberRange>(DISTANCE_DEFAULT_RANGE)
  const [elevationRange, setElevationRange] = React.useState<NumberRange>(ELEVATION_DEFAULT_RANGE)
  const [durationRange, setDurationRange] = React.useState<NumberRange>(DURATION_DEFAULT_RANGE)

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

  const effectiveSelectedRouteIds = selectedRouteIds ?? internalSelectedRouteIds

  const setEffectiveSelectedRouteIds = React.useCallback(
    (next: string[]) => {
      if (onSelectedRouteIdsChange) {
        onSelectedRouteIdsChange(next)
        return
      }

      setInternalSelectedRouteIds(next)
    },
    [onSelectedRouteIdsChange]
  )

  const excludedRouteIdSet = React.useMemo(() => new Set(excludedRouteIds), [excludedRouteIds])

  const visibleRoutes = React.useMemo(
    () => routes.filter((route) => !excludedRouteIdSet.has(route.id)),
    [routes, excludedRouteIdSet]
  )

  const authorOptions = React.useMemo(() => {
    const dynamicAuthors = new Set(visibleRoutes.map((route) => route.author))

    for (const author of ROUTE_AUTHORS) {
      dynamicAuthors.add(author)
    }

    return Array.from(dynamicAuthors).sort((a, b) => a.localeCompare(b))
  }, [visibleRoutes])

  const filteredRoutes = React.useMemo(() => {
    const query = effectiveSearchText.trim().toLowerCase()

    return visibleRoutes.filter((route) => {
      const matchesSearch =
        query.length === 0 ||
        route.name.toLowerCase().includes(query) ||
        route.author.toLowerCase().includes(query)

      const matchesRegion = includesOrAll(selectedRegions, route.region)
      const matchesSport = includesOrAll(selectedSports, route.sport)
      const matchesDifficulty = includesOrAll(selectedDifficulties, route.difficulty)

      const circularLabel: YesNoFilter = route.isCircular ? "Sí" : "No"
      const familyLabel: YesNoFilter = route.isFamilyFriendly ? "Sí" : "No"

      const matchesCircular = includesOrAll(selectedCircular, circularLabel)
      const matchesFamily = includesOrAll(selectedFamily, familyLabel)
      const matchesAuthor = includesOrAll(selectedAuthors, route.author)

      const matchesDistance =
        route.distanceKm >= distanceRange[0] && route.distanceKm <= distanceRange[1]
      const matchesElevation =
        route.elevationGainM >= elevationRange[0] &&
        route.elevationGainM <= elevationRange[1]
      const matchesDuration =
        route.durationMin >= durationRange[0] && route.durationMin <= durationRange[1]

      return (
        matchesSearch &&
        matchesRegion &&
        matchesSport &&
        matchesDifficulty &&
        matchesCircular &&
        matchesFamily &&
        matchesAuthor &&
        matchesDistance &&
        matchesElevation &&
        matchesDuration
      )
    })
  }, [
    visibleRoutes,
    effectiveSearchText,
    selectedRegions,
    selectedSports,
    selectedDifficulties,
    selectedCircular,
    selectedFamily,
    selectedAuthors,
    distanceRange,
    elevationRange,
    durationRange,
  ])

  React.useEffect(() => {
    onFilteredRouteIdsChange?.(filteredRoutes.map((route) => route.id))
  }, [filteredRoutes, onFilteredRouteIdsChange])

  const columns = React.useMemo<ColumnDef<RouteLibraryItem>[]>(() => {
    const baseColumns: ColumnDef<RouteLibraryItem>[] = []

    if (mode === "select") {
      baseColumns.push({
        id: "select",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const checked = effectiveSelectedRouteIds.includes(row.original.id)

          return (
            <input
              type="checkbox"
              checked={checked}
              onChange={() => {
                if (checked) {
                  setEffectiveSelectedRouteIds(
                    effectiveSelectedRouteIds.filter((item) => item !== row.original.id)
                  )
                } else {
                  setEffectiveSelectedRouteIds(
                    uniqueStrings([...effectiveSelectedRouteIds, row.original.id])
                  )
                }
              }}
              aria-label={`Seleccionar ruta ${row.original.name}`}
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
          <span className="block max-w-[220px] truncate font-medium">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "tenantCount",
        header: ({ column }) => <ColumnHeader column={column} title="Tenants" />,
      },
      {
        accessorKey: "sport",
        header: ({ column }) => <ColumnHeader column={column} title="Deporte" />,
        cell: ({ row }) => (
          <span className="block max-w-[160px] truncate">{row.original.sport}</span>
        ),
      },
      {
        accessorKey: "difficulty",
        header: ({ column }) => <ColumnHeader column={column} title="Dificultad" />,
      },
      {
        accessorKey: "isCircular",
        header: ({ column }) => <ColumnHeader column={column} title="Circular" />,
        cell: ({ row }) => (row.original.isCircular ? "Sí" : "No"),
      },
      {
        accessorKey: "isFamilyFriendly",
        header: ({ column }) => <ColumnHeader column={column} title="Familiar" />,
        cell: ({ row }) => (row.original.isFamilyFriendly ? "Sí" : "No"),
      },
      {
        accessorKey: "distanceKm",
        header: ({ column }) => <ColumnHeader column={column} title="Distancia" />,
        cell: ({ row }) => `${row.original.distanceKm.toFixed(1)} km`,
      },
      {
        accessorKey: "elevationGainM",
        header: ({ column }) => <ColumnHeader column={column} title="Desnivel" />,
        cell: ({ row }) => `${row.original.elevationGainM} m`,
      },
      {
        accessorKey: "durationMin",
        header: ({ column }) => <ColumnHeader column={column} title="Duración" />,
        cell: ({ row }) => formatDuration(row.original.durationMin),
      },
      {
        accessorKey: "author",
        header: ({ column }) => <ColumnHeader column={column} title="Autor" />,
        cell: ({ row }) => (
          <span className="block max-w-[160px] truncate">{row.original.author}</span>
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
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/admin/routes/${row.original.id}`}>
                  <Eye className="size-4" />
                  Ver ruta
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/admin/routes/${row.original.id}/edit`}>
                  <Pencil className="size-4" />
                  Editar ruta
                </Link>
              </DropdownMenuItem>
              {onRequestDeleteRoute && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={(event) => {
                      event.preventDefault()
                      onRequestDeleteRoute(row.original)
                    }}
                  >
                    <Trash2 className="size-4" />
                    Eliminar ruta
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      })
    }

    return baseColumns
  }, [mode, effectiveSelectedRouteIds, setEffectiveSelectedRouteIds, onRequestDeleteRoute])

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filteredRoutes,
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
  }, [
    effectiveSearchText,
    selectedRegions,
    selectedSports,
    selectedDifficulties,
    selectedCircular,
    selectedFamily,
    selectedAuthors,
    distanceRange,
    elevationRange,
    durationRange,
    table,
  ])

  React.useEffect(() => {
    if (mode === "select" && excludedRouteIds.length > 0 && effectiveSelectedRouteIds.length > 0) {
      const excludedSet = new Set(excludedRouteIds)
      const next = effectiveSelectedRouteIds.filter((routeId) => !excludedSet.has(routeId))
      if (next.length !== effectiveSelectedRouteIds.length) {
        setEffectiveSelectedRouteIds(next)
      }
    }
  }, [mode, excludedRouteIds, effectiveSelectedRouteIds, setEffectiveSelectedRouteIds])

  const pageCount = table.getPageCount()
  const currentPage = table.getState().pagination.pageIndex

  const hasActiveFilters =
    effectiveSearchText.trim().length > 0 ||
    selectedRegions.length > 0 ||
    selectedSports.length > 0 ||
    selectedDifficulties.length > 0 ||
    selectedCircular.length > 0 ||
    selectedFamily.length > 0 ||
    selectedAuthors.length > 0 ||
    distanceRange[0] !== DISTANCE_DEFAULT_RANGE[0] ||
    distanceRange[1] !== DISTANCE_DEFAULT_RANGE[1] ||
    elevationRange[0] !== ELEVATION_DEFAULT_RANGE[0] ||
    elevationRange[1] !== ELEVATION_DEFAULT_RANGE[1] ||
    durationRange[0] !== DURATION_DEFAULT_RANGE[0] ||
    durationRange[1] !== DURATION_DEFAULT_RANGE[1]

  const appliedFilterLabels = React.useMemo(() => {
    const labels: string[] = []
    const query = effectiveSearchText.trim()

    if (query.length > 0) {
      labels.push(`Búsqueda: ${query}`)
    }

    for (const region of selectedRegions) {
      labels.push(`Región: ${region}`)
    }

    for (const sport of selectedSports) {
      labels.push(`Deporte: ${sport}`)
    }

    for (const difficulty of selectedDifficulties) {
      labels.push(`Dificultad: ${difficulty}`)
    }

    for (const circular of selectedCircular) {
      labels.push(`Circular: ${circular}`)
    }

    for (const family of selectedFamily) {
      labels.push(`Familiar: ${family}`)
    }

    for (const author of selectedAuthors) {
      labels.push(`Autor: ${author}`)
    }

    if (
      distanceRange[0] !== DISTANCE_DEFAULT_RANGE[0] ||
      distanceRange[1] !== DISTANCE_DEFAULT_RANGE[1]
    ) {
      labels.push(`Distancia: ${distanceRange[0]}-${distanceRange[1]} km`)
    }

    if (
      elevationRange[0] !== ELEVATION_DEFAULT_RANGE[0] ||
      elevationRange[1] !== ELEVATION_DEFAULT_RANGE[1]
    ) {
      labels.push(`Desnivel: ${elevationRange[0]}-${elevationRange[1]} m`)
    }

    if (
      durationRange[0] !== DURATION_DEFAULT_RANGE[0] ||
      durationRange[1] !== DURATION_DEFAULT_RANGE[1]
    ) {
      labels.push(
        `Duración: ${formatDuration(durationRange[0])} - ${formatDuration(durationRange[1])}`
      )
    }

    return labels
  }, [
    effectiveSearchText,
    selectedRegions,
    selectedSports,
    selectedDifficulties,
    selectedCircular,
    selectedFamily,
    selectedAuthors,
    distanceRange,
    elevationRange,
    durationRange,
  ])

  function clearAllFilters() {
    setEffectiveSearchText("")
    setSelectedRegions([])
    setSelectedSports([])
    setSelectedDifficulties([])
    setSelectedCircular([])
    setSelectedFamily([])
    setSelectedAuthors([])
    setDistanceRange(DISTANCE_DEFAULT_RANGE)
    setElevationRange(ELEVATION_DEFAULT_RANGE)
    setDurationRange(DURATION_DEFAULT_RANGE)
  }

  return (
    <div className="min-w-0 space-y-4">
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
          Mostrando {table.getRowModel().rows.length} de {filteredRoutes.length} rutas filtradas.
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
            {!usesExternalSearchControl && (
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="route-search-filter">
                  Buscar por nombre o autor
                </label>
                <Input
                  id="route-search-filter"
                  value={effectiveSearchText}
                  onChange={(event) => setEffectiveSearchText(event.target.value)}
                  placeholder="Ej: Ruta del románico, Marc Vidal..."
                />
              </div>
            )}

            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              <MultiSelectFilter
                label="Región"
                options={ROUTE_REGIONS}
                selected={selectedRegions}
                onChange={setSelectedRegions}
              />
              <MultiSelectFilter
                label="Deporte"
                options={ROUTE_SPORTS}
                selected={selectedSports}
                onChange={setSelectedSports}
              />
              <MultiSelectFilter
                label="Dificultad"
                options={ROUTE_DIFFICULTIES}
                selected={selectedDifficulties}
                onChange={setSelectedDifficulties}
              />
              <MultiSelectFilter
                label="Circular"
                options={YES_NO_OPTIONS}
                selected={selectedCircular}
                onChange={setSelectedCircular}
              />
              <MultiSelectFilter
                label="Familiar"
                options={YES_NO_OPTIONS}
                selected={selectedFamily}
                onChange={setSelectedFamily}
              />
              <MultiSelectFilter
                label="Autor"
                options={authorOptions}
                selected={selectedAuthors}
                onChange={setSelectedAuthors}
              />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <RangeFilter
                label="Distancia"
                value={distanceRange}
                min={0}
                max={100}
                step={1}
                unit=" km"
                onChange={setDistanceRange}
              />
              <RangeFilter
                label="Desnivel"
                value={elevationRange}
                min={0}
                max={3000}
                step={50}
                unit=" m"
                onChange={setElevationRange}
              />
              <RangeFilter
                label="Duración"
                value={durationRange}
                min={0}
                max={720}
                step={10}
                unit=" min"
                onChange={setDurationRange}
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" disabled={!hasActiveFilters} onClick={clearAllFilters}>
              Limpiar filtros
            </Button>
            <DialogClose asChild>
              <Button>Aplicar filtros</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
