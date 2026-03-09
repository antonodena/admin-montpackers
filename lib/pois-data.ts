export type PoiType =
  | "Tienda"
  | "Alojamiento"
  | "Restaurante"
  | "Servicio"
  | "Población"
  | "Actividad"
  | "Patrimonio Cultural"
  | "Resort"
  | "Zona Picnic"
  | "Mirador"
  | "Patrimonio Natural"

export type PoiLibraryItem = {
  id: string
  coverImageUrl: string
  name: string
  type: PoiType
  subtype: string
}

export const POI_TYPES: PoiType[] = [
  "Tienda",
  "Alojamiento",
  "Restaurante",
  "Servicio",
  "Población",
  "Actividad",
  "Patrimonio Cultural",
  "Resort",
  "Zona Picnic",
  "Mirador",
  "Patrimonio Natural",
]

export const poiLibrarySeed: PoiLibraryItem[] = [
  {
    id: "poi_001",
    coverImageUrl:
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=320&q=80",
    name: "Concept Store Ordino",
    type: "Tienda",
    subtype: "Equipamiento outdoor",
  },
  {
    id: "poi_002",
    coverImageUrl:
      "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=320&q=80",
    name: "Hotel Mirador del Valle",
    type: "Alojamiento",
    subtype: "Hotel boutique",
  },
  {
    id: "poi_003",
    coverImageUrl:
      "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=320&q=80",
    name: "Borda del Caminante",
    type: "Restaurante",
    subtype: "Cocina de montaña",
  },
  {
    id: "poi_004",
    coverImageUrl:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=320&q=80",
    name: "Oficina de Turismo de La Massana",
    type: "Servicio",
    subtype: "Información turística",
  },
  {
    id: "poi_005",
    coverImageUrl:
      "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=320&q=80",
    name: "Taüll",
    type: "Población",
    subtype: "Pueblo románico",
  },
  {
    id: "poi_006",
    coverImageUrl:
      "https://images.unsplash.com/photo-1518608774889-b04d2abe7702?auto=format&fit=crop&w=320&q=80",
    name: "Vía ferrata Clots de l'Aspra",
    type: "Actividad",
    subtype: "Aventura guiada",
  },
  {
    id: "poi_007",
    coverImageUrl:
      "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=320&q=80",
    name: "Sant Climent de Taüll",
    type: "Patrimonio Cultural",
    subtype: "Iglesia románica",
  },
  {
    id: "poi_008",
    coverImageUrl:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=320&q=80",
    name: "Resort Estany Blau",
    type: "Resort",
    subtype: "Wellness & spa",
  },
  {
    id: "poi_009",
    coverImageUrl:
      "https://images.unsplash.com/photo-1521334884684-d80222895322?auto=format&fit=crop&w=320&q=80",
    name: "Área picnic del Serrat",
    type: "Zona Picnic",
    subtype: "Merendero familiar",
  },
  {
    id: "poi_010",
    coverImageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=320&q=80",
    name: "Mirador del Roc del Quer",
    type: "Mirador",
    subtype: "Panorámica de valle",
  },
  {
    id: "poi_011",
    coverImageUrl:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=320&q=80",
    name: "Bosque de la Rabassa",
    type: "Patrimonio Natural",
    subtype: "Espacio natural protegido",
  },
  {
    id: "poi_012",
    coverImageUrl:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=320&q=80",
    name: "Apartaments Bordes del Nord",
    type: "Alojamiento",
    subtype: "Apartamentos turísticos",
  },
]
