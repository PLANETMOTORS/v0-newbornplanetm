"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import {
  Sparkles, Loader2, Copy, Check, Search, Car, FileText,
  Share2, Megaphone, RefreshCw, ChevronDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Vehicle {
  id: string; vin: string; stock_number: string
  year: number; make: string; model: string; trim: string | null
  body_style: string | null; exterior_color: string | null; interior_color: string | null
  engine: string | null; transmission: string | null; drivetrain: string | null
  fuel_type: string | null; mileage: number; price: number
  is_ev: boolean; battery_capacity_kwh: number | null
  range_miles: number | null; ev_battery_health_percent: number | null
  primary_image_url: string | null; status: string
}

type ContentType = "listing" | "social" | "ad"

const CONTENT_TABS: { type: ContentType; label: string; icon: typeof FileText; desc: string }[] = [
  { type: "listing", label: "Listing", icon: FileText, desc: "Website description" },
  { type: "social", label: "Social", icon: Share2, desc: "FB & IG posts" },
  { type: "ad", label: "Ad Copy", icon: Megaphone, desc: "Google/Meta ads" },
]

export default function AIWriterPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [contentType, setContentType] = useState<ContentType>("listing")
  const [generating, setGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState("")
  const [customPrompt, setCustomPrompt] = useState("")
  const [copied, setCopied] = useState(false)
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
    return `${v.year} ${v.make} ${v.model} ${v.trim || ""} ${v.vin} ${v.stock_number}`
      .toLowerCase().includes(q)
  })

  const generate = async () => {
    if (!selectedVehicle) return
    setGenerating(true); setGeneratedContent("")
    try {
      const res = await fetch("/api/v1/admin/ai-writer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicle: selectedVehicle, contentType,
          customPrompt: customPrompt || undefined,
        }),
      })
      const data = await res.json()
      setGeneratedContent(res.ok ? data.content : `Error: ${data.error}`)
    } catch { setGeneratedContent("Network error. Please try again.") }
    finally { setGenerating(false) }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Sparkles className="w-7 h-7 text-purple-600" /> AI Writer
        </h1>
        <p className="text-gray-500 mt-1">Generate professional descriptions, social posts, and ad copy</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: Vehicle Picker + Options ── */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700">1. Select Vehicle</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedVehicle ? (
                <button type="button" onClick={() => setShowPicker(!showPicker)}
                  className="w-full flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg text-left hover:bg-purple-100">
                  {selectedVehicle.primary_image_url ? (
                    <Image src={selectedVehicle.primary_image_url} alt="" width={60} height={45} className="rounded object-cover" />
                  ) : <div className="w-[60px] h-[45px] bg-gray-200 rounded flex items-center justify-center"><Car className="w-5 h-5 text-gray-400" /></div>}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}</p>
                    <p className="text-xs text-gray-500">Stock# {selectedVehicle.stock_number}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
              ) : (
                <button type="button" onClick={() => setShowPicker(true)}
                  className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500 hover:border-purple-400 hover:text-purple-600">
                  <Car className="w-8 h-8 mx-auto mb-1" /><p className="text-sm font-medium">Choose a vehicle</p>
                </button>
              )}
              {showPicker && (
                <div className="border rounded-lg max-h-64 overflow-y-auto bg-white shadow-lg">
                  <div className="sticky top-0 bg-white p-2 border-b">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
                      <Input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9 text-sm" />
                    </div>
                  </div>
                  {loading ? <div className="p-4 text-center text-sm text-gray-400">Loading…</div>
                    : filtered.length === 0 ? <div className="p-4 text-center text-sm text-gray-400">No vehicles</div>
                    : filtered.slice(0, 50).map(v => (
                      <button key={v.id} type="button"
                        onClick={() => { setSelectedVehicle(v); setShowPicker(false); setGeneratedContent("") }}
                        className="w-full flex items-center gap-3 p-2.5 hover:bg-gray-50 text-left border-b last:border-0">
                        {v.primary_image_url
                          ? <Image src={v.primary_image_url} alt="" width={48} height={36} className="rounded object-cover" />
                          : <div className="w-12 h-9 bg-gray-100 rounded flex items-center justify-center"><Car className="w-4 h-4 text-gray-300" /></div>}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{v.year} {v.make} {v.model}</p>
                          <p className="text-xs text-gray-400">{v.stock_number}</p>
                        </div>
                        {v.is_ev && <Badge variant="outline" className="text-[10px]">EV</Badge>}
                      </button>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Content type selector */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700">2. Content Type</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {CONTENT_TABS.map(tab => (
                <button key={tab.type} type="button" onClick={() => { setContentType(tab.type); setGeneratedContent("") }}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${contentType === tab.type ? "bg-purple-50 border border-purple-200" : "hover:bg-gray-50 border border-transparent"}`}>
                  <tab.icon className={`w-5 h-5 ${contentType === tab.type ? "text-purple-600" : "text-gray-400"}`} />
                  <div><p className="text-sm font-medium">{tab.label}</p><p className="text-xs text-gray-400">{tab.desc}</p></div>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* ── Right: Generation + Output ── */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700">3. Generate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Custom instructions (optional)…" value={customPrompt} onChange={e => setCustomPrompt(e.target.value)} className="text-sm" />
              <Button onClick={generate} disabled={!selectedVehicle || generating} className="w-full bg-purple-600 hover:bg-purple-700">
                {generating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating…</> : <><Sparkles className="w-4 h-4 mr-2" />Generate {CONTENT_TABS.find(t => t.type === contentType)?.label}</>}
              </Button>
            </CardContent>
          </Card>

          {generatedContent && (
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-700">Output</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={generate} disabled={generating}>
                    <RefreshCw className={`w-3.5 h-3.5 mr-1 ${generating ? "animate-spin" : ""}`} />Regenerate
                  </Button>
                  <Button variant="outline" size="sm" onClick={copyToClipboard}>
                    {copied ? <><Check className="w-3.5 h-3.5 mr-1 text-green-600" />Copied!</> : <><Copy className="w-3.5 h-3.5 mr-1" />Copy</>}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-sm leading-relaxed text-gray-800 max-h-[500px] overflow-y-auto">
                  {generatedContent}
                </div>
              </CardContent>
            </Card>
          )}

          {!selectedVehicle && !generatedContent && (
            <Card><CardContent className="p-12 text-center">
              <Sparkles className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">Select a vehicle to get started</p>
              <p className="text-sm text-gray-300 mt-1">AI will generate content based on the vehicle&apos;s specs</p>
            </CardContent></Card>
          )}
        </div>
      </div>
    </div>
  )
}
