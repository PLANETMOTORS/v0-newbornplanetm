"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import Image from "next/image"
import {
  Upload, Camera, CheckCircle, AlertCircle, Loader2,
  Trash2, Eye, RefreshCw, Info
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DRIVEE_VIN_MAP } from "@/lib/drivee"
import { FRAME_MANIFEST } from "@/lib/drivee-frames"

interface VehicleInfo {
  mid: string
  frameCount: number
  firstFrameUrl: string | null
}

interface UploadResult {
  mid: string
  vehicleName: string
  frameCount: number
  frames: string[]
  errors?: string[]
  message: string
}

export default function Admin360UploadPage() {
  // Upload form state
  const [mid, setMid] = useState("")
  const [vehicleName, setVehicleName] = useState("")
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Existing vehicles state
  const [vehicles, setVehicles] = useState<VehicleInfo[]>([])
  const [loadingVehicles, setLoadingVehicles] = useState(true)
  const [isDragOver, setIsDragOver] = useState(false)

  // Reverse lookup: MID → VIN(s) + vehicle names from static config
  const midToVins: Record<string, string[]> = {}
  for (const [vin, mappedMid] of Object.entries(DRIVEE_VIN_MAP)) {
    if (!midToVins[mappedMid]) midToVins[mappedMid] = []
    midToVins[mappedMid].push(vin)
  }

  // Load existing vehicles from API
  const loadVehicles = useCallback(async () => {
    setLoadingVehicles(true)
    try {
      const res = await fetch("/api/v1/admin/360-upload")
      if (res.ok) {
        const data = await res.json()
        setVehicles(data.vehicles ?? [])
      }
    } catch (err) {
      console.error("[360-upload] Failed to load vehicles list:", err)
    } finally {
      setLoadingVehicles(false)
    }
  }, [])

  useEffect(() => {
    loadVehicles()
  }, [loadVehicles])

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = Array.from(e.dataTransfer.files).filter(
      f => f.type === "image/webp"
    )
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files])
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files])
    }
    // Reset input so re-selecting same files works
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const clearFiles = () => {
    setSelectedFiles([])
    setUploadResult(null)
    setUploadError(null)
  }

  // Upload handler
  const handleUpload = async () => {
    if (!mid || !vehicleName || selectedFiles.length === 0) return

    setUploading(true)
    setUploadResult(null)
    setUploadError(null)

    try {
      const formData = new FormData()
      formData.append("mid", mid)
      formData.append("vehicleName", vehicleName)

      // Sort files by name before appending
      const sorted = [...selectedFiles].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true })
      )
      for (const file of sorted) {
        formData.append("frames", file)
      }

      const res = await fetch("/api/v1/admin/360-upload", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setUploadError(data.error ?? "Upload failed")
      } else {
        setUploadResult(data)
        // Refresh vehicle list
        loadVehicles()
      }
    } catch {
      setUploadError("Network error — please try again")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-[-0.01em] text-gray-900">360° Photo Upload</h1>
        <p className="text-gray-500">Upload walk-around frames for vehicles</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Form */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Frames
              </CardTitle>
              <CardDescription>
                Upload 360° walk-around photos for a vehicle. Files will be numbered
                sequentially (01.webp, 02.webp, etc.) based on sort order.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Vehicle Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="upload-mid" className="block text-sm font-medium text-gray-700 mb-1">
                    Media ID (MID)
                  </label>
                  <Input
                    id="upload-mid"
                    placeholder="e.g. 190171976531"
                    value={mid}
                    onChange={e => setMid(e.target.value.replaceAll(/\D/g, ""))}
                    maxLength={15}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Numeric ID from Drivee dashboard or generate a new one
                  </p>
                </div>
                <div>
                  <label htmlFor="upload-vehicle-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle Name
                  </label>
                  <Input
                    id="upload-vehicle-name"
                    placeholder="e.g. 2024 Tesla Model 3"
                    value={vehicleName}
                    onChange={e => setVehicleName(e.target.value)}
                  />
                </div>
              </div>

              {/* Drop Zone */}
              <button
                type="button"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  w-full border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                  ${isDragOver
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                  }
                `}
              >
                <Camera className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-700">
                  Drag & drop frames here, or click to browse
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  WebP only • Max 5MB per frame • Files sorted by name
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".webp"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </button>

              {/* Selected Files */}
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-700">
                      {selectedFiles.length} frame{selectedFiles.length !== 1 ? "s" : ""} selected
                    </p>
                    <Button variant="ghost" size="sm" onClick={clearFiles}>
                      <Trash2 className="w-4 h-4 mr-1" />
                      Clear all
                    </Button>
                  </div>
                  <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
                    {[...selectedFiles]
                      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
                      .map((file, i) => (
                        <div key={`${file.name}-${i}`} className="flex items-center justify-between px-3 py-2 text-sm">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-gray-400 font-mono text-xs w-6">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <span className="truncate">{file.name}</span>
                            <span className="text-gray-400 text-xs shrink-0">
                              {(file.size / 1024).toFixed(0)} KB
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              const originalIndex = selectedFiles.indexOf(file)
                              if (originalIndex >= 0) removeFile(originalIndex)
                            }}
                            className="text-gray-400 hover:text-red-500 shrink-0 ml-2"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Upload Button */}
              <Button
                onClick={handleUpload}
                disabled={uploading || !mid || !vehicleName || selectedFiles.length === 0}
                className="w-full"
                size="lg"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading {selectedFiles.length} frames...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload {selectedFiles.length} Frame{selectedFiles.length !== 1 ? "s" : ""}
                  </>
                )}
              </Button>

              {/* Upload Result */}
              {uploadResult && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-green-800">{uploadResult.message}</p>
                      <p className="text-sm text-green-600 mt-1">
                        MID: {uploadResult.mid} • {uploadResult.frameCount} frames uploaded
                      </p>
                      {uploadResult.errors && uploadResult.errors.length > 0 && (
                        <div className="mt-2 text-sm text-red-600">
                          <p className="font-medium">Errors:</p>
                          {uploadResult.errors.map((err) => (
                            <p key={err}>• {err}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Upload Error */}
              {uploadError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                    <p className="text-red-800">{uploadError}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* VIN Mapping Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                Link VIN to 360° Photos
              </CardTitle>
              <CardDescription>
                After uploading frames, the vehicle&apos;s VIN must be mapped to the MID
                so the 360° viewer appears on the VDP.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <p className="text-sm text-gray-700">
                  To enable the 360° viewer for a new vehicle, two files need a one-line edit:
                </p>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">1. Add VIN → MID mapping</p>
                    <code className="block text-xs bg-gray-900 text-green-400 p-2 rounded mt-1 overflow-x-auto">
                      {`// lib/drivee.ts — add inside DRIVEE_VIN_MAP`}<br />
                      {mid ? `"YOUR_VIN_HERE": "${mid}",  // ${vehicleName || "Vehicle Name"}` : `"VIN": "MID",  // Vehicle Name`}
                    </code>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">2. Add frame count to manifest</p>
                    <code className="block text-xs bg-gray-900 text-green-400 p-2 rounded mt-1 overflow-x-auto">
                      {`// lib/drivee-frames.ts — add inside FRAME_MANIFEST`}<br />
                      {mid
                        ? `"${mid}": ${selectedFiles.length || "??"},  // ${vehicleName || "Vehicle Name"}`
                        : `"MID": FRAME_COUNT,  // Vehicle Name`}
                    </code>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Note: New MIDs without a manifest entry will still be discoverable via automatic
                  probing, but this is slower. <strong className="text-red-600">If you are replacing frames
                  for an MID already in the manifest, you MUST update the frame count — the old
                  manifest value will override probing and the viewer will show broken frames.</strong>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Existing Vehicles Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Current 360° Vehicles</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadVehicles}
                  disabled={loadingVehicles}
                >
                  <RefreshCw className={`w-4 h-4 ${loadingVehicles ? "animate-spin" : ""}`} />
                </Button>
              </div>
              <CardDescription>
                {vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""} with 360° frames
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingVehicles ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : vehicles.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  No 360° vehicles found
                </p>
              ) : (
                <div className="space-y-3">
                  {vehicles.map(v => {
                    const manifestCount = FRAME_MANIFEST[v.mid]
                    const vins = midToVins[v.mid] ?? []
                    return (
                      <div
                        key={v.mid}
                        className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          {v.firstFrameUrl ? (
                            <div className="w-16 h-12 relative rounded overflow-hidden bg-gray-100 shrink-0">
                              <Image
                                src={v.firstFrameUrl}
                                alt={`MID ${v.mid}`}
                                fill
                                className="object-contain"
                                sizes="64px"
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-12 bg-gray-100 rounded flex items-center justify-center shrink-0">
                              <Camera className="w-5 h-5 text-gray-300" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 font-mono truncate">
                              {v.mid}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {v.frameCount} frames
                              </Badge>
                              {manifestCount != null && (
                                <Badge
                                  variant={manifestCount === v.frameCount ? "default" : "destructive"}
                                  className="text-xs"
                                >
                                  {manifestCount === v.frameCount ? "Synced" : `Manifest: ${manifestCount}`}
                                </Badge>
                              )}
                              {manifestCount == null && (
                                <Badge variant="outline" className="text-xs">
                                  No manifest
                                </Badge>
                              )}
                            </div>
                            {vins.length > 0 && (
                              <p className="text-xs text-gray-400 mt-1 truncate">
                                VIN: {vins[0]}{vins.length > 1 ? ` +${vins.length - 1}` : ""}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => {
                              setMid(v.mid)
                              setVehicleName("")
                            }}
                          >
                            <Upload className="w-3 h-3 mr-1" />
                            Replace
                          </Button>
                          {v.firstFrameUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-7"
                              asChild
                            >
                              <a
                                href={v.firstFrameUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                Preview
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
