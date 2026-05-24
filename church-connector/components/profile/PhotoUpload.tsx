'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

interface PhotoUploadProps {
  currentUrl?: string | null
  onUpload: (url: string) => void
  userId: string
}

export function PhotoUpload({ currentUrl, onUpload, userId }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return

      setError(null)
      setUploading(true)

      // Local preview
      const objectUrl = URL.createObjectURL(file)
      setPreview(objectUrl)

      try {
        const supabase = createClient()
        const ext = file.name.split('.').pop()
        const path = `${userId}/profile.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(path, file, { upsert: true })

        if (uploadError) throw uploadError

        const { data } = supabase.storage.from('profile-photos').getPublicUrl(path)
        onUpload(data.publicUrl)
      } catch (err) {
        setError('Upload failed. Please try again.')
        setPreview(currentUrl ?? null)
      } finally {
        setUploading(false)
      }
    },
    [userId, currentUrl, onUpload]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false,
  })

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        {...getRootProps()}
        className={`relative w-32 h-32 rounded-full border-2 border-dashed cursor-pointer transition-colors flex items-center justify-center overflow-hidden ${
          isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-stone-300 bg-stone-50 hover:border-indigo-400'
        }`}
      >
        <input {...getInputProps()} />
        {preview ? (
          <Image src={preview} alt="Profile photo" fill className="object-cover" />
        ) : (
          <div className="text-center px-2">
            <div className="text-2xl mb-1">📷</div>
            <p className="text-xs text-stone-500">Drop photo here</p>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      <p className="text-xs text-stone-500 text-center">
        {preview ? 'Click or drag to change photo' : 'A photo is required'}
      </p>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
