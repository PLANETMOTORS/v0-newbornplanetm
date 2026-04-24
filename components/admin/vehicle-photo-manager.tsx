"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import {
  X, Upload, Trash2, Star, Loader2, ImagePlus,
  AlertCircle, CheckCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

// ─── Types ────────────────────────────────────────────────────────────────

interface VehiclePhotoManagerProps {
  vehicleId: string
  vehicleTitle: string
  onClose: () => void
  onPhotosChanged?: () => void
}

interface PhotoData {
  imageUrls: string[]
  primaryImageUrl: string | null
  has360Spin: boolean
  storageFiles: { name: string; size?: number; url: string }[]
}

// ─── Component ────────────────────────────────────────────────────────────

export default function VehiclePhotoManager({
  vehicleId,
  vehicleTitle,
  onClose,
  onPhotosChanged,
}: VehiclePhotoManagerProps) {
  const [photos, setPhotos] = useState<PhotoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [settingPrimary, setSettingPrimary] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ─── Fetch photos ────────────────────────────────────────────────────

  const fetchPhotos = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/v1/admin/vehicles/${vehicleId}/photos`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || "Failed to load photos")
        return
      }
      const data: PhotoData = await res.json()
      setPhotos(data)
    } catch {
      setError("Network error loading photos")
    } finally {
      setLoading(false)
    }
  }, [vehicleId])

  useEffect(() => { fetchPhotos() }, [fetchPhotos])

  // ─── Upload ──────────────────────────────────────────────────────────

  const handleUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    if (fileArray.length === 0) return

    // Validate
    const maxSize = 10 * 1024 * 1024
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"]
    for (const f of fileArray) {
      if (f.size > maxSize) {
        setError(`"${f.name}" exceeds 10 MB limit`)
        return
      }
      if (!allowedTypes.includes(f.type)) {
        setError(`"${f.name}" is not a supported format (JPEG, PNG, WebP, AVIF)`)
        return
      }
    }

    setUploading(true)
    setError(null)
    setUploadProgress(`Uploading ${fileArray.length} photo${fileArray.length > 1 ? "s" : ""}...`)

    try {
      const fd = new FormData()
      for (const f of fileArray) fd.append("photos", f)

      // Set as primary if vehicle has no photos yet
      const noCurrent = !photos?.imageUrls?.length
      if (noCurrent) fd.append("setPrimary", "true")

      const res = await fetch(`/api/v1/admin/vehicles/${vehicleId}/photos`, {
        method: "POST",
        body: fd,
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Upload failed")
        return
      }

      setSuccessMsg(data.message)
      setTimeout(() => setSuccessMsg(null), 3000)
      fetchPhotos()
      onPhotosChanged?.()
    } catch {
      setError("Network error during upload")
    } finally {
      setUploading(false)
      setUploadProgress(null)
    }
  }

  // ─── Delete ──────────────────────────────────────────────────────────

  const handleDelete = async (url: string) => {
    if (!confirm("Remove this photo? This cannot be undone.")) return
    setDeleting(url)
    setError(null)
    try {
      const res = await fetch(`/api/v1/admin/vehicles/${vehicleId}/photos`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || "Delete failed")
        return
      }
      setSuccessMsg("Photo removed")
      setTimeout(() => setSuccessMsg(null), 3000)
      fetchPhotos()
      onPhotosChanged?.()
    } catch {
      setError("Network error during delete")
    } finally {
      setDeleting(null)
    }
  }

  // ─── Set Primary ─────────────────────────────────────────────────────

  const handleSetPrimary = async (url: string) => {
    setSettingPrimary(url)
    setError(null)
    try {
      const res = await fetch(`/api/v1/admin/vehicles/${vehicleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primary_image_url: url }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || "Failed to set primary image")
        return
      }
      setSuccessMsg("Primary image updated")
      setTimeout(() => setSuccessMsg(null), 3000)
      fetchPhotos()
      onPhotosChanged?.()
    } catch {
      setError("Network error")
    } finally {
      setSettingPrimary(null)
    }
  }

  // ─── Drag & Drop ─────────────────────────────────────────────────────

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (uploading) return
    if (e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files)
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────

  const imageUrls = photos?.imageUrls || []
  const primaryUrl = photos?.primaryImageUrl

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b">
          <div>
            <h2 className="text-lg font-bold text-pm-text-primary">Manage Photos</h2>
            <p className="text-sm text-pm-text-secondary">{vehicleTitle}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Alerts */}
        <div className="px-6 pt-4 space-y-2">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
              <button onClick={() => setError(null)} className="ml-auto font-bold">&times;</button>
            </div>
          )}
          {successMsg && (
            <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              {successMsg}
            </div>
          )}
        </div>

        {/* Upload Area */}
        <div className="p-4 sm:p-6">
          <div
            className={`border-2 border-dashed rounded-xl p-4 sm:p-8 text-center transition-colors cursor-pointer ${
              dragOver
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-sm text-pm-text-secondary">{uploadProgress}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-pm-text-muted" />
                <p className="text-sm font-medium text-pm-text-secondary">
                  Drop photos here or click to upload
                </p>
                <p className="text-xs text-pm-text-muted">
                  JPEG, PNG, WebP, AVIF — max 10 MB per file
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleUpload(e.target.files)
                e.target.value = ""
              }}
              disabled={uploading}
            />
          </div>
        </div>

        {/* Photo Grid */}
        <div className="px-4 pb-4 sm:px-6 sm:pb-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-pm-text-muted animate-spin" />
            </div>
          ) : imageUrls.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-pm-text-muted">
              <ImagePlus className="w-12 h-12 mb-3" />
              <p className="text-sm font-medium">No photos yet</p>
              <p className="text-xs">Upload photos to get started</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-pm-text-secondary">
                  {imageUrls.length} photo{imageUrls.length !== 1 ? "s" : ""}
                </p>
                <div className="flex items-center gap-2 text-xs text-pm-text-muted">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span>= Primary image (shown on listing cards)</span>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {imageUrls.map((url, idx) => {
                  const isPrimary = url === primaryUrl
                  const isDeleting = deleting === url
                  const isSettingPrimary = settingPrimary === url

                  return (
                    <div
                      key={url}
                      className={`relative group rounded-lg overflow-hidden border-2 transition-colors ${
                        isPrimary ? "border-yellow-400" : "border-transparent hover:border-gray-300"
                      }`}
                    >
                      {/* Image */}
                      <div className="aspect-[4/3] relative bg-pm-surface-light">
                        <Image
                          src={url}
                          alt={`Photo ${idx + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                          unoptimized
                        />
                      </div>

                      {/* Primary badge */}
                      {isPrimary && (
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-yellow-400 text-yellow-900 text-xs gap-1">
                            <Star className="w-3 h-3 fill-yellow-900" />
                            Primary
                          </Badge>
                        </div>
                      )}

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        {/* Set as primary */}
                        {!isPrimary && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 text-xs"
                            onClick={() => handleSetPrimary(url)}
                            disabled={isSettingPrimary}
                          >
                            {isSettingPrimary ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <>
                                <Star className="w-3 h-3 mr-1" />
                                Set Primary
                              </>
                            )}
                          </Button>
                        )}
                        {/* Delete */}
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-8 text-xs"
                          onClick={() => handleDelete(url)}
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              <Trash2 className="w-3 h-3 mr-1" />
                              Delete
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Index label */}
                      <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                        {idx + 1}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-t">
          <p className="text-xs text-pm-text-muted hidden sm:block">
            Photos are stored in Supabase Storage and served via CDN
          </p>
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  )
}
