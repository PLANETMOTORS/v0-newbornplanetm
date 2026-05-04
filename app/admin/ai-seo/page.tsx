"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import {
  Search as SearchIcon, Loader2, Copy, Check, Car,
  Globe, Tag, FileCode, RefreshCw, ChevronDown, CheckCircle, AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Vehicle {
  id: string; stock_number: string; year: number; make: string; model: string
  trim: string | null; body_style: string | null; exterior_color: string | null
  fuel_type: string | null; mileage: number; price: number; drivetrain: string | null
  is_ev: boolean; ev_battery_health_percent: number | null
  primary_image_url: string | null; status: string
}

interface SeoResult {
  metaTitle: string; metaDescription: string; ogTitle: string; ogDescription: string
  keywords: string[]; structuredDataSnippet: string
}

export default function AISEOPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [generating, setGenerating] = useState(false)
  const [seoResult, setSeoResult] = useState<SeoResult | null>(null)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState<string | null>(null)
  const [showPicker, setShowPicker] = useState(false)

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
    const q = search.toLowerCase()
    return `${v.year} ${v.make} ${v.model} ${v.trim || ""} ${v.stock_number}`.toLowerCase().includes(q)
  })

  const generate = async () => {
    if (!selectedVehicle) return
    setGenerating(true); setSeoResult(null); setError("")
    try {
      const res = await fetch("/api/v1/admin/ai-seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicle: selectedVehicle }),
      })
      const data = await res.json()
      if (res.ok && data.seo) { setSeoResult(data.seo) }
      else { setError(data.error || "Failed to generate SEO metadata") }
    } catch { setError("Network error") }
    finally { setGenerating(false) }
  }

  const copyField = (field: string, value: string) => {
    navigator.clipboard.writeText(value)
    setCopied(field); setTimeout(() => setCopied(null), 2000)
  }

  const SeoField = ({ label, value, field, icon: Icon, charLimit }: {
    label: string; value: string; field: string; icon: typeof Globe; charLimit?: number
  }) => (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5" />{label}
        </label>
        <div className="flex items-center gap-2">
          {charLimit && (
            <span className={`text-[10px] ${value.length > charLimit ? "text-red-500" : "text-green-600"}`}>
              {value.length}/{charLimit}
            </span>
          )}
          <button type="button" onClick={() => copyField(field, value)} className="text-gray-400 hover:text-gray-600">
            {copied === field ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
      <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-800">{value}</div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Globe className="w-7 h-7 text-blue-600" /> AI SEO
        </h1>
        <p className="text-gray-500 mt-1">Generate optimized meta titles, descriptions, and keywords</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Vehicle picker */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700">Select Vehicle</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedVehicle ? (
                <button type="button" onClick={() => setShowPicker(!showPicker)}
                  className="w-full flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-left hover:bg-blue-100">
                  {selectedVehicle.primary_image_url
                    ? <Image src={selectedVehicle.primary_image_url} alt="" width={60} height={45} className="rounded object-cover" />
                    : <div className="w-[60px] h-[45px] bg-gray-200 rounded flex items-center justify-center"><Car className="w-5 h-5 text-gray-400" /></div>}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}</p>
                    <p className="text-xs text-gray-500">Stock# {selectedVehicle.stock_number}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
              ) : (
                <button type="button" onClick={() => setShowPicker(true)}
                  className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500 hover:border-blue-400 hover:text-blue-600">
                  <Car className="w-8 h-8 mx-auto mb-1" /><p className="text-sm font-medium">Choose a vehicle</p>
                </button>
              )}
              {showPicker && (
                <div className="border rounded-lg max-h-64 overflow-y-auto bg-white shadow-lg">
                  <div className="sticky top-0 bg-white p-2 border-b">
                    <div className="relative">
                      <SearchIcon className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
                      <Input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9 text-sm" />
                    </div>
                  </div>
                  {loading ? <div className="p-4 text-center text-sm text-gray-400">Loading…</div>
                    : filtered.slice(0, 50).map(v => (
                    <button key={v.id} type="button"
                      onClick={() => { setSelectedVehicle(v); setShowPicker(false); setSeoResult(null) }}
                      className="w-full flex items-center gap-3 p-2.5 hover:bg-gray-50 text-left border-b last:border-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{v.year} {v.make} {v.model}</p>
                        <p className="text-xs text-gray-400">{v.stock_number}</p>
                      </div>
                      {v.is_ev && <Badge variant="outline" className="text-[10px]">EV</Badge>}
                    </button>
                  ))}
                </div>
              )}
              <Button onClick={generate} disabled={!selectedVehicle || generating} className="w-full bg-blue-600 hover:bg-blue-700">
                {generating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating…</> : <><SearchIcon className="w-4 h-4 mr-2" />Generate SEO</>}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right — SEO Output */}
        <div className="lg:col-span-2">
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4 flex items-center gap-2 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4" />{error}
              </CardContent>
            </Card>
          )}
          {seoResult ? (
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />SEO Metadata Generated
                </CardTitle>
                <Button variant="outline" size="sm" onClick={generate} disabled={generating}>
                  <RefreshCw className={`w-3.5 h-3.5 mr-1 ${generating ? "animate-spin" : ""}`} />Regenerate
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <SeoField label="Meta Title" value={seoResult.metaTitle} field="metaTitle" icon={Globe} charLimit={60} />
                <SeoField label="Meta Description" value={seoResult.metaDescription} field="metaDesc" icon={FileCode} charLimit={155} />
                <SeoField label="OG Title (Social)" value={seoResult.ogTitle} field="ogTitle" icon={Globe} charLimit={60} />
                <SeoField label="OG Description (Social)" value={seoResult.ogDescription} field="ogDesc" icon={Globe} charLimit={110} />
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500 flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" />Keywords</label>
                  <div className="flex flex-wrap gap-1.5">
                    {seoResult.keywords.map((kw, i) => (
                      <Badge key={i} variant="secondary" className="text-xs cursor-pointer hover:bg-gray-200"
                        onClick={() => copyField(`kw-${i}`, kw)}>
                        {kw} {copied === `kw-${i}` && <Check className="w-3 h-3 ml-1 text-green-600" />}
                      </Badge>
                    ))}
                  </div>
                </div>
                <SeoField label="Rich Snippet" value={seoResult.structuredDataSnippet} field="snippet" icon={FileCode} />
              </CardContent>
            </Card>
          ) : !error && (
            <Card><CardContent className="p-12 text-center">
              <Globe className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">Select a vehicle to generate SEO metadata</p>
              <p className="text-sm text-gray-300 mt-1">AI optimizes titles, descriptions, and keywords for search engines</p>
            </CardContent></Card>
          )}
        </div>
      </div>
    </div>
  )
}
