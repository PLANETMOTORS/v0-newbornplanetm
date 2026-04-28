"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Bot, DollarSign, Car, Save, RefreshCw,
  ToggleLeft, ToggleRight, Plus, Trash2, Settings2, BookOpen
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import AIKnowledgePanel from "@/components/admin/ai-knowledge-panel"

interface QuickAction {
  label: string
  prompt: string
}

interface AgentConfig {
  agent_type: "anna" | "negotiator" | "valuator"
  display_name: string | null
  is_active: boolean
  system_prompt: string | null
  welcome_message: string | null
  quick_actions: QuickAction[] | null
  config: Record<string, unknown>
  updated_by: string | null
  updated_at?: string
}

const AGENT_META: Record<string, { icon: typeof Bot; color: string; bg: string; description: string }> = {
  anna: { icon: Bot, color: "text-blue-600", bg: "bg-blue-50", description: "AI chat assistant — answers customer questions, searches inventory, captures leads, books test drives" },
  negotiator: { icon: DollarSign, color: "text-green-600", bg: "bg-green-50", description: "Price negotiation engine — handles offers, calculates discounts based on days-on-lot tiers" },
  valuator: { icon: Car, color: "text-purple-600", bg: "bg-purple-50", description: "Trade-in valuator — estimates vehicle trade-in value using AI market analysis" },
}

