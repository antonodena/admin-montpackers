import {
  POI_TYPES,
  poiLibrarySeed,
  type PoiLibraryItem,
  type PoiType,
} from "@/lib/pois-data"

export { POI_TYPES, poiLibrarySeed, type PoiLibraryItem, type PoiType }

export function getAllPois() {
  return poiLibrarySeed.map((poi) => ({ ...poi }))
}

export function getPoiById(poiId: string) {
  return getAllPois().find((poi) => poi.id === poiId)
}
