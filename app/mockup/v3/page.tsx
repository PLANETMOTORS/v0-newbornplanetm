"use client"

import Link from "next/link"
import { CheckCircle, ArrowRight, Shield, ChevronRight, Layers, Accessibility, Palette } from "lucide-react"

// Mockup V3: Improvement Proposals — branch-only preview, DO NOT MERGE until approved

export default function MockupV3ProposalsPage() {
  return (
    <div className="min-h-screen bg-pm-surface-subtle font-sans">

      {/* Header */}
      <div className="bg-pm-brand text-white py-4 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-white/60 text-xs uppercase tracking-widest mb-0.5">Planet Motors · Internal · Branch Preview Only</p>
            <h1 className="text-xl font-bold">Improvement Proposals — V3 Mockups</h1>
          </div>
          <Link href="/mockup" className="text-white/70 hover:text-white text-sm transition-colors">← Back to V2</Link>
        </div>
      </div>

      {/* Grade Summary */}
      <section className="bg-white border-b border-pm-border py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-lg font-semibold text-pm-text-primary mb-4">Current Codebase Assessment</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { label: "Architecture", grade: "B+", color: "bg-blue-50 text-blue-700 border-blue-200" },
              { label: "Code Quality", grade: "B-", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
              { label: "Testing", grade: "B+", color: "bg-blue-50 text-blue-700 border-blue-200" },
              { label: "Accessibility", grade: "C+", color: "bg-orange-50 text-orange-700 border-orange-200" },
              { label: "Performance", grade: "B", color: "bg-blue-50 text-blue-700 border-blue-200" },
              { label: "Design System", grade: "C→B", color: "bg-green-50 text-green-700 border-green-200" },
              { label: "CMS", grade: "D", color: "bg-red-50 text-red-700 border-red-200" },
            ].map((item) => (
              <div key={item.label} className={`rounded-xl border p-4 text-center ${item.color}`}>
                <div className="text-2xl font-bold">{item.grade}</div>
                <div className="text-xs font-medium mt-1">{item.label}</div>
              </div>
            ))}
          </div>
          <p className="text-pm-text-muted text-sm mt-3">Green = already improved this session. Proposals below target remaining gaps.</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-10 space-y-16">

        {/* PROPOSAL 1: Component Decomposition */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-pm-brand flex items-center justify-center flex-shrink-0">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-pm-text-muted">Proposal 1 · Code Quality B- → A-</p>
              <h2 className="text-2xl font-bold text-pm-text-primary">Component Decomposition</h2>
            </div>
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-red-200 overflow-hidden">
              <div className="bg-red-50 border-b border-red-200 px-5 py-3 flex items-center justify-between">
                <span className="font-semibold text-red-700 text-sm">BEFORE — app/trade-in/page.tsx</span>
                <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">2,102 lines</span>
              </div>
              <div className="p-5 font-mono text-xs space-y-1 text-pm-text-secondary">
                <div className="flex items-center gap-2">
                  <span className="text-red-400">📄</span>
                  <span className="text-pm-text-primary font-semibold">app/trade-in/page.tsx</span>
                  <span className="ml-auto text-red-500 font-bold">2,102 lines</span>
                </div>
                <div className="ml-4 space-y-0.5 text-pm-text-muted">
                  <div>├── imports (1–266)</div>
                  <div>├── TradeInContent() (267–2084)</div>
                  <div className="ml-4 space-y-0.5">
                    <div>├── Hero + VIN/Plate/Manual tabs</div>
                    <div>├── Trust signals row</div>
                    <div>├── 4-step wizard shell</div>
                    <div>├── Step 2: Condition form</div>
                    <div>├── Step 3: Photo upload</div>
                    <div>├── Step 4: Contact + offer</div>
                    <div>├── How It Works section</div>
                    <div>├── Comparison table</div>
                    <div>└── Final CTA section</div>
                  </div>
                  <div>└── TradeInPage() (2085–2102)</div>
                </div>
                <div className="mt-3 pt-3 border-t border-red-100 text-red-600">
                  ✗ Impossible to test sections in isolation<br/>
                  ✗ Git diffs are unreadable (2000-line changes)<br/>
                  ✗ No code reuse across pages<br/>
                  ✗ Entire page loads as one bundle
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-green-200 overflow-hidden">
              <div className="bg-green-50 border-b border-green-200 px-5 py-3 flex items-center justify-between">
                <span className="font-semibold text-green-700 text-sm">AFTER — decomposed structure</span>
                <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">~50 lines</span>
              </div>
              <div className="p-5 font-mono text-xs space-y-1 text-pm-text-secondary">
                <div className="flex items-center gap-2">
                  <span>📁</span>
                  <span className="text-pm-text-primary font-semibold">app/trade-in/page.tsx</span>
                  <span className="ml-auto text-green-600 font-bold">~50 lines</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span>📁</span>
                  <span className="text-pm-text-primary font-semibold">components/trade-in/</span>
                </div>
                <div className="ml-4 space-y-0.5">
                  <div className="flex justify-between"><span>├── trade-in-hero.tsx</span><span className="text-pm-text-muted">~180 lines</span></div>
                  <div className="flex justify-between"><span>├── trade-in-trust-signals.tsx</span><span className="text-pm-text-muted">~60 lines</span></div>
                  <div className="flex justify-between"><span>├── trade-in-wizard.tsx</span><span className="text-pm-text-muted">~120 lines</span></div>
                  <div className="flex justify-between"><span>├── wizard-step-condition.tsx</span><span className="text-pm-text-muted">~135 lines</span></div>
                  <div className="flex justify-between"><span>├── wizard-step-photos.tsx</span><span className="text-pm-text-muted">~100 lines</span></div>
                  <div className="flex justify-between"><span>├── wizard-step-offer.tsx</span><span className="text-pm-text-muted">~240 lines</span></div>
                  <div className="flex justify-between"><span>├── trade-in-how-it-works.tsx</span><span className="text-pm-text-muted">~60 lines</span></div>
                  <div className="flex justify-between"><span>├── trade-in-comparison.tsx</span><span className="text-pm-text-muted">~100 lines</span></div>
                  <div className="flex justify-between"><span>└── trade-in-final-cta.tsx</span><span className="text-pm-text-muted">~295 lines</span></div>
                </div>
                <div className="mt-3 pt-3 border-t border-green-100 text-green-700">
                  ✓ Each component independently testable<br/>
                  ✓ Clean git diffs per feature<br/>
                  ✓ Lazy-loadable below-fold sections<br/>
                  ✓ Reusable across sell-your-car + trade-in
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 bg-white rounded-2xl border border-pm-border p-5">
            <h3 className="font-semibold text-pm-text-primary mb-3 text-sm">Priority decomposition queue</h3>
            <div className="space-y-2">
              {[
                { file: "app/trade-in/page.tsx", lines: "2,102", priority: "P1", effort: "3h", impact: "Highest", impactColor: "text-red-600" },
                { file: "app/inventory/page.tsx", lines: "1,137", priority: "P1", effort: "2h", impact: "High", impactColor: "text-orange-600" },
                { file: "app/delivery/page.tsx", lines: "1,056", priority: "P2", effort: "2h", impact: "Medium", impactColor: "text-pm-text-muted" },
                { file: "app/admin/inventory/page.tsx", lines: "1,055", priority: "P2", effort: "2h", impact: "Medium", impactColor: "text-pm-text-muted" },
                { file: "app/account/page.tsx", lines: "1,019", priority: "P2", effort: "2h", impact: "Medium", impactColor: "text-pm-text-muted" },
              ].map((item) => (
                <div key={item.file} className="flex items-center gap-3 text-sm">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${item.priority === "P1" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{item.priority}</span>
                  <code className="text-pm-text-primary font-mono text-xs flex-1">{item.file}</code>
                  <span className="text-red-500 font-semibold text-xs">{item.lines} lines</span>
                  <span className="text-pm-text-muted text-xs">{item.effort}</span>
                  <span className={`text-xs font-medium ${item.impactColor}`}>{item.impact}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PROPOSAL 2: Protection Plans */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-pm-brand flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-pm-text-muted">Proposal 2 · Already Fixed ✓ + Enhancement</p>
              <h2 className="text-2xl font-bold text-pm-text-primary">Protection Plans — Contrast &amp; Card Design</h2>
            </div>
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold text-red-600 uppercase tracking-widest mb-2">✗ Before — Basic &amp; Ultimate nearly invisible</p>
              <div className="rounded-2xl p-6 grid grid-cols-3 gap-3" style={{ backgroundColor: "#0f172a" }}>
                {[
                  { name: "Basic", price: "$29", features: ["Powertrain", "Roadside", "Trip coverage"], highlighted: false, broken: true },
                  { name: "Premium", price: "$59", features: ["Everything Basic", "Electrical", "A/C"], highlighted: true, broken: false },
                  { name: "Ultimate", price: "$99", features: ["Everything Premium", "Full mechanical", "Zero deductible"], highlighted: false, broken: true },
                ].map((plan) => (
                  <div key={plan.name} className="rounded-xl p-4" style={plan.highlighted ? {} : { backgroundColor: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.20)" }} className2={plan.highlighted ? "bg-white" : ""}>
                    <div className={plan.highlighted ? "bg-white rounded-xl p-4" : ""}>
                      <h3 className={`font-semibold text-sm ${plan.highlighted ? "text-pm-text-primary" : "text-white"}`}>{plan.name}</h3>
                      <p className="mt-1 text-xs" style={{ color: plan.highlighted ? "#475569" : "#94a3b8" }}>Coverage plan</p>
                      <div className={`mt-3 text-2xl font-bold ${plan.highlighted ? "text-pm-text-primary" : "text-white"}`}>{plan.price}</div>
                      <div className="mt-3 space-y-1">
                        {plan.features.map(f => (
                          <div key={f} className="flex items-center gap-1 text-xs">
                            <CheckCircle className={`w-3 h-3 flex-shrink-0 ${plan.highlighted ? "text-pm-brand" : "text-green-400"}`} />
                            <span className={plan.highlighted ? "text-pm-text-secondary" : "text-white"}>{f}</span>
                          </div>
                        ))}
                      </div>
                      <div className={`mt-3 w-full py-1.5 rounded-lg text-xs font-semibold text-center ${plan.highlighted ? "bg-pm-brand text-white" : "bg-white text-pm-brand-dark"}`}>Get Started</div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-red-500 mt-2">↑ #94a3b8 text nearly invisible on #0f172a. bg-white/10 too faint.</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-green-600 uppercase tracking-widest mb-2">✓ After — Fixed contrast + &quot;Most Popular&quot; badge</p>
              <div className="rounded-2xl p-6 grid grid-cols-3 gap-3 items-center" style={{ backgroundColor: "#0f172a" }}>
                {[
                  { name: "Basic", price: "$29", features: ["Powertrain", "Roadside", "Trip coverage"], highlighted: false },
                  { name: "Premium", price: "$59", features: ["Everything Basic", "Electrical", "A/C"], highlighted: true },
                  { name: "Ultimate", price: "$99", features: ["Everything Premium", "Full mechanical", "Zero deductible"], highlighted: false },
                ].map((plan) => (
                  plan.highlighted ? (
                    <div key={plan.name} className="rounded-xl p-4 bg-white text-pm-text-primary ring-2 ring-white shadow-xl" style={{ transform: "scale(1.05)" }}>
                      <div className="text-xs font-bold text-pm-brand mb-1 uppercase tracking-wide">Most Popular</div>
                      <h3 className="font-semibold text-sm">{plan.name}</h3>
                      <div className="mt-2 text-2xl font-bold">{plan.price}</div>
                      <div className="mt-2 space-y-1">
                        {plan.features.map(f => (
                          <div key={f} className="flex items-center gap-1 text-xs">
                            <CheckCircle className="w-3 h-3 text-pm-brand flex-shrink-0" />
                            <span className="text-pm-text-secondary">{f}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 w-full py-1.5 rounded-lg text-xs font-semibold text-center bg-pm-brand text-white">Get Started</div>
                    </div>
                  ) : (
                    <div key={plan.name} className="rounded-xl p-4 text-white" style={{ backgroundColor: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.30)" }}>
                      <h3 className="font-semibold text-sm">{plan.name}</h3>
                      <p className="mt-1 text-xs text-white/70">Coverage plan</p>
                      <div className="mt-2 text-2xl font-bold">{plan.price}</div>
                      <div className="mt-2 space-y-1">
                        {plan.features.map(f => (
                          <div key={f} className="flex items-center gap-1 text-xs">
                            <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 w-full py-1.5 rounded-lg text-xs font-semibold text-center bg-white text-pm-brand-dark">Get Started</div>
                    </div>
                  )
                ))}
              </div>
              <p className="text-xs text-green-600 mt-2">✓ text-white/70, bg-white/15, border-white/30. Premium scaled + badged.</p>
            </div>
          </div>
        </section>

        {/* PROPOSAL 3: Design Token Reference */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-pm-brand flex items-center justify-center flex-shrink-0">
              <Palette className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-pm-text-muted">Proposal 3 · Design System C → B</p>
              <h2 className="text-2xl font-bold text-pm-text-primary">Design Token Reference Card</h2>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-pm-border p-5">
              <h3 className="font-semibold text-pm-text-primary mb-3 text-sm">Brand Colors</h3>
              <div className="space-y-2.5">
                {[
                  { hex: "#1e3a8a", tw: "bg-pm-brand / text-pm-brand", label: "Primary brand" },
                  { hex: "#172554", tw: "hover:bg-pm-brand-hover", label: "Hover state" },
                  { hex: "#eef2ff", tw: "bg-pm-brand-light", label: "Light tint" },
                  { hex: "#0f172a", tw: "bg-pm-brand-dark", label: "Dark sections" },
                ].map(t => (
                  <div key={t.tw} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg border border-pm-border flex-shrink-0" style={{ backgroundColor: t.hex }} />
                    <div><code className="text-xs text-pm-brand block">{t.tw}</code><span className="text-xs text-pm-text-muted">{t.label}</span></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-pm-border p-5">
              <h3 className="font-semibold text-pm-text-primary mb-3 text-sm">Text Colors</h3>
              <div className="space-y-2.5">
                {[
                  { hex: "#0f172a", tw: "text-pm-text-primary", label: "Headings, labels" },
                  { hex: "#475569", tw: "text-pm-text-secondary", label: "Body text" },
                  { hex: "#94a3b8", tw: "text-pm-text-muted", label: "Light bg only ⚠️" },
                ].map(t => (
                  <div key={t.tw} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg border border-pm-border bg-white flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold" style={{ color: t.hex }}>Aa</span>
                    </div>
                    <div><code className="text-xs text-pm-brand block">{t.tw}</code><span className="text-xs text-pm-text-muted">{t.label}</span></div>
                  </div>
                ))}
              </div>
              <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-xs text-orange-700">⚠️ Dark bg: use <code>text-white/70</code> not <code>text-pm-text-muted</code></p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-pm-border p-5">
              <h3 className="font-semibold text-pm-text-primary mb-3 text-sm">Surfaces &amp; Borders</h3>
              <div className="space-y-2.5">
                {[
                  { hex: "#f8fafc", tw: "bg-pm-surface-subtle", label: "Page backgrounds" },
                  { hex: "#f1f5f9", tw: "bg-pm-surface-light", label: "Card backgrounds" },
                  { hex: "#e2e8f0", tw: "border-pm-border", label: "All borders" },
                ].map(t => (
                  <div key={t.tw} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg border border-pm-border flex-shrink-0" style={{ backgroundColor: t.hex }} />
                    <div><code className="text-xs text-pm-brand block">{t.tw}</code><span className="text-xs text-pm-text-muted">{t.label}</span></div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-pm-border">
                <code className="text-xs text-red-500 block">❌ border-[#e0e7f5]</code>
                <code className="text-xs text-green-600 block">✓ border-pm-border</code>
              </div>
            </div>
          </div>
        </section>

        {/* PROPOSAL 4: Accessibility */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-pm-brand flex items-center justify-center flex-shrink-0">
              <Accessibility className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-pm-text-muted">Proposal 4 · Accessibility C+ → B+</p>
              <h2 className="text-2xl font-bold text-pm-text-primary">Accessibility — Applied &amp; Remaining</h2>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-green-200 p-5">
              <h3 className="font-semibold text-green-700 mb-3 text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Fixed This Session</h3>
              <div className="space-y-3">
                {[
                  { issue: "aria-valid-attr-value on search input", fix: "aria-controls + aria-expanded on CommandInput; id on CommandList", file: "search-autocomplete.tsx" },
                  { issue: "Inputs without labels (Quick Estimate)", fix: "sr-only <label> with htmlFor on all 3 inputs", file: "app/mockup/page.tsx" },
                  { issue: "text-pm-text-muted on dark backgrounds", fix: "Replaced with text-white/70 in Protection Plans", file: "homepage-below-fold.tsx" },
                ].map(item => (
                  <div key={item.issue} className="p-3 bg-green-50 rounded-xl border border-green-100">
                    <p className="text-xs font-semibold text-green-800">{item.issue}</p>
                    <p className="text-xs text-green-700 mt-0.5">{item.fix}</p>
                    <code className="text-xs text-green-600 mt-1 block">{item.file}</code>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-orange-200 p-5">
              <h3 className="font-semibold text-orange-700 mb-3 text-sm flex items-center gap-2"><ArrowRight className="w-4 h-4" /> Remaining — Proposed Next</h3>
              <div className="space-y-3">
                {[
                  { p: "P1", issue: "Skip-to-content link missing", fix: "Add <a href=\"#main-content\"> as first element in layout.tsx", effort: "15 min" },
                  { p: "P1", issue: "Mobile menu lacks focus trap", fix: "Add Tab/Shift+Tab handler in header.tsx", effort: "45 min" },
                  { p: "P2", issue: "Vehicle cards missing alt text strategy", fix: "Standardize alt pattern in vehicle-grid.tsx", effort: "30 min" },
                  { p: "P2", issue: "Finance form missing error announcements", fix: "Add aria-live region for validation errors", effort: "1h" },
                ].map(item => (
                  <div key={item.issue} className="p-3 bg-orange-50 rounded-xl border border-orange-100">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${item.p === "P1" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{item.p}</span>
                      <p className="text-xs font-semibold text-orange-800">{item.issue}</p>
                      <span className="ml-auto text-xs text-pm-text-muted">{item.effort}</span>
                    </div>
                    <p className="text-xs text-orange-700">{item.fix}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Roadmap */}
        <section className="bg-pm-brand rounded-2xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-2">Implementation Roadmap</h2>
          <p className="text-white/70 mb-6">~20 hours total to move from B- to A-</p>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { sprint: "Sprint 1 · ~6h", label: "Quick Wins", items: ["Skip-to-content link (15 min)", "Mobile menu focus trap (45 min)", "Vehicle card alt text (30 min)", "Finance form aria-live (1h)", "trade-in decomposition (3h)"] },
              { sprint: "Sprint 2 · ~6h", label: "Code Quality", items: ["inventory/page.tsx (2h)", "delivery/page.tsx (2h)", "account/page.tsx (2h)"] },
              { sprint: "Sprint 3 · ~8h", label: "CMS + Performance", items: ["Create Sanity production dataset", "Seed 3+ blog posts", "Wire homepage to Sanity", "LCP measurement", "Error boundary taxonomy"] },
            ].map(s => (
              <div key={s.sprint} className="rounded-xl border border-white/20 bg-white/10 p-5">
                <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">{s.sprint}</p>
                <h3 className="font-bold text-white mb-3">{s.label}</h3>
                <ul className="space-y-1.5">
                  {s.items.map(item => (
                    <li key={item} className="flex items-start gap-2 text-sm text-white/80">
                      <ChevronRight className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-white/40" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-6 border-t border-white/20 flex flex-wrap gap-4 items-center">
            <span className="text-white/70 text-sm">Total: <strong className="text-white">~20 hours</strong></span>
            <span className="text-white/70 text-sm">Grade: <strong className="text-white">B- → A-</strong></span>
            <Link href="/mockup" className="ml-auto px-5 py-2.5 bg-white text-pm-brand font-semibold rounded-xl text-sm hover:bg-pm-brand-light transition-colors flex items-center gap-2">
              Back to V2 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

      </div>
    </div>
  )
}
