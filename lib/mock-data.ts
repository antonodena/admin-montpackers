export type Tenant = {
  id: string
  slug: string
  name: string
  siteUrl: string
  imageUrl?: string
  brandColor?: string
  logoDataUrl?: string
  faviconDataUrl?: string
}

export type AdminUser = {
  id: string
  name: string
  email: string
  tenantSlug: string
}

export const tenants: Tenant[] = [
  {
    id: "tenant_001",
    slug: "hotel-taull",
    name: "Hotel Taüll",
    siteUrl: "https://taull.montpackers.app",
  },
  {
    id: "tenant_002",
    slug: "hotel-nevat",
    name: "Hotel Nevat",
    siteUrl: "https://nevat.montpackers.app",
  },
  {
    id: "tenant_003",
    slug: "resort-valldem",
    name: "Resort Valldem",
    siteUrl: "https://valldem.montpackers.app",
  },
  {
    id: "tenant_004",
    slug: "hotel-pedraforca",
    name: "Hotel Pedraforca",
    siteUrl: "https://pedraforca.montpackers.app",
  },
  {
    id: "tenant_005",
    slug: "hostal-puigmal",
    name: "Hostal Puigmal",
    siteUrl: "https://puigmal.montpackers.app",
  },
  {
    id: "tenant_006",
    slug: "hotel-aigues",
    name: "Hotel Aigües",
    siteUrl: "https://aigues.montpackers.app",
  },
  {
    id: "tenant_007",
    slug: "resort-estany",
    name: "Resort Estany",
    siteUrl: "https://estany.montpackers.app",
  },
  {
    id: "tenant_008",
    slug: "hotel-cadira",
    name: "Hotel Cadira",
    siteUrl: "https://cadira.montpackers.app",
  },
  {
    id: "tenant_009",
    slug: "hotel-alzina",
    name: "Hotel Alzina",
    siteUrl: "https://alzina.montpackers.app",
  },
  {
    id: "tenant_010",
    slug: "resort-riu",
    name: "Resort Riu",
    siteUrl: "https://riu.montpackers.app",
  },
  {
    id: "tenant_011",
    slug: "hotel-roc",
    name: "Hotel Roc",
    siteUrl: "https://roc.montpackers.app",
  },
  {
    id: "tenant_012",
    slug: "hotel-turo",
    name: "Hotel Turó",
    siteUrl: "https://turo.montpackers.app",
  },
]

export const users: AdminUser[] = [
  { id: "user_001", name: "Anton Òdena", email: "anton@montpackers.com", tenantSlug: "hotel-taull" },
  { id: "user_002", name: "Marta Soler", email: "marta@taullhotel.com", tenantSlug: "hotel-taull" },
  { id: "user_003", name: "Jordi Roca", email: "jordi@nevat.com", tenantSlug: "hotel-nevat" },
  { id: "user_004", name: "Laia Casas", email: "laia@nevat.com", tenantSlug: "hotel-nevat" },
  { id: "user_005", name: "Pau Valls", email: "pau@valldem.com", tenantSlug: "resort-valldem" },
  { id: "user_006", name: "Núria Mir", email: "nuria@pedraforca.com", tenantSlug: "hotel-pedraforca" },
  { id: "user_007", name: "Eric Costa", email: "eric@puigmal.com", tenantSlug: "hostal-puigmal" },
  { id: "user_008", name: "Olga Brunet", email: "olga@aigues.com", tenantSlug: "hotel-aigues" },
  { id: "user_009", name: "Carla Vidal", email: "carla@estany.com", tenantSlug: "resort-estany" },
  { id: "user_010", name: "Sergi Bosch", email: "sergi@cadira.com", tenantSlug: "hotel-cadira" },
  { id: "user_011", name: "Marc Sala", email: "marc@alzina.com", tenantSlug: "hotel-alzina" },
  { id: "user_012", name: "Rita Pascual", email: "rita@riu.com", tenantSlug: "resort-riu" },
  { id: "user_013", name: "Pol Ferrer", email: "pol@roc.com", tenantSlug: "hotel-roc" },
  { id: "user_014", name: "Eva Pons", email: "eva@turo.com", tenantSlug: "hotel-turo" },
  { id: "user_015", name: "Clàudia Font", email: "claudia@taullhotel.com", tenantSlug: "hotel-taull" },
  { id: "user_016", name: "Hugo Marin", email: "hugo@pedraforca.com", tenantSlug: "hotel-pedraforca" },
  { id: "user_017", name: "Iris Gil", email: "iris@valldem.com", tenantSlug: "resort-valldem" },
  { id: "user_018", name: "Alex Prat", email: "alex@turo.com", tenantSlug: "hotel-turo" },
]

export const defaultTenant = tenants[0]

export function getTenantBySlug(slug: string) {
  return tenants.find((tenant) => tenant.slug === slug)
}
