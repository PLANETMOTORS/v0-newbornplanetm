"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import {
  ZoomIn, Loader2, Car, Search, Download, ChevronDown,
  CheckCircle, AlertCircle, ArrowRight
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

interface EnhanceResult { originalUrl: string; enhancedUrl: string; scale: number }

export default function AIEnhancePage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [enhancing, setEnhancing] = useState(false)
  const [result, setResult] = useState<EnhanceResult | null>(null)
  const [error, setError] = useState("")
  const [showPicker, setShowPicker] = useState(false)
  const [scale, setScale] = useState(4)

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

  const enhance = async () => {
    if (!selectedPhoto || !selectedVehicle) return
    setEnhancing(true); setResult(null); setError("")
    try {
      const res = await fetch("/api/v1/admin/ai-enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleId: selectedVehicle.id, imageUrl: selectedPhoto, scale }),
      })
      const data = await res.json()
      if (res.ok) setResult({ originalUrl: selectedPhoto, enhancedUrl: data.enhancedUrl, scale })
      else setError(data.error || "Enhancement failed")
    } catch { setError("Network error") }
    finally { setEnhancing(false) }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ZoomIn className="w-7 h-7 text-emerald-600" /> AI Photo Enhance
        </h1>
        <p className="text-gray-500 mt-1">Upscale low-resolution photos to high quality using AI (Real-ESRGAN)</p>
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
                  className="w-full flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-left hover:bg-emerald-100">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}</p>
                    <p className="text-xs text-gray-500">{photos.length} photos</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
              ) : (
                <button type="button" onClick={() => setShowPicker(true)}
                  className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500 hover:border-emerald-400 hover:text-emerald-600">
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
                  {filtered.slice(0, 30).map(v => (
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
                <CardTitle className="text-sm font-medium text-gray-700">2. Select Photo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {photos.map((url, i) => (
                    <button key={i} type="button" onClick={() => { setSelectedPhoto(url); setResult(null) }}
                      className={`relative aspect-[4/3] rounded overflow-hidden border-2 ${selectedPhoto === url ? "border-emerald-500" : "border-transparent hover:border-gray-300"}`}>
                      <Image src={url} alt={`Photo ${i + 1}`} fill className="object-cover" sizes="100px" />
                      {selectedPhoto === url && <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center"><CheckCircle className="w-5 h-5 text-emerald-600" /></div>}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700">3. Upscale Factor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {[2, 4, 8].map(s => (
                  <Button key={s} variant={scale === s ? "default" : "outline"} size="sm"
                    onClick={() => setScale(s)} className={scale === s ? "bg-emerald-600 hover:bg-emerald-700" : ""}>
                    {s}x
                  </Button>
                ))}
              </div>
              <Button onClick={enhance} disabled={!selectedPhoto || enhancing} className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700">
                {enhancing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enhancing…</> : <><ZoomIn className="w-4 h-4 mr-2" />Enhance Photo</>}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right — Preview */}
        <div className="lg:col-span-2">
          {error && <Card className="border-red-200 bg-red-50 mb-4"><CardContent className="p-4 flex items-center gap-2 text-red-700 text-sm"><AlertCircle className="w-4 h-4" />{error}</CardContent></Card>}
          {result ? (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" />Enhanced ({result.scale}x upscale)</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-2 text-center">Original</p>
                    <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-100"><Image src={result.originalUrl} alt="Original" fill className="object-contain" sizes="400px" /></div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-2 text-center">Enhanced</p>
                    <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-100"><Image src={result.enhancedUrl} alt="Enhanced" fill className="object-contain" sizes="400px" /></div>
                  </div>
                </div>
                <div className="flex justify-center">
                  <a href={result.enhancedUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" />Download Enhanced</Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          ) : selectedPhoto ? (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-gray-700">Preview</CardTitle></CardHeader>
              <CardContent>
                <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 max-h-[400px]">
                  <Image src={selectedPhoto} alt="Selected" fill className="object-contain" sizes="600px" />
                </div>
                <p className="text-center text-xs text-gray-400 mt-2">Click &quot;Enhance Photo&quot; to upscale this image {scale}x</p>
              </CardContent>
            </Card>
          ) : (
            <Card><CardContent className="p-12 text-center">
              <ZoomIn className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">Select a vehicle and photo to enhance</p>
              <p className="text-sm text-gray-300 mt-1">AI will upscale low-res photos up to 8x using Real-ESRGAN</p>
            </CardContent></Card>
          )}
        </div>
      </div>
    </div>
  )
}
