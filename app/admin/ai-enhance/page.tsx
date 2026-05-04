"use client"

import { useState } from "react"
import Image from "next/image"
import {
  ZoomIn, Loader2, Download,
  CheckCircle, AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAdminVehicles, getVehiclePhotos } from "@/lib/admin/hooks/use-admin-vehicles"
import type { AdminVehicle } from "@/lib/admin/hooks/use-admin-vehicles"
import { VehiclePicker } from "@/components/admin/vehicle-picker"

interface EnhanceResult { originalUrl: string; enhancedUrl: string; scale: number }

export default function AIEnhancePage() {
  const { loading, error: vehiclesError, search, setSearch, filtered } = useAdminVehicles()
  const [selectedVehicle, setSelectedVehicle] = useState<AdminVehicle | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [enhancing, setEnhancing] = useState(false)
  const [result, setResult] = useState<EnhanceResult | null>(null)
  const [error, setError] = useState("")
  const [scale, setScale] = useState(4)

  const photos = getVehiclePhotos(selectedVehicle)

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
            <CardContent>
              <VehiclePicker
                selected={selectedVehicle} filtered={filtered} loading={loading}
                error={vehiclesError}
                search={search} onSearchChange={setSearch} accent="emerald"
                showPhotoCount maxItems={30}
                onSelect={(v) => { setSelectedVehicle(v); setSelectedPhoto(null); setResult(null) }}
              />
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
