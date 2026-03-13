export const IMAGE_UPLOAD_ACCEPT = ".png,.jpg,.jpeg,.webp,.svg"
export const MAX_IMAGE_UPLOAD_COUNT = 8
export const MAX_IMAGE_UPLOAD_BYTES = 4 * 1024 * 1024
export const MAX_IMAGE_LONG_SIDE = 1600

const ALLOWED_IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp", "svg"])
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
])

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ""))
    reader.onerror = () => reject(new Error("No se ha podido leer el archivo"))
    reader.readAsDataURL(file)
  })
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("No se ha podido procesar la imagen"))
    image.src = source
  })
}

export function getFileExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() ?? ""
}

export function createImageAssetId(prefix = "asset") {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function validateImageFile(file: File) {
  const extension = getFileExtension(file.name)
  const isMimeAllowed = file.type.length === 0 || ALLOWED_IMAGE_MIME_TYPES.has(file.type)

  if (!ALLOWED_IMAGE_EXTENSIONS.has(extension) || !isMimeAllowed) {
    return `El archivo ${file.name} no tiene un formato soportado.`
  }

  return null
}

export function estimateDataUrlSize(value: string) {
  if (!value.startsWith("data:")) {
    return value.length
  }

  const base64 = value.split(",")[1] ?? ""
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0

  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding)
}

export function getImagePayloadSize(items: Array<{ dataUrl: string }>) {
  return items.reduce((total, item) => total + estimateDataUrlSize(item.dataUrl), 0)
}

export async function optimizeImageFile(file: File) {
  const source = await fileToDataUrl(file)
  const extension = getFileExtension(file.name)

  if (file.type === "image/svg+xml" || extension === "svg") {
    return {
      dataUrl: source,
      mimeType: "image/svg+xml",
    }
  }

  const image = await loadImage(source)
  const longestSide = Math.max(image.naturalWidth, image.naturalHeight)
  const scale = longestSide > MAX_IMAGE_LONG_SIDE ? MAX_IMAGE_LONG_SIDE / longestSide : 1
  const width = Math.max(1, Math.round(image.naturalWidth * scale))
  const height = Math.max(1, Math.round(image.naturalHeight * scale))
  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d")

  if (!context) {
    throw new Error("No se ha podido preparar el lienzo de imagen")
  }

  canvas.width = width
  canvas.height = height
  context.drawImage(image, 0, 0, width, height)

  return {
    dataUrl: canvas.toDataURL("image/webp", 0.85),
    mimeType: "image/webp",
  }
}
