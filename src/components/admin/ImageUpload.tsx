"use client"

import { compressImage, generateThumbnail } from "@/lib/utils/image"
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

  const handleFiles = useCallback(
    async (files: FileList) => {
      setUploading(true)

      const supabase = (await import("@/lib/supabase/client")).createClient()

      const newImages: ImageItem[] = []

      for (const file of Array.from(files)) {
        try {
          const { blob: compressed, width, height } = await compressImage(file)
          const { blob: thumbBlob } = await generateThumbnail(file)

          const ext = "webp"
          const timestamp = Date.now()
          const filename = `${timestamp}_${Math.random().toString(36).slice(2)}.${ext}`
          const thumbFilename = `thumb_${filename}`
          const path = folder ? `${folder}/${filename}` : filename
          const thumbPath = folder ? `${folder}/${thumbFilename}` : thumbFilename

          const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(path, compressed, {
              contentType: `image/${ext}`,
              upsert: false,
            })

          if (uploadError) throw uploadError

          const { error: thumbError } = await supabase.storage
            .from(bucket)
            .upload(thumbPath, thumbBlob, {
              contentType: `image/${ext}`,
              upsert: false,
            })

          if (thumbError) console.error("Thumbnail upload failed:", thumbError)

          const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path)

          newImages.push({
            url: urlData.publicUrl,
            alt: file.name.replace(/\.[^.]+$/, ""),
            is_main: images.length === 0 && newImages.length === 0,
            sort_order: images.length + newImages.length,
            width,
            height,
            file_size: compressed.size,
          })
        } catch (err) {
          console.error("Failed to upload", file.name, err)
        }
      }

      onChange([...images, ...newImages])
      setUploading(false)
    },
    [images, onChange, bucket, folder]
  )

  const removeImage = (index: number) => {
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
    <div>
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
                  onClick={() => setMain(index)}
                  className="rounded-full bg-white px-2 py-1 text-xs font-medium"
                  title="Principal"
                >
                  Principal
                </button>
              )}
              {index > 0 && (
                <button
                  onClick={() => moveImage(index, index - 1)}
                  className="rounded-full bg-white px-2 py-1 text-xs font-medium"
                >
                  ←
                </button>
              )}
              {index < images.length - 1 && (
                <button
                  onClick={() => moveImage(index, index + 1)}
                  className="rounded-full bg-white px-2 py-1 text-xs font-medium"
                >
                  →
                </button>
              )}
              <button
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

        <label className="flex aspect-square cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400">
          <div className="text-center">
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
            <span className="mt-1 block text-xs text-gray-500">
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
