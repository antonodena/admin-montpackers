import { isValidHexColor } from "@/lib/tenant-storage"

export const DEFAULT_TENANT_BRAND_COLOR = "#9F1239"

const LOGO_MAX_SIZE = 2 * 1024 * 1024
const FAVICON_MAX_SIZE = 512 * 1024

const LOGO_ALLOWED_EXTENSIONS = ["png", "jpg", "jpeg", "svg"]
const FAVICON_ALLOWED_EXTENSIONS = ["ico", "png", "svg"]

const LOGO_ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/svg+xml"]
const FAVICON_ALLOWED_MIME_TYPES = [
  "image/png",
  "image/svg+xml",
  "image/x-icon",
  "image/vnd.microsoft.icon",
]

export type TenantAssetTarget = "logo" | "favicon"

function getFileExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() ?? ""
}

function isMimeAllowed(fileType: string, allowedMimeTypes: string[]) {
  return fileType.length === 0 || allowedMimeTypes.includes(fileType)
}

export function getTenantAssetAccept(target: TenantAssetTarget) {
  return target === "logo" ? ".png,.jpg,.jpeg,.svg" : ".ico,.png,.svg"
}

export function validateTenantAssetFile(target: TenantAssetTarget, file: File) {
  const extension = getFileExtension(file.name)

  if (target === "logo") {
    if (!LOGO_ALLOWED_EXTENSIONS.includes(extension)) {
      return "El logo debe ser PNG, JPG, JPEG o SVG."
    }

    if (!isMimeAllowed(file.type, LOGO_ALLOWED_MIME_TYPES)) {
      return "Formato MIME de logo no válido."
    }

    if (file.size > LOGO_MAX_SIZE) {
      return "El logo supera 2MB."
    }

    return null
  }

  if (!FAVICON_ALLOWED_EXTENSIONS.includes(extension)) {
    return "El favicon debe ser ICO, PNG o SVG."
  }

  if (!isMimeAllowed(file.type, FAVICON_ALLOWED_MIME_TYPES)) {
    return "Formato MIME de favicon no válido."
  }

  if (file.size > FAVICON_MAX_SIZE) {
    return "El favicon supera 512KB."
  }

  return null
}

export function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ""))
    reader.onerror = () => reject(new Error("No se ha podido leer el archivo"))
    reader.readAsDataURL(file)
  })
}

export function validateTenantName(value: string) {
  if (value.trim().length < 2) {
    return "El nombre del hotel debe tener al menos 2 caracteres."
  }

  return null
}

export function normalizeTenantBrandColorInput(value: string) {
  const next = value.startsWith("#") ? value : `#${value}`
  const upper = next.toUpperCase()

  if (!/^#[0-9A-F]{0,6}$/.test(upper)) {
    return null
  }

  return upper
}

export function getTenantBrandColor(value?: string) {
  return value && isValidHexColor(value) ? value.toUpperCase() : DEFAULT_TENANT_BRAND_COLOR
}

