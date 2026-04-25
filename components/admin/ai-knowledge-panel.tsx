"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Plus, Trash2, Save, Search, BookOpen, MessageSquare,
  Shield, FileText, AlertTriangle, ChevronDown, ChevronUp,
  Power, PowerOff, GripVertical, Filter
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

interface KnowledgeEntry {
  id: string
  agent_type: string
  category: string
  trigger_phrase: string
  response: string
  is_active: boolean
  priority: number
  tags: string[] | null
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

type Category = "qa" | "instruction" | "policy" | "script" | "objection"

const CATEGORIES: { value: Category; label: string; icon: typeof MessageSquare; color: string; description: string }[] = [
  { value: "qa", label: "Q&A", icon: MessageSquare, color: "text-blue-600 bg-blue-50", description: "When customer asks X, answer Y" },
  { value: "instruction", label: "Instructions", icon: BookOpen, color: "text-green-600 bg-green-50", description: "Custom behavior rules for the AI" },
  { value: "policy", label: "Policies", icon: Shield, color: "text-purple-600 bg-purple-50", description: "Business policy responses" },
  { value: "script", label: "Scripts", icon: FileText, color: "text-orange-600 bg-orange-50", description: "Scripted conversation flows" },
  { value: "objection", label: "Objection Handling", icon: AlertTriangle, color: "text-red-600 bg-red-50", description: "Handle common objections" },
]

const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map(c => [c.value, c]))

const TRIGGER_PLACEHOLDERS: Record<Category, string> = {
  qa: 'e.g., "Do you offer extended warranty?" or "What is your return policy?"',
  instruction: 'e.g., "Always greet customers in both English and French"',
  objection: 'e.g., "The price is too high" or "I can get a better deal elsewhere"',
  policy: 'Enter the trigger phrase or condition...',
  script: 'Enter the trigger phrase or condition...',
}

const RESPONSE_PLACEHOLDERS: Record<Category, string> = {
  qa: 'e.g., "Yes! Every vehicle comes with our PM Certified 210-point inspection and a 30-day/1,500 km powertrain warranty included at no extra charge."',
  objection: 'e.g., "I understand price is important. Our prices include certification, OMVIC fees, and a 10-day money-back guarantee — many dealers charge extra for these."',
  instruction: 'Enter the response or instruction details...',
  policy: 'Enter the response or instruction details...',
  script: 'Enter the response or instruction details...',
}

interface AIKnowledgePanelProps {
  agentType: "anna" | "negotiator" | "valuator"
  agentName: string
}

