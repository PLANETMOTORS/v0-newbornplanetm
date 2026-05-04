"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import {
  Video, Loader2, Car, Search, Download, ChevronDown,
  CheckCircle, AlertCircle, Play, Clapperboard
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Vehicle {
  id: string; stock_number: string; year: number; make: string; model: string
  trim: string | null; primary_image_url: string | null; image_urls: string[] | null
  is_ev: boolean; status: string
}

interface VideoResult { videoUrl: string; prompt: string; vehicle: string; duration: number }

export default function AIVideoPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<VideoResult | null>(null)
  const [error, setError] = useState("")
  const [showPicker, setShowPicker] = useState(false)
  const [prompt, setPrompt] = useState("")

  const fetchVehicles = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/admin/vehicles?limit=200")
      if (!res.ok) throw new Error("Failed")
      const data = await res.json()
      setVehicles(data.vehicles || [])
    } catch { /* ignore */ } finally { setLoading(false) }
  }, [])
  useEffect(() => { fetchVehicles() }, [fetchVehicles])

  const filtered = vehicles.filter(v => {
    if (!search) return true
    return `${v.year} ${v.make} ${v.model} ${v.stock_number}`.toLowerCase().includes(search.toLowerCase())
  })

  const photos = selectedVehicle?.image_urls || (selectedVehicle?.primary_image_url ? [selectedVehicle.primary_image_url] : [])

  const generate = async () => {
    if (!selectedPhoto || !selectedVehicle) return
    setGenerating(true); setResult(null); setError("")
    try {
      const res = await fetch("/api/v1/admin/ai-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: selectedPhoto,
          prompt: prompt || undefined,
          vehicleId: selectedVehicle.id,
          vehicleName: `${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`,
        }),
      })
      const data = await res.json()
      if (res.ok) setResult(data)
      else setError(data.error || "Video generation failed")
    } catch { setError("Network error") }
    finally { setGenerating(false) }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Clapperboard className="w-7 h-7 text-rose-600" /> AI Video
        </h1>
        <p className="text-gray-500 mt-1">Transform vehicle photos into cinematic video clips for social media</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Vehicle & Photo picker */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700">1. Select Vehicle</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedVehicle ? (
                <button type="button" onClick={() => setShowPicker(!showPicker)}
                  className="w-full flex items-center gap-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-left hover:bg-rose-100">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}</p>
                    <p className="text-xs text-gray-500">{photos.length} photos</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
              ) : (
                <button type="button" onClick={() => setShowPicker(true)}
                  className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500 hover:border-rose-400 hover:text-rose-600">
                  <Car className="w-8 h-8 mx-auto mb-1" /><p className="text-sm font-medium">Choose a vehicle</p>
                </button>
              )}
              {showPicker && (
                <div className="border rounded-lg max-h-48 overflow-y-auto bg-white shadow-lg">
                  <div className="sticky top-0 bg-white p-2 border-b">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
                      <Input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9 text-sm" />
                    </div>
                  </div>
                  {loading ? <div className="p-4 text-center text-sm text-gray-400">Loading…</div>
                    : filtered.slice(0, 30).map(v => (
                    <button key={v.id} type="button"
                      onClick={() => { setSelectedVehicle(v); setShowPicker(false); setSelectedPhoto(null); setResult(null) }}
                      className="w-full flex items-center gap-3 p-2.5 hover:bg-gray-50 text-left border-b last:border-0">
                      <p className="text-sm font-medium truncate flex-1">{v.year} {v.make} {v.model}</p>
                      <span className="text-xs text-gray-400">{(v.image_urls?.length || 0)} photos</span>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {photos.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-700">2. Select Photo (First Frame)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {photos.map((url, i) => (
                    <button key={i} type="button" onClick={() => { setSelectedPhoto(url); setResult(null) }}
                      className={`relative aspect-[4/3] rounded overflow-hidden border-2 ${selectedPhoto === url ? "border-rose-500" : "border-transparent hover:border-gray-300"}`}>
                      <Image src={url} alt={`Photo ${i + 1}`} fill className="object-cover" sizes="100px" />
                      {selectedPhoto === url && <div className="absolute inset-0 bg-rose-500/20 flex items-center justify-center"><CheckCircle className="w-5 h-5 text-rose-600" /></div>}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700">3. Generate Video</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Custom prompt (optional)…" value={prompt} onChange={e => setPrompt(e.target.value)} className="text-sm" />
              <p className="text-[11px] text-gray-400">Default: Slow cinematic camera pan, studio lighting, 4K</p>
              <Button onClick={generate} disabled={!selectedPhoto || generating} className="w-full bg-rose-600 hover:bg-rose-700">
                {generating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating (~2-5 min)…</> : <><Video className="w-4 h-4 mr-2" />Generate Video</>}
              </Button>
            </CardContent>
          </Card>
        </div>
        {/* Right — Preview + Result */}
        <div className="lg:col-span-2">
          {error && <Card className="border-red-200 bg-red-50 mb-4"><CardContent className="p-4 flex items-center gap-2 text-red-700 text-sm"><AlertCircle className="w-4 h-4" />{error}</CardContent></Card>}

          {generating && (
            <Card className="mb-4">
              <CardContent className="p-8 text-center">
                <Loader2 className="w-10 h-10 text-rose-400 mx-auto mb-3 animate-spin" />
                <p className="text-gray-600 font-medium">Generating video…</p>
                <p className="text-sm text-gray-400 mt-1">This typically takes 2-5 minutes. You can leave this page open.</p>
                <div className="mt-4 w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-rose-500 h-1.5 rounded-full animate-pulse" style={{ width: "60%" }} />
                </div>
              </CardContent>
            </Card>
          )}

          {result ? (
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />Video Generated ({result.duration}s)
                </CardTitle>
                <a href={result.videoUrl} target="_blank" rel="noopener noreferrer" download>
                  <Button variant="outline" size="sm"><Download className="w-3.5 h-3.5 mr-1" />Download MP4</Button>
                </a>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                  <video src={result.videoUrl} controls autoPlay loop muted playsInline
                    className="w-full h-full object-contain" />
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Prompt used:</p>
                  <p className="text-sm text-gray-700">{result.prompt}</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary" className="text-xs">{result.vehicle}</Badge>
                  <Badge variant="outline" className="text-xs">{result.duration}s clip</Badge>
                  <Badge variant="outline" className="text-xs">MP4</Badge>
                </div>
              </CardContent>
            </Card>
          ) : selectedPhoto && !generating ? (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-gray-700">Preview (First Frame)</CardTitle></CardHeader>
              <CardContent>
                <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                  <Image src={selectedPhoto} alt="Selected" fill className="object-contain" sizes="600px" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-black/40 flex items-center justify-center">
                      <Play className="w-8 h-8 text-white ml-1" />
                    </div>
                  </div>
                </div>
                <p className="text-center text-xs text-gray-400 mt-2">This photo will be the first frame of the AI-generated video</p>
              </CardContent>
            </Card>
          ) : !generating && (
            <Card><CardContent className="p-12 text-center">
              <Clapperboard className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">Select a vehicle and photo to create a video</p>
              <p className="text-sm text-gray-300 mt-1">AI transforms a still photo into a 5-second cinematic clip</p>
            </CardContent></Card>
          )}
        </div>
      </div>
    </div>
  )
}