export default function AIAgentsPage() {
  const [agents, setAgents] = useState<AgentConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [editingAgent, setEditingAgent] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<AgentConfig>>({})
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [knowledgeAgent, setKnowledgeAgent] = useState<string | null>(null)

  const fetchAgents = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/v1/admin/ai-config")
      if (!res.ok) throw new Error("Failed to fetch AI configs")
      const data = await res.json()
      setAgents(data.agents || [])
    } catch (err) {
      console.error("AI config fetch error:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAgents() }, [fetchAgents])

  const startEditing = (agent: AgentConfig) => {
    setEditingAgent(agent.agent_type)
    setEditForm({ ...agent })
  }

  const cancelEditing = () => {
    setEditingAgent(null)
    setEditForm({})
  }

  const saveAgent = async () => {
    if (!editingAgent) return
    try {
      setSaving(editingAgent)
      const res = await fetch("/api/v1/admin/ai-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      })
      if (!res.ok) throw new Error("Failed to save")
      const data = await res.json()

      setAgents(prev => prev.map(a => a.agent_type === editingAgent ? { ...a, ...data.agent } : a))
      setEditingAgent(null)
      setEditForm({})
      setSaveSuccess(editingAgent)
      setTimeout(() => setSaveSuccess(null), 3000)
    } catch (err) {
      console.error("Save error:", err)
    } finally {
      setSaving(null)
    }
  }

  const toggleAgent = async (agentType: string, isActive: boolean) => {
    try {
      const res = await fetch("/api/v1/admin/ai-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_type: agentType, is_active: !isActive }),
      })
      if (res.ok) {
        setAgents(prev => prev.map(a => a.agent_type === agentType ? { ...a, is_active: !isActive } : a))
      }
    } catch (err) {
      console.error("Toggle error:", err)
    }
  }

  const addQuickAction = () => {
    const currentActions = editForm.quick_actions || []
    setEditForm({ ...editForm, quick_actions: [...currentActions, { label: "", prompt: "" }] })
  }

  const removeQuickAction = (index: number) => {
    const currentActions = [...(editForm.quick_actions || [])]
    currentActions.splice(index, 1)
    setEditForm({ ...editForm, quick_actions: currentActions })
  }

  const updateQuickAction = (index: number, field: "label" | "prompt", value: string) => {
    const currentActions = [...(editForm.quick_actions || [])]
    currentActions[index] = { ...currentActions[index], [field]: value }
    setEditForm({ ...editForm, quick_actions: currentActions })
  }

  const updateConfig = (key: string, value: string | number) => {
    const existing =
      editForm.config && typeof editForm.config === "object"
        ? editForm.config
        : null
    const config: Record<string, unknown> = existing ? { ...existing } : {}
    config[key] = value
    setEditForm({ ...editForm, config })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-[-0.01em] text-gray-900">AI Agents</h1>
        <div className="grid gap-6">
          {[1,2,3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6"><div className="h-32 bg-gray-200 rounded" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.01em] text-gray-900">AI Agents</h1>
          <p className="text-sm text-gray-500">Configure Anna, Price Negotiator, and Vehicle Valuator</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAgents}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Agent Cards */}
      <div className="space-y-6">
        {agents.map(agent => {
          const meta = AGENT_META[agent.agent_type] || AGENT_META.anna
          const Icon = meta.icon
          const isEditing = editingAgent === agent.agent_type
          const config = (isEditing ? editForm.config : agent.config) as Record<string, unknown> || {}
          // S6551: a config value may be any unknown shape — coerce to a primitive
          // explicitly so that an accidental object never renders as
          // "[object Object]" in the input.
          const cfgString = (key: string, fallback: string): string => {
            const v = config[key]
            return typeof v === "string" ? v : fallback
          }
          const cfgNumber = (key: string, fallback: number): number => {
            const v = config[key]
            return typeof v === "number" ? v : fallback
          }

          return (
            <Card key={agent.agent_type} className={saveSuccess === agent.agent_type ? "ring-2 ring-green-500" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${meta.bg}`}>
                      <Icon className={`w-6 h-6 ${meta.color}`} />
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {agent.display_name || agent.agent_type}
                        <Badge variant={agent.is_active ? "default" : "secondary"}>
                          {agent.is_active ? "Active" : "Disabled"}
                        </Badge>
                        {saveSuccess === agent.agent_type && (
                          <span className="text-sm text-green-600 font-normal">Saved!</span>
                        )}
                      </CardTitle>
                      <CardDescription>{meta.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleAgent(agent.agent_type, agent.is_active)} className="p-2 hover:bg-gray-100 rounded-lg">
                      {agent.is_active ? <ToggleRight className="w-6 h-6 text-green-600" /> : <ToggleLeft className="w-6 h-6 text-gray-400" />}
                    </button>
                    {(() => {
                      if (!isEditing && knowledgeAgent !== agent.agent_type) {
                        return (
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => { setKnowledgeAgent(agent.agent_type); setEditingAgent(null) }}>
                              <BookOpen className="w-4 h-4 mr-1" />
                              Knowledge
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => { startEditing(agent); setKnowledgeAgent(null) }}>
                              <Settings2 className="w-4 h-4 mr-1" />
                              Configure
                            </Button>
                          </div>
                        )
                      }
                      if (isEditing) {
                        const saveLabel = saving === agent.agent_type ? "Saving..." : "Save"
                        return (
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={cancelEditing}>Cancel</Button>
                            <Button size="sm" onClick={saveAgent} disabled={saving === agent.agent_type}>
                              <Save className="w-4 h-4 mr-1" />
                              {saveLabel}
                            </Button>
                          </div>
                        )
                      }
                      if (knowledgeAgent === agent.agent_type) {
                        return (
                          <Button variant="outline" size="sm" onClick={() => setKnowledgeAgent(null)}>Close Knowledge</Button>
                        )
                      }
                      return null
                    })()}
                  </div>
                </div>
              </CardHeader>

              {isEditing && (
                <CardContent className="space-y-6 border-t pt-6">
                  {/* Anna-specific settings */}
                  {agent.agent_type === "anna" && (
                    <>
                      <div>
                        <label htmlFor={`${agent.agent_type}-display-name`} className="text-sm font-medium text-gray-700 block mb-1">Display Name</label>
                        <Input
                          id={`${agent.agent_type}-display-name`}
                          value={(editForm.display_name as string) || ""}
                          onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                          placeholder="Anna"
                        />
                      </div>
                      <div>
                        <label htmlFor={`${agent.agent_type}-welcome-message`} className="text-sm font-medium text-gray-700 block mb-1">Welcome Message</label>
                        <textarea
                          id={`${agent.agent_type}-welcome-message`}
                          className="w-full border rounded-md p-3 text-sm min-h-[80px] resize-y"
                          value={(editForm.welcome_message as string) || ""}
                          onChange={(e) => setEditForm({ ...editForm, welcome_message: e.target.value })}
                          placeholder="Hi! I'm Anna from Planet Motors. How can I help you today?"
                        />
                      </div>
                      <div>
                        <label htmlFor={`${agent.agent_type}-system-prompt`} className="text-sm font-medium text-gray-700 block mb-1">Custom System Prompt (optional — overrides default)</label>
                        <textarea
                          id={`${agent.agent_type}-system-prompt`}
                          className="w-full border rounded-md p-3 text-sm min-h-[120px] resize-y font-mono"
                          value={(editForm.system_prompt as string) || ""}
                          onChange={(e) => setEditForm({ ...editForm, system_prompt: e.target.value })}
                          placeholder="Leave empty to use default. Add custom instructions here to change Anna's behavior..."
                        />
                        <p className="text-xs text-gray-400 mt-1">Anna already knows your inventory, fees, hours, and policies. Add extra instructions only if needed.</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Quick Actions</span>
                          <Button variant="outline" size="sm" onClick={addQuickAction}>
                            <Plus className="w-3 h-3 mr-1" />
                            Add
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {(editForm.quick_actions || []).map((qa, i) => (
                            <div key={qa.label} className="flex gap-2 items-center">
                              <Input
                                value={qa.label}
                                onChange={(e) => updateQuickAction(i, "label", e.target.value)}
                                placeholder="Button label"
                                className="flex-1"
                              />
                              <Input
                                value={qa.prompt}
                                onChange={(e) => updateQuickAction(i, "prompt", e.target.value)}
                                placeholder="Prompt text"
                                className="flex-[2]"
                              />
                              <Button variant="ghost" size="sm" onClick={() => removeQuickAction(i)}>
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor={`${agent.agent_type}-rate-limit`} className="text-sm font-medium text-gray-700 block mb-1">Rate Limit (requests/hour)</label>
                          <Input
                            id={`${agent.agent_type}-rate-limit`}
                            type="number"
                            value={String(cfgNumber("rateLimit", 20))}
                            onChange={(e) => updateConfig("rateLimit", Number.parseInt(e.target.value))}
                          />
                        </div>
                        <div>
                          <label htmlFor={`${agent.agent_type}-ai-model`} className="text-sm font-medium text-gray-700 block mb-1">AI Model</label>
                          <select
                            id={`${agent.agent_type}-ai-model`}
                            className="w-full border rounded-md px-3 py-2 text-sm"
                            value={cfgString("model", "gpt-4o-mini")}
                            onChange={(e) => updateConfig("model", e.target.value)}
                          >
                            <option value="gpt-4o-mini">GPT-4o Mini (fast, cost-effective)</option>
                            <option value="gpt-4o">GPT-4o (smarter, slower)</option>
                          </select>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Negotiator-specific settings */}
                  {agent.agent_type === "negotiator" && (
                    <>
                      <div>
                        <span className="text-sm font-medium text-gray-700 block mb-3">Discount Tiers — Vehicles Under $30K</span>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label htmlFor={`${agent.agent_type}-low-0-31`} className="text-xs text-gray-500">0-31 days (%)</label>
                            <Input
                              id={`${agent.agent_type}-low-0-31`}
                              type="number"
                              step="0.25"
                              value={String(cfgNumber("lowPriceMaxDiscount_0_31days", 1))}
                              onChange={(e) => updateConfig("lowPriceMaxDiscount_0_31days", Number.parseFloat(e.target.value))}
                            />
                          </div>
                          <div>
                            <label htmlFor={`${agent.agent_type}-low-32-46`} className="text-xs text-gray-500">32-46 days (%)</label>
                            <Input
                              id={`${agent.agent_type}-low-32-46`}
                              type="number"
                              step="0.25"
                              value={String(cfgNumber("lowPriceMaxDiscount_32_46days", 1.25))}
                              onChange={(e) => updateConfig("lowPriceMaxDiscount_32_46days", Number.parseFloat(e.target.value))}
                            />
                          </div>
                          <div>
                            <label htmlFor={`${agent.agent_type}-low-47plus`} className="text-xs text-gray-500">47+ days (%)</label>
                            <Input
                              id={`${agent.agent_type}-low-47plus`}
                              type="number"
                              step="0.25"
                              value={String(cfgNumber("lowPriceMaxDiscount_47plus", 1.5))}
                              onChange={(e) => updateConfig("lowPriceMaxDiscount_47plus", Number.parseFloat(e.target.value))}
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700 block mb-3">Discount Tiers — Vehicles $30K+</span>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor={`${agent.agent_type}-high-0-46`} className="text-xs text-gray-500">0-46 days (%)</label>
                            <Input
                              id={`${agent.agent_type}-high-0-46`}
                              type="number"
                              step="0.25"
                              value={String(cfgNumber("highPriceMaxDiscount_0_46days", 0.75))}
                              onChange={(e) => updateConfig("highPriceMaxDiscount_0_46days", Number.parseFloat(e.target.value))}
                            />
                          </div>
                          <div>
                            <label htmlFor={`${agent.agent_type}-high-47plus`} className="text-xs text-gray-500">47+ days (%)</label>
                            <Input
                              id={`${agent.agent_type}-high-47plus`}
                              type="number"
                              step="0.25"
                              value={String(cfgNumber("highPriceMaxDiscount_47plus", 1))}
                              onChange={(e) => updateConfig("highPriceMaxDiscount_47plus", Number.parseFloat(e.target.value))}
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <label htmlFor={`${agent.agent_type}-low-price-threshold`} className="text-sm font-medium text-gray-700 block mb-1">Low Price Threshold ($)</label>
                        <Input
                          id={`${agent.agent_type}-low-price-threshold`}
                          type="number"
                          value={String(cfgNumber("lowPriceThreshold", 30000))}
                          onChange={(e) => updateConfig("lowPriceThreshold", Number.parseInt(e.target.value))}
                        />
                        <p className="text-xs text-gray-400 mt-1">Vehicles below this price use the &quot;Under $30K&quot; discount tiers</p>
                      </div>
                    </>
                  )}

                  {/* Valuator-specific settings */}
                  {agent.agent_type === "valuator" && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor={`${agent.agent_type}-temperature`} className="text-sm font-medium text-gray-700 block mb-1">AI Temperature</label>
                          <Input
                            id={`${agent.agent_type}-temperature`}
                            type="number"
                            step="0.1"
                            min="0"
                            max="1"
                            value={String(cfgNumber("temperature", 0.3))}
                            onChange={(e) => updateConfig("temperature", Number.parseFloat(e.target.value))}
                          />
                          <p className="text-xs text-gray-400 mt-1">Lower = more consistent, Higher = more creative</p>
                        </div>
                        <div>
                          <label htmlFor={`${agent.agent_type}-valuator-model`} className="text-sm font-medium text-gray-700 block mb-1">AI Model</label>
                          <select
                            id={`${agent.agent_type}-valuator-model`}
                            className="w-full border rounded-md px-3 py-2 text-sm"
                            value={cfgString("model", "gpt-4o-mini")}
                            onChange={(e) => updateConfig("model", e.target.value)}
                          >
                            <option value="gpt-4o-mini">GPT-4o Mini</option>
                            <option value="gpt-4o">GPT-4o</option>
                          </select>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Common: Last updated info */}
                  {agent.updated_by && (
                    <p className="text-xs text-gray-400">
                      Last updated by {agent.updated_by}
                      {agent.updated_at && ` on ${new Date(agent.updated_at).toLocaleString()}`}
                    </p>
                  )}
                </CardContent>
              )}

              {/* Knowledge & Training panel */}
              {knowledgeAgent === agent.agent_type && !isEditing && (
                <CardContent className="border-t pt-6">
                  <AIKnowledgePanel
                    agentType={agent.agent_type}
                    agentName={agent.display_name || agent.agent_type}
                  />
                </CardContent>
              )}

              {/* Collapsed view — show key stats */}
              {!isEditing && knowledgeAgent !== agent.agent_type && (
                <CardContent className="border-t pt-4">
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    {agent.agent_type === "anna" && (
                      <>
                        <span>Model: {cfgString("model", "gpt-4o-mini")}</span>
                        <span>Rate limit: {String(cfgNumber("rateLimit", 20))}/hr</span>
                        <span>Quick actions: {(agent.quick_actions || []).length}</span>
                      </>
                    )}
                    {agent.agent_type === "negotiator" && (
                      <>
                        <span>Low price max: {String(cfgNumber("lowPriceMaxDiscount_47plus", 1.5))}%</span>
                        <span>High price max: {String(cfgNumber("highPriceMaxDiscount_47plus", 1))}%</span>
                        <span>Threshold: ${Number(config.lowPriceThreshold || 30000).toLocaleString()}</span>
                      </>
                    )}
                    {agent.agent_type === "valuator" && (
                      <>
                        <span>Model: {cfgString("model", "gpt-4o-mini")}</span>
                        <span>Temperature: {String(cfgNumber("temperature", 0.3))}</span>
                      </>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
