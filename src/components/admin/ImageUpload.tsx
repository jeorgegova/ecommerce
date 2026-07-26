"use client"

import { compressImage } from "@/lib/utils/image"
import Image from "next/image"
import { useCallback, useState } from "react"

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
  onChange: (images: ImageItem[]) => void
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

  const handleFiles = useCallback(
    async (files: FileList) => {
      setUploading(true)
      const fileArray = Array.from(files)

      const supabase = (await import("@/lib/supabase/client")).createClient()

      const newImages: ImageItem[] = []

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
            is_main: images.length === 0 && newImages.length === 0,
            sort_order: images.length + newImages.length,
            width: Math.round(width),
            height: Math.round(height),
            file_size: Math.round(compressed.size),
          })
        } catch (err) {
          console.error("Failed to upload", file.name, err)
        }
      }

      onChange([...images, ...newImages])
      setUploading(false)
      setUploadProgress(null)
    },
    [images, onChange, bucket, folder]
  )

  const removeImage = async (index: number) => {
    const removed = images[index]

    // Si la imagen ya fue subida al storage, eliminarla
    if (removed.url) {
      try {
        const supabase = (await import("@/lib/supabase/client")).createClient()
        const match = new URL(removed.url).pathname.match(/\/object\/public\/[^/]+\/(.+)/)
        if (match) {
          await supabase.storage.from(bucket).remove([match[1]])
        }
      } catch (err) {
        console.error("Failed to delete image from storage:", err)
      }
    }

    const updated = images.filter((_, i) => i !== index)
    if (updated.length > 0 && !updated.some((img) => img.is_main)) {
      updated[0].is_main = true
    }
    onChange(updated)
  }


  const setMain = (index: number) => {
    onChange(
      images.map((img, i) => ({
        ...img,
        is_main: i === index,
      }))
    )
  }

  const moveImage = (from: number, to: number) => {
    const updated = [...images]
    const [moved] = updated.splice(from, 1)
    updated.splice(to, 0, moved)
    onChange(updated.map((img, i) => ({ ...img, sort_order: i })))
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

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((img, index) => (
          <div
            key={index}
            className={`relative aspect-square overflow-hidden rounded-lg border-2 ${
              img.is_main ? "border-gray-900" : "border-gray-200"
            }`}
          >
            <Image
              src={img.url}
              alt={img.alt}
              fill
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