export default function AIKnowledgePanel({ agentType, agentName }: Readonly<AIKnowledgePanelProps>) {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [tableExists, setTableExists] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [showInactive, setShowInactive] = useState(false)

  // Form state for new/edit
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    category: "qa" as Category,
    trigger_phrase: "",
    response: "",
    priority: 0,
    tags: "",
  })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ agent_type: agentType })
      if (!showInactive) params.set("active_only", "true")
      const res = await fetch(`/api/v1/admin/ai-knowledge?${params}`)
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setEntries(data.entries || [])
      setTableExists(data.tableExists !== false)
    } catch (err) {
      console.error("Knowledge fetch error:", err)
    } finally {
      setLoading(false)
    }
  }, [agentType, showInactive])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  const resetForm = () => {
    setFormData({ category: "qa", trigger_phrase: "", response: "", priority: 0, tags: "" })
    setEditingId(null)
    setShowForm(false)
    setSaveError(null)
  }

  const startEditing = (entry: KnowledgeEntry) => {
    setEditingId(entry.id)
    setFormData({
      category: entry.category as Category,
      trigger_phrase: entry.trigger_phrase,
      response: entry.response,
      priority: entry.priority,
      tags: entry.tags?.join(", ") || "",
    })
    setShowForm(true)
    setSaveError(null)
  }

  const handleSave = async () => {
    if (!formData.trigger_phrase.trim() || !formData.response.trim()) {
      setSaveError("Both trigger phrase and response are required")
      return
    }

    try {
      setSaving(true)
      setSaveError(null)

      const payload = {
        ...formData,
        agent_type: agentType,
        tags: formData.tags ? formData.tags.split(",").map(t => t.trim()).filter(Boolean) : null,
        ...(editingId ? { id: editingId } : {}),
      }

      const res = await fetch("/api/v1/admin/ai-knowledge", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to save")
      }

      resetForm()
      fetchEntries()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (entry: KnowledgeEntry) => {
    try {
      await fetch("/api/v1/admin/ai-knowledge", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: entry.id, is_active: !entry.is_active }),
      })
      fetchEntries()
    } catch (err) {
      console.error("Toggle error:", err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this knowledge entry? This cannot be undone.")) return
    try {
      await fetch(`/api/v1/admin/ai-knowledge?id=${id}`, { method: "DELETE" })
      fetchEntries()
    } catch (err) {
      console.error("Delete error:", err)
    }
  }

  // Filter entries
  const filtered = entries.filter(e => {
    if (filterCategory !== "all" && e.category !== filterCategory) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return e.trigger_phrase.toLowerCase().includes(q) || e.response.toLowerCase().includes(q)
    }
    return true
  })

  if (!tableExists) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-amber-800">Knowledge Table Not Set Up</p>
              <p className="text-sm text-amber-700 mt-1">
                Run the migration <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs font-mono">scripts/019_create_ai_agent_knowledge.sql</code> in
                your Supabase SQL Editor to enable AI agent training.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header + Add button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            Knowledge & Training — {agentName}
          </h3>
          <p className="text-sm text-gray-500">
            Teach {agentName} specific responses. When a customer asks a matching question, the trained response takes priority.
          </p>
        </div>
        <Button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Knowledge
        </Button>
      </div>

      {/* Category quick-stats */}
      <div className="grid grid-cols-5 gap-2">
        {CATEGORIES.map(cat => {
          const count = entries.filter(e => e.category === cat.value).length
          const Icon = cat.icon
          return (
            <button
              key={cat.value}
              onClick={() => setFilterCategory(filterCategory === cat.value ? "all" : cat.value)}
              className={`p-3 rounded-lg border text-left transition-all ${
                filterCategory === cat.value
                  ? "ring-2 ring-indigo-500 border-indigo-300 bg-indigo-50"
                  : "hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`p-1 rounded ${cat.color.split(" ")[1]}`}>
                  <Icon className={`w-3.5 h-3.5 ${cat.color.split(" ")[0]}`} />
                </div>
                <span className="text-xs font-medium text-gray-700">{cat.label}</span>
              </div>
              <p className="text-lg font-bold text-gray-900 mt-1">{count}</p>
            </button>
          )
        })}
      </div>

      {/* Search + Filters */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search triggers or responses..."
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowInactive(!showInactive)}
          className={showInactive ? "border-amber-300 text-amber-700" : ""}
        >
          <Filter className="w-4 h-4 mr-1" />
          {showInactive ? "Showing All" : "Active Only"}
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card className="border-indigo-200 bg-indigo-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {editingId ? "Edit Knowledge Entry" : "Add New Knowledge Entry"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Category selector */}
            <fieldset>
              <legend className="text-sm font-medium text-gray-700 block mb-2">Category</legend>
              <div className="flex gap-2 flex-wrap">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.value}
                    onClick={() => setFormData({ ...formData, category: cat.value })}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      formData.category === cat.value
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-gray-600 border-gray-300 hover:border-indigo-300"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {CATEGORIES.find(c => c.value === formData.category)?.description}
              </p>
            </fieldset>

            {/* Trigger phrase */}
            <div>
              <label htmlFor="ai-kb-trigger" className="text-sm font-medium text-gray-700 block mb-1">
                {formData.category === "instruction" ? "Instruction / Rule" : "IF customer asks..."}
              </label>
              <textarea
                id="ai-kb-trigger"
                className="w-full border rounded-md p-3 text-sm min-h-[80px] resize-y"
                value={formData.trigger_phrase}
                onChange={e => setFormData({ ...formData, trigger_phrase: e.target.value })}
                placeholder={TRIGGER_PLACEHOLDERS[formData.category]}
              />
            </div>

            {/* Response */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                {formData.category === "instruction" ? "Details / Context" : "THEN respond with..."}
              </label>
              <textarea
                className="w-full border rounded-md p-3 text-sm min-h-[100px] resize-y"
                value={formData.response}
                onChange={e => setFormData({ ...formData, response: e.target.value })}
                placeholder={RESPONSE_PLACEHOLDERS[formData.category]}
              />
            </div>

            {/* Priority + Tags row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="ai-kb-priority" className="text-sm font-medium text-gray-700 block mb-1">Priority</label>
                <Input
                  id="ai-kb-priority"
                  type="number"
                  value={formData.priority}
                  onChange={e => setFormData({ ...formData, priority: Number.parseInt(e.target.value) || 0 })}
                  min={0}
                  max={100}
                />
                <p className="text-xs text-gray-400 mt-1">Higher number = matched first (0-100)</p>
              </div>
              <div>
                <label htmlFor="ai-kb-tags" className="text-sm font-medium text-gray-700 block mb-1">Tags (comma-separated)</label>
                <Input
                  id="ai-kb-tags"
                  value={formData.tags}
                  onChange={e => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="e.g., warranty, returns, common"
                />
              </div>
            </div>

            {saveError && (
              <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{saveError}</p>
            )}

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
                <Save className="w-4 h-4 mr-1" />
                {saving && "Saving..."}
                {!saving && editingId && "Update"}
                {!saving && !editingId && "Save"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Entries list */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      )}
      {!loading && filtered.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No knowledge entries yet</p>
            <p className="text-sm text-gray-400 mt-1">
              {entries.length === 0
                ? `Add Q&A pairs to train ${agentName} on specific responses`
                : "No entries match your search/filter"}
            </p>
          </CardContent>
        </Card>
      )}
      {!loading && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map(entry => {
            const cat = CATEGORY_MAP[entry.category] || CATEGORY_MAP.qa
            const CatIcon = cat.icon
            const isExpanded = expandedId === entry.id

            return (
              <Card
                key={entry.id}
                className={`transition-all ${entry.is_active ? "" : "opacity-60 bg-gray-50"} ${
                  isExpanded ? "ring-1 ring-indigo-200" : ""
                }`}
              >
                <div
                  role="button"
                  tabIndex={0}
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setExpandedId(isExpanded ? null : entry.id) }}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <GripVertical className="w-4 h-4 text-gray-300" />
                    </div>
                    <div className={`p-1.5 rounded ${cat.color.split(" ")[1]} shrink-0`}>
                      <CatIcon className={`w-4 h-4 ${cat.color.split(" ")[0]}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {cat.label}
                        </Badge>
                        {entry.priority > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            Priority: {entry.priority}
                          </Badge>
                        )}
                        {!entry.is_active && (
                          <Badge variant="destructive" className="text-xs">Disabled</Badge>
                        )}
                        {entry.tags && entry.tags.length > 0 && entry.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs text-gray-400">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        <span className="text-gray-400">IF:</span> {entry.trigger_phrase}
                      </p>
                      <p className="text-sm text-gray-500 truncate mt-0.5">
                        <span className="text-gray-400">THEN:</span> {entry.response}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded view */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t pt-3 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase">Trigger / Question</p>
                        <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap bg-gray-50 p-3 rounded">
                          {entry.trigger_phrase}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase">Trained Response</p>
                        <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap bg-gray-50 p-3 rounded">
                          {entry.response}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>
                        Created {new Date(entry.created_at).toLocaleDateString()} by {entry.created_by || "system"}
                        {entry.updated_by && entry.updated_at !== entry.created_at && (
                          <> · Updated {new Date(entry.updated_at).toLocaleDateString()} by {entry.updated_by}</>
                        )}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleToggleActive(entry) }}
                        >
                          {entry.is_active ? (
                            <><PowerOff className="w-3 h-3 mr-1" /> Disable</>
                          ) : (
                            <><Power className="w-3 h-3 mr-1" /> Enable</>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); startEditing(entry) }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={(e) => { e.stopPropagation(); handleDelete(entry.id) }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Summary */}
      {entries.length > 0 && (
        <p className="text-xs text-gray-400 text-center">
          {entries.length} knowledge {entries.length === 1 ? "entry" : "entries"} total ·{" "}
          {entries.filter(e => e.is_active).length} active ·{" "}
          {filtered.length} shown
        </p>
      )}
    </div>
  )
}
