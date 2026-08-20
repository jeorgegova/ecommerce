interface CompressOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: "webp" | "jpeg"
}

export function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<{ blob: Blob; width: number; height: number }> {
  const { maxWidth = 1920, maxHeight = 1920, quality = 0.8, format = "webp" } = options

  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      let { width, height } = img

      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height
        height = maxHeight
      }

      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext("2d")!
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Compression failed"))
            return
          }
          resolve({ blob, width, height })
        },
        `image/${format}`,
        quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Failed to load image"))
    }

    img.src = url
  })
}

export function generateThumbnail(
  file: File
): Promise<{ blob: Blob; width: number; height: number }> {
  return compressImage(file, { maxWidth: 400, maxHeight: 400, quality: 0.6, format: "webp" })
}

export function generateThumbnailUrl(url: string): string {
  const parts = url.split("/")
  const filename = parts.pop()!
  const name = filename.replace(/\.[^.]+$/, "")
  parts.push(`thumb_${name}.webp`)
  return parts.join("/")
}

export function isSupabaseStorageUrl(url: string): boolean {
  return url.includes("supabase.co")
}

export function isExternalImageUrl(url: string): boolean {
  return !isSupabaseStorageUrl(url)
}

export function getGoogleDriveFileId(url: string): string | null {
  const m1 = url.match(/\/file\/d\/([^/]+)/)
  if (m1) return m1[1]
  const m2 = url.match(/[?&]id=([^&]+)/)
  if (m2) return m2[1]
  return null
}

export function getDisplayImageUrl(url: string): string {
  if (!url) return url
  if (url.includes("drive.google.com")) {
    const id = getGoogleDriveFileId(url)
    if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w1000`
  }
  return url
}
