"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import {
  Sparkles, Loader2, CheckCircle, AlertCircle, RefreshCw,
  Car, ImageIcon, Search, PlayCircle, XCircle, ChevronLeft,
  ChevronRight, X as XIcon, Images
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface Vehicle {
  id: string
  vin: string
  stock_number: string
  year: number
  make: string
  model: string
  trim: string | null
  primary_image_url: string | null
  image_urls: string[] | null
  status: string
}

type ProcessingStatus = "idle" | "processing" | "done" | "error"

interface VehicleProcessState {
  status: ProcessingStatus
  bgRemoved?: number
  totalImages?: number
  skipped?: number
  failed?: number
  error?: string
}

export default function AdminBackgroundsPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 20

  // Processing state per vehicle
  const [processState, setProcessState] = useState<Record<string, VehicleProcessState>>({})

  // Batch processing
  const [batchRunning, setBatchRunning] = useState(false)
  const [batchProgress, setBatchProgress] = useState({ done: 0, total: 0 })

  // Image gallery viewer
  const [expandedVehicleId, setExpandedVehicleId] = useState<string | null>(null)
  const [galleryIndex, setGalleryIndex] = useState(0)

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(searchQuery); setPage(0) }, 300)
    return () => clearTimeout(t)
  }, [searchQuery])

  // Fetch vehicles
  const fetchVehicles = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
        sort: "updated_at",
        order: "desc",
      })
      if (debouncedSearch) params.set("search", debouncedSearch)

      const res = await fetch(`/api/v1/admin/vehicles?${params}`)
      if (!res.ok) return
      const data = await res.json()
      setVehicles(data.vehicles || [])
      setTotalCount(data.total || 0)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch])

  useEffect(() => { fetchVehicles() }, [fetchVehicles])

  // Process single vehicle
  const processVehicle = async (vehicleId: string) => {
    setProcessState(prev => ({ ...prev, [vehicleId]: { status: "processing" } }))
    try {
      const res = await fetch(`/api/v1/admin/vehicles/${vehicleId}/remove-bg`, { method: "POST" })
      const data = await res.json()
      if (res.ok) {
        setProcessState(prev => ({
          ...prev,
          [vehicleId]: {
            status: "done",
            bgRemoved: data.bgRemoved,
            totalImages: data.totalImages,
            skipped: data.skipped,
            failed: data.failed,
          },
        }))
      } else {
        setProcessState(prev => ({
          ...prev,
          [vehicleId]: { status: "error", error: data.error || "Failed" },
        }))
      }
    } catch {
      setProcessState(prev => ({
        ...prev,
        [vehicleId]: { status: "error", error: "Network error" },
      }))
    }
  }

  // Batch process all visible vehicles
  const processAll = async () => {
    const toProcess = vehicles.filter(v =>
      (v.image_urls?.length ?? 0) > 0 && processState[v.id]?.status !== "processing"
    )
    if (toProcess.length === 0) return

    setBatchRunning(true)
    setBatchProgress({ done: 0, total: toProcess.length })

    for (const [i, vehicle] of toProcess.entries()) {
      await processVehicle(vehicle.id)
      setBatchProgress({ done: i + 1, total: toProcess.length })
    }

    setBatchRunning(false)
    fetchVehicles()
  }

  const stopBatch = () => {
    setBatchRunning(false)
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const doneCount = Object.values(processState).filter(s => s.status === "done").length
  const errorCount = Object.values(processState).filter(s => s.status === "error").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.01em] text-gray-900">
            Background Removal
          </h1>
          <p className="text-gray-500">
            Remove backgrounds and apply studio backdrop to vehicle photos
          </p>
        </div>
        <div className="flex items-center gap-2">
          {batchRunning ? (
            <Button variant="destructive" size="sm" onClick={stopBatch}>
              <XCircle className="w-4 h-4 mr-1.5" />
              Stop
            </Button>
          ) : (
            <Button onClick={processAll} disabled={loading || vehicles.length === 0}>
              <PlayCircle className="w-4 h-4 mr-1.5" />
              Process All ({vehicles.length})
            </Button>
          )}
        </div>
      </div>
      {/* Stats Bar */}
      {(doneCount > 0 || errorCount > 0) && (
        <div className="flex items-center gap-4 text-sm">
          {doneCount > 0 && (
            <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle className="w-3.5 h-3.5 mr-1" />
              {doneCount} processed
            </Badge>
          )}
          {errorCount > 0 && (
            <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-200">
              <AlertCircle className="w-3.5 h-3.5 mr-1" />
              {errorCount} failed
            </Badge>
          )}
        </div>
      )}

      {/* Batch Progress */}
      {batchRunning && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500 shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium">
                    Processing {batchProgress.done} of {batchProgress.total} vehicles…
                  </span>
                  <span className="text-sm text-gray-500">
                    {Math.round((batchProgress.done / batchProgress.total) * 100)}%
                  </span>
                </div>
                <Progress value={(batchProgress.done / batchProgress.total) * 100} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by VIN, stock#, make, model…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="ghost" size="sm" onClick={fetchVehicles} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
        <span className="text-sm text-gray-500">
          {totalCount} vehicle{totalCount === 1 ? "" : "s"}
        </span>
      </div>

      {/* Vehicle Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : vehicles.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Car className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="font-medium">No vehicles found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {vehicles.map((v) => {
            const state = processState[v.id] || { status: "idle" as const }
            const photoCount = v.image_urls?.length ?? 0
            return (
              <Card key={v.id} className="overflow-hidden">
                {/* Thumbnail */}
                <div className="relative h-44 bg-gray-100">
                  {v.primary_image_url ? (
                    <Image
                      src={v.primary_image_url}
                      alt={`${v.year} ${v.make} ${v.model}`}
                      fill
                      className="object-cover"
                      sizes="(max-width:768px)100vw,(max-width:1280px)50vw,33vw"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <ImageIcon className="w-10 h-10 text-gray-300" />
                    </div>
                  )}
                  {/* Status overlay */}
                  {state.status === "processing" && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="bg-white rounded-lg px-4 py-2 flex items-center gap-2 shadow-lg">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                        <span className="text-sm font-medium">Processing…</span>
                      </div>
                    </div>
                  )}
                  {state.status === "done" && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-green-500 text-white border-0">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {state.bgRemoved}/{state.totalImages}
                      </Badge>
                    </div>
                  )}
                  {state.status === "error" && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="destructive">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Failed
                      </Badge>
                    </div>
                  )}
                </div>

                <CardContent className="p-4 space-y-3">
                  {/* Vehicle info */}
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm truncate">
                      {v.year} {v.make} {v.model} {v.trim || ""}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Stock# {v.stock_number}
                    </p>
                    {state.status === "done" && state.skipped ? (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {state.skipped} spin frame{state.skipped === 1 ? "" : "s"} skipped
                      </p>
                    ) : null}
                    {state.status === "error" && (
                      <p className="text-xs text-red-500 mt-1 break-words">{state.error}</p>
                    )}
                  </div>
                  {/* Action row — button + photo count side by side */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={state.status === "done" ? "outline" : "default"}
                      disabled={state.status === "processing" || photoCount === 0}
                      onClick={() => processVehicle(v.id)}
                      className="flex-1"
                    >
                      {state.status === "processing" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4 mr-1.5" />
                      )}
                      {state.status === "done" ? "Redo" : state.status === "processing" ? "Processing…" : "Remove BG"}
                    </Button>
                    {photoCount > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="shrink-0 text-gray-500"
                        onClick={() => {
                          setExpandedVehicleId(expandedVehicleId === v.id ? null : v.id)
                          setGalleryIndex(0)
                        }}
                      >
                        <Images className="w-4 h-4 mr-1" />
                        {photoCount}
                      </Button>
                    )}
                  </div>

                  {/* Expanded image gallery */}
                  {expandedVehicleId === v.id && v.image_urls && v.image_urls.length > 0 && (
                    <div className="border-t pt-3 space-y-2">
                      <div className="relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
                        <Image
                          src={v.image_urls[galleryIndex]}
                          alt={`Photo ${galleryIndex + 1} of ${v.year} ${v.make} ${v.model}`}
                          fill
                          className="object-contain"
                          sizes="(max-width:768px)100vw,400px"
                        />
                        {/* Navigation arrows */}
                        {v.image_urls.length > 1 && (
                          <>
                            <button
                              onClick={() => setGalleryIndex(i => (i - 1 + v.image_urls!.length) % v.image_urls!.length)}
                              className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setGalleryIndex(i => (i + 1) % v.image_urls!.length)}
                              className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <span className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                          {galleryIndex + 1} / {v.image_urls.length}
                        </span>
                      </div>
                      {/* Thumbnail strip */}
                      <div className="flex gap-1 overflow-x-auto pb-1">
                        {v.image_urls.map((url, idx) => (
                          <button
                            key={idx}
                            onClick={() => setGalleryIndex(idx)}
                            className={`relative w-12 h-9 rounded shrink-0 overflow-hidden border-2 transition-colors ${
                              idx === galleryIndex ? "border-blue-500" : "border-transparent hover:border-gray-300"
                            }`}
                          >
                            <Image
                              src={url}
                              alt={`Thumb ${idx + 1}`}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-500">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages - 1}
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
