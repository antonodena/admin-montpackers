export const KIOSK_VIDEO_STORAGE_UNAVAILABLE = "KIOSK_VIDEO_STORAGE_UNAVAILABLE"
export const KIOSK_VIDEO_SAVE_FAILED = "KIOSK_VIDEO_SAVE_FAILED"
export const KIOSK_VIDEO_READ_FAILED = "KIOSK_VIDEO_READ_FAILED"
export const KIOSK_VIDEO_DELETE_FAILED = "KIOSK_VIDEO_DELETE_FAILED"

const KIOSK_VIDEO_DB_NAME = "montpackers-kiosk-videos"
const KIOSK_VIDEO_DB_VERSION = 1
const KIOSK_VIDEO_STORE_NAME = "kiosk-videos"

type KioskVideoRecord = {
  assetKey: string
  blob: Blob
}

export function buildKioskVideoAssetKey(tenantSlug: string, kioskId: string) {
  return `${tenantSlug}:${kioskId}:screensaver`
}

function createStorageError(code: string) {
  return new Error(code)
}

function isIndexedDbAvailable() {
  return typeof window !== "undefined" && typeof window.indexedDB !== "undefined"
}

function openKioskVideoDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (!isIndexedDbAvailable()) {
      reject(createStorageError(KIOSK_VIDEO_STORAGE_UNAVAILABLE))
      return
    }

    const request = window.indexedDB.open(KIOSK_VIDEO_DB_NAME, KIOSK_VIDEO_DB_VERSION)

    request.onupgradeneeded = () => {
      const database = request.result

      if (!database.objectStoreNames.contains(KIOSK_VIDEO_STORE_NAME)) {
        database.createObjectStore(KIOSK_VIDEO_STORE_NAME, {
          keyPath: "assetKey",
        })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(createStorageError(KIOSK_VIDEO_STORAGE_UNAVAILABLE))
  })
}

export async function saveKioskVideoBlob(assetKey: string, blob: Blob) {
  const database = await openKioskVideoDatabase()

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(KIOSK_VIDEO_STORE_NAME, "readwrite")
      const store = transaction.objectStore(KIOSK_VIDEO_STORE_NAME)

      let settled = false
      const rejectOnce = () => {
        if (settled) {
          return
        }

        settled = true
        reject(createStorageError(KIOSK_VIDEO_SAVE_FAILED))
      }

      transaction.oncomplete = () => {
        if (settled) {
          return
        }

        settled = true
        resolve()
      }
      transaction.onerror = rejectOnce
      transaction.onabort = rejectOnce

      store.put({
        assetKey,
        blob,
      } satisfies KioskVideoRecord)
    })
  } finally {
    database.close()
  }
}

export async function getKioskVideoBlob(assetKey: string) {
  const database = await openKioskVideoDatabase()

  try {
    return await new Promise<Blob | null>((resolve, reject) => {
      const transaction = database.transaction(KIOSK_VIDEO_STORE_NAME, "readonly")
      const store = transaction.objectStore(KIOSK_VIDEO_STORE_NAME)
      const request = store.get(assetKey)

      request.onsuccess = () => {
        const record = request.result as KioskVideoRecord | undefined
        resolve(record?.blob ?? null)
      }
      request.onerror = () => reject(createStorageError(KIOSK_VIDEO_READ_FAILED))
      transaction.onerror = () => reject(createStorageError(KIOSK_VIDEO_READ_FAILED))
      transaction.onabort = () => reject(createStorageError(KIOSK_VIDEO_READ_FAILED))
    })
  } finally {
    database.close()
  }
}

export async function deleteKioskVideoBlob(assetKey: string) {
  const database = await openKioskVideoDatabase()

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(KIOSK_VIDEO_STORE_NAME, "readwrite")
      const store = transaction.objectStore(KIOSK_VIDEO_STORE_NAME)

      let settled = false
      const rejectOnce = () => {
        if (settled) {
          return
        }

        settled = true
        reject(createStorageError(KIOSK_VIDEO_DELETE_FAILED))
      }

      transaction.oncomplete = () => {
        if (settled) {
          return
        }

        settled = true
        resolve()
      }
      transaction.onerror = rejectOnce
      transaction.onabort = rejectOnce

      store.delete(assetKey)
    })
  } finally {
    database.close()
  }
}
