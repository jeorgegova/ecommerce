"use client"

import { compressImage, getDisplayImageUrl, isSupabaseStorageUrl } from "@/lib/utils/image"
import { extractStoragePath } from "@/lib/utils/storage"
import Image from "next/image"
import { useCallback, useEffect, useRef, useState } from "react"

interface ImageItem {
  id?: string
  url: string
  alt: string
  is_main: boolean
  sort_order: number
  width?: number
  height?: number
  file_size?: number
}

interface ImageUploadProps {
  images: ImageItem[]
  onChange: (images: ImageItem[] | ((prev: ImageItem[]) => ImageItem[])) => void
  bucket?: string
  folder?: string
}

export default function ImageUpload({
  images,
  onChange,
  bucket = "products",
  folder = "",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number; fileName: string } | null>(null)
  const [uploadErrors, setUploadErrors] = useState<string[]>([])
  const [externalUrl, setExternalUrl] = useState("")
  const [urlError, setUrlError] = useState("")

  const imagesRef = useRef(images)
  useEffect(() => { imagesRef.current = images }, [images])

  const handleFiles = useCallback(
    async (files: FileList) => {
      setUploading(true)
      setUploadErrors([])
      const fileArray = Array.from(files)
      const supabase = (await import("@/lib/supabase/client")).createClient()
      const newImages: ImageItem[] = []
      const failedFiles: string[] = []
      const baseLength = imagesRef.current.length

      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i]
        setUploadProgress({ current: i + 1, total: fileArray.length, fileName: file.name })

        try {
          const { blob: compressed, width, height } = await compressImage(file)

          const ext = "webp"
          const timestamp = Date.now()
          const filename = `${timestamp}_${Math.random().toString(36).slice(2)}.${ext}`
          const path = folder ? `${folder}/${filename}` : filename

          const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(path, compressed, {
              contentType: `image/${ext}`,
              upsert: false,
            })

          if (uploadError) throw uploadError

          const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path)

          newImages.push({
            url: urlData.publicUrl,
            alt: file.name.replace(/\.[^.]+$/, ""),
            is_main: baseLength === 0 && newImages.length === 0,
            sort_order: baseLength + newImages.length,
            width: Math.round(width),
            height: Math.round(height),
            file_size: Math.round(compressed.size),
          })
        } catch (err) {
          console.error("Failed to upload", file.name, err)
          failedFiles.push(file.name)
        }
      }

      if (failedFiles.length > 0) {
        setUploadErrors(failedFiles)
      }

      onChange((prev) => [...prev, ...newImages])
      setUploading(false)
      setUploadProgress(null)
    },
    [onChange, bucket, folder]
  )

  const handleAddUrl = () => {
    const raw = externalUrl.trim()
    if (!raw) {
      setUrlError("Ingresá una URL")
      return
    }
    try {
      const parsed = new URL(raw)
      if (parsed.protocol !== "https:") {
        setUrlError("La URL debe usar https")
        return
      }
    } catch {
      setUrlError("URL inválida")
      return
    }
    setUrlError("")
    onChange((prev) => [
      ...prev,
      {
        url: raw,
        alt: raw,
        is_main: prev.length === 0,
        sort_order: prev.length,
      },
    ])
    setExternalUrl("")
  }

  const removeImage = async (index: number) => {
    const removed = imagesRef.current[index]

    if (removed?.url && isSupabaseStorageUrl(removed.url)) {
      try {
        const supabase = (await import("@/lib/supabase/client")).createClient()
        const storagePath = extractStoragePath(removed.url)
        if (storagePath) {
          await supabase.storage.from(bucket).remove([storagePath])
        }
      } catch (err) {
        console.error("Failed to delete image from storage:", err)
      }
    }

    onChange((prev) => {
      const updated = prev.filter((_, i) => i !== index)
      if (updated.length > 0 && !updated.some((img) => img.is_main)) {
        updated[0].is_main = true
      }
      return updated
    })
  }

  const setMain = (index: number) => {
    onChange((prev) =>
      prev.map((img, i) => ({
        ...img,
        is_main: i === index,
      }))
    )
  }

  const moveImage = (from: number, to: number) => {
    onChange((prev) => {
      const updated = [...prev]
      const [moved] = updated.splice(from, 1)
      updated.splice(to, 0, moved)
      return updated.map((img, i) => ({ ...img, sort_order: i }))
    })
  }

  return (
    <div className="space-y-3">
      {/* Banner de progreso de subida */}
      {uploading && uploadProgress && (
        <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          {/* Spinner */}
          <svg
            className="h-5 w-5 shrink-0 animate-spin text-blue-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-blue-700">
                Subiendo imagen {uploadProgress.current} de {uploadProgress.total}
              </span>
              <span className="text-blue-500">
                {Math.round((uploadProgress.current / uploadProgress.total) * 100)}%
              </span>
            </div>
            <p className="mt-0.5 truncate text-xs text-blue-500">{uploadProgress.fileName}</p>
            {/* Barra de progreso */}
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-blue-200">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-300"
                style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Errores de subida */}
      {uploadErrors.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-700">
            {uploadErrors.length === 1
              ? "1 archivo falló al subir:"
              : `${uploadErrors.length} archivos fallaron al subir:`}
          </p>
          <ul className="mt-1 list-inside list-disc text-xs text-red-600">
            {uploadErrors.map((name, i) => (
              <li key={i} className="truncate">{name}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Agregar imagen por URL */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm font-medium text-gray-700">Agregar imagen por URL</p>
        <p className="mt-0.5 text-xs text-gray-500">Pegá un link directo (https) o de Google Drive. Se guarda tal cual.</p>
        <div className="mt-3 flex gap-2">
          <input
            type="url"
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
            placeholder="https://..."
            className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          />
          <button
            type="button"
            onClick={handleAddUrl}
            className="shrink-0 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Agregar URL
          </button>
        </div>
        {urlError && <p className="mt-2 text-xs text-red-600">{urlError}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((img, index) => (
          <div
            key={index}
            className={`relative aspect-square overflow-hidden rounded-lg border-2 ${
              img.is_main ? "border-gray-900" : "border-gray-200"
            }`}
          >
            <Image
              src={getDisplayImageUrl(img.url)}
              alt={img.alt}
              fill
              unoptimized={!isSupabaseStorageUrl(img.url)}
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-all hover:bg-black/40 hover:opacity-100">
              {!img.is_main && (
                <button
                  type="button"
                  onClick={() => setMain(index)}
                  className="rounded-full bg-white px-2 py-1 text-xs font-medium"
                  title="Principal"
                >
                  Principal
                </button>
              )}
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => moveImage(index, index - 1)}
                  className="rounded-full bg-white px-2 py-1 text-xs font-medium"
                >
                  ←
                </button>
              )}
              {index < images.length - 1 && (
                <button
                  type="button"
                  onClick={() => moveImage(index, index + 1)}
                  className="rounded-full bg-white px-2 py-1 text-xs font-medium"
                >
                  →
                </button>
              )}
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="rounded-full bg-red-500 px-2 py-1 text-xs font-medium text-white"
              >
                ×
              </button>
            </div>
            {img.is_main && (
              <span className="absolute left-2 top-2 rounded-full bg-gray-900 px-2 py-0.5 text-xs text-white">
                Principal
              </span>
            )}
          </div>
        ))}

        {/* Zona de agregar imagen */}
        <label
          className={`flex aspect-square cursor-pointer items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
            uploading
              ? "cursor-not-allowed border-blue-300 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
        >
          <div className="text-center">
            {uploading ? (
              <svg
                className="mx-auto h-8 w-8 animate-spin text-blue-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              <svg
                className="mx-auto h-8 w-8 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            )}
            <span className={`mt-1 block text-xs ${uploading ? "text-blue-500" : "text-gray-500"}`}>
              {uploading ? "Subiendo..." : "Agregar imagen"}
            </span>
          </div>
          <input
            type="file"
            accept="image/webp,image/jpeg,image/png"
            multiple
            className="hidden"
            disabled={uploading}
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
        </label>
      </div>
    </div>
  )
}
