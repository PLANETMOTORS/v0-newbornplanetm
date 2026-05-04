"use client"

import { useState } from "react"
import {
  Sparkles, Loader2, Copy, Check, FileText,
  Share2, Megaphone, RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAdminVehicles } from "@/lib/admin/hooks/use-admin-vehicles"
import type { AdminVehicle } from "@/lib/admin/hooks/use-admin-vehicles"
import { VehiclePicker } from "@/components/admin/vehicle-picker"

type ContentType = "listing" | "social" | "ad"

const CONTENT_TABS: { type: ContentType; label: string; icon: typeof FileText; desc: string }[] = [
  { type: "listing", label: "Listing", icon: FileText, desc: "Website description" },
  { type: "social", label: "Social", icon: Share2, desc: "FB & IG posts" },
  { type: "ad", label: "Ad Copy", icon: Megaphone, desc: "Google/Meta ads" },
]

export default function AIWriterPage() {
  const { loading, search, setSearch, filtered } = useAdminVehicles()
  const [selectedVehicle, setSelectedVehicle] = useState<AdminVehicle | null>(null)
  const [contentType, setContentType] = useState<ContentType>("listing")
  const [generating, setGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState("")
  const [customPrompt, setCustomPrompt] = useState("")
  const [copied, setCopied] = useState(false)

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
            <CardContent>
              <VehiclePicker
                selected={selectedVehicle} filtered={filtered} loading={loading}
                search={search} onSearchChange={setSearch} accent="purple"
                showImages
                onSelect={(v) => { setSelectedVehicle(v); setGeneratedContent("") }}
              />
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
