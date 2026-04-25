"use client"

import { useState, useCallback } from "react"
import { 
  Globe, 
  Monitor, 
  Accessibility, 
  Eye, 
  Code, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Play,
  Download,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileText,
  User,
  Calendar,
  Link2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

type TestStatus = "not-started" | "running" | "pass" | "fail"

interface CheckItem {
  id: string
  label: string
  checked: boolean
  critical?: boolean
}

interface TestStep {
  id: string
  name: string
  purpose: string
  icon: React.ReactNode
  estimatedTime: string
  status: TestStatus
  checkItems: CheckItem[]
  notes: string
  isExpanded: boolean
}

const initialSteps: TestStep[] = [
  {
    id: "website-scanner",
    name: "Website Scanner",
    purpose: "Quick no-code scan for performance, accessibility, responsiveness, broken links, and visual issues",
    icon: <Globe className="w-5 h-5" />,
    estimatedTime: "20-60 min",
    status: "not-started",
    checkItems: [
      { id: "perf", label: "Performance score acceptable", checked: false },
      { id: "access", label: "Accessibility issues reviewed", checked: false },
      { id: "responsive", label: "Responsive layout verified", checked: false },
      { id: "links", label: "No broken links found", checked: false, critical: true },
      { id: "visual", label: "No major visual issues", checked: false },
    ],
    notes: "",
    isExpanded: true,
  },
  {
    id: "live-manual",
    name: "Live Manual Testing",
    purpose: "Manual browser and mobile inspection across key pages and flows",
    icon: <Monitor className="w-5 h-5" />,
    estimatedTime: "30-90 min",
    status: "not-started",
    checkItems: [
      { id: "homepage", label: "Homepage loads correctly", checked: false, critical: true },
      { id: "nav", label: "Navigation/menu works", checked: false, critical: true },
      { id: "contact", label: "Contact page functional", checked: false, critical: true },
      { id: "forms", label: "All forms submit correctly", checked: false, critical: true },
      { id: "financing", label: "Financing form works end-to-end", checked: false, critical: true },
      { id: "inventory", label: "Inventory page loads vehicles", checked: false, critical: true },
      { id: "mobile", label: "Mobile layout is usable", checked: false, critical: true },
    ],
    notes: "",
    isExpanded: false,
  },
  {
    id: "accessibility",
    name: "Accessibility Testing",
    purpose: "WCAG / ADA compliance review for inclusive user experience",
    icon: <Accessibility className="w-5 h-5" />,
    estimatedTime: "15-45 min",
    status: "not-started",
    checkItems: [
      { id: "keyboard", label: "Keyboard navigation works", checked: false, critical: true },
      { id: "contrast", label: "Color contrast passes", checked: false },
      { id: "labels", label: "Form labels are correct", checked: false },
      { id: "screen-reader", label: "Screen reader basics work", checked: false },
    ],
    notes: "",
    isExpanded: false,
  },
  {
    id: "percy-visual",
    name: "Percy Visual Review",
    purpose: "Visual regression testing for layout consistency and design integrity",
    icon: <Eye className="w-5 h-5" />,
    estimatedTime: "15-30 min",
    status: "not-started",
    checkItems: [
      { id: "header-footer", label: "Header/footer consistent", checked: false },
      { id: "spacing", label: "Spacing and layout correct", checked: false },
      { id: "buttons", label: "Button alignment proper", checked: false },
      { id: "images", label: "Images render correctly", checked: false },
      { id: "mobile-resp", label: "Mobile responsiveness verified", checked: false, critical: true },
    ],
    notes: "",
    isExpanded: false,
  },
  {
    id: "automate",
    name: "Automated Testing",
    purpose: "Scripted functional testing for key user journeys (optional, depends on setup)",
    icon: <Code className="w-5 h-5" />,
    estimatedTime: "Varies",
    status: "not-started",
    checkItems: [
      { id: "login", label: "Login flow works", checked: false },
      { id: "auto-forms", label: "Form submissions automated", checked: false },
      { id: "journeys", label: "Key user journeys pass", checked: false },
      { id: "checkout", label: "Checkout/lead flow works", checked: false, critical: true },
    ],
    notes: "",
    isExpanded: false,
  },
]

const criticalBlockers = [
  "Broken forms",
  "Broken inventory pages", 
  "Wrong legal/contact info",
  "Mobile navigation failure",
  "Major accessibility issue",
  "Severe visual break",
]

export default function ProductionReadinessPage() {
  const [siteUrl, setSiteUrl] = useState("https://www.planetmotors.ca")
  const [testerName, setTesterName] = useState("")
  const [steps, setSteps] = useState<TestStep[]>(initialSteps)
  const [blockerNotes, setBlockerNotes] = useState("")

  const updateStepStatus = useCallback((stepId: string, status: TestStatus) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status } : step
    ))
  }, [])

  const toggleCheckItem = useCallback((stepId: string, itemId: string) => {
    setSteps(prev => prev.map(step => {
      if (step.id !== stepId) return step
      return {
        ...step,
        checkItems: step.checkItems.map(item =>
          item.id === itemId ? { ...item, checked: !item.checked } : item
        ),
      }
    }))
  }, [])

  const updateStepNotes = useCallback((stepId: string, notes: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, notes } : step
    ))
  }, [])

  const toggleExpanded = useCallback((stepId: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, isExpanded: !step.isExpanded } : step
    ))
  }, [])

  // Calculate overall progress
  const totalChecks = steps.reduce((acc, step) => acc + step.checkItems.length, 0)
  const completedChecks = steps.reduce((acc, step) => 
    acc + step.checkItems.filter(item => item.checked).length, 0
  )
  const progressPercent = totalChecks > 0 ? Math.round((completedChecks / totalChecks) * 100) : 0

  // Determine if ready for production
  const criticalChecksFailed = steps.some(step => 
    step.checkItems.some(item => item.critical && !item.checked)
  )
  const anyStepFailed = steps.some(step => step.status === "fail")
  const allStepsPassed = steps.every(step => step.status === "pass")
  const isReady = allStepsPassed && !criticalChecksFailed && !anyStepFailed

  // Get status badge
  const getStatusBadge = (status: TestStatus) => {
    switch (status) {
      case "not-started":
        return <Badge variant="secondary" className="bg-gray-100 text-gray-600">Not Started</Badge>
      case "running":
        return <Badge className="bg-blue-100 text-blue-700">Running</Badge>
      case "pass":
        return <Badge className="bg-green-100 text-green-700">Pass</Badge>
      case "fail":
        return <Badge className="bg-red-100 text-red-700">Fail</Badge>
    }
  }

  // Export report
  const exportReport = () => {
    const date = new Date().toLocaleDateString()
    const result = isReady ? "PASS" : "FAIL"
    const failedChecks = steps.flatMap(step => 
      step.checkItems.filter(item => item.critical && !item.checked).map(item => `- ${step.name}: ${item.label}`)
    )

    const report = `
PRODUCTION READINESS TEST REPORT
================================

Site URL: ${siteUrl}
Tester: ${testerName || "Not specified"}
Date: ${date}
Result: ${result}

TEST RESULTS:
${steps.map(step => `${step.name}: ${step.status.toUpperCase()}`).join("\n")}

${failedChecks.length > 0 ? `BLOCKERS:\n${failedChecks.join("\n")}` : "No critical blockers found."}

${blockerNotes ? `ADDITIONAL NOTES:\n${blockerNotes}` : ""}

DETAILED CHECKLIST:
${steps.map(step => `
${step.name}:
${step.checkItems.map(item => `  [${item.checked ? "X" : " "}] ${item.label}${item.critical ? " (CRITICAL)" : ""}`).join("\n")}
${step.notes ? `  Notes: ${step.notes}` : ""}
`).join("\n")}
`.trim()

    const blob = new Blob([report], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `production-readiness-report-${date.replaceAll("/", "-")}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-[-0.01em] text-gray-900 mb-2">Production Readiness Test Order</h1>
          <p className="text-gray-600">Complete pre-launch checklist for website quality assurance</p>
        </div>

        {/* Final Release Gate - Top Card */}
        <Card className={`mb-8 border-2 ${isReady ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}`}>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {isReady ? (
                  <CheckCircle2 className="w-12 h-12 text-green-600" />
                ) : (
                  <XCircle className="w-12 h-12 text-red-600" />
                )}
                <div>
                  <h2 className={`text-2xl font-bold ${isReady ? "text-green-700" : "text-red-700"}`}>
                    {isReady ? "READY FOR PRODUCTION" : "NOT READY"}
                  </h2>
                  <p className={`${isReady ? "text-green-600" : "text-red-600"}`}>
                    {isReady 
                      ? "All critical tests passed. Site is ready for launch." 
                      : "Critical tests incomplete or failed. Review blockers below."
                    }
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500 mb-1">Overall Progress</div>
                <div className="text-2xl font-bold text-gray-900">{progressPercent}%</div>
              </div>
            </div>
            <Progress value={progressPercent} className="mt-4 h-3" />
          </CardContent>
        </Card>

        {/* Site URL and Tester Info */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="site-url" className="flex items-center gap-2 mb-2">
                  <Link2 className="w-4 h-4" /> Target Website URL
                </Label>
                <Input 
                  id="site-url"
                  value={siteUrl}
                  onChange={(e) => setSiteUrl(e.target.value)}
                  placeholder="https://www.planetmotors.ca"
                  className="h-11"
                />
              </div>
              <div>
                <Label htmlFor="tester-name" className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4" /> Tester Name
                </Label>
                <Input 
                  id="tester-name"
                  value={testerName}
                  onChange={(e) => setTesterName(e.target.value)}
                  placeholder="Enter your name"
                  className="h-11"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recommended Order Summary */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-blue-900">Recommended Test Order</CardTitle>
            <CardDescription className="text-blue-700">
              Total estimated time: 1-3 hours for first pass
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-5 gap-3">
              {[
                { num: 1, name: "Website Scanner", desc: "Fastest first scan" },
                { num: 2, name: "Live Manual", desc: "Manual verification" },
                { num: 3, name: "Accessibility", desc: "Compliance/usability" },
                { num: 4, name: "Percy Visual", desc: "Visual changes" },
                { num: 5, name: "Automate", desc: "Scripted validation" },
              ].map((item) => (
                <div key={item.num} className="bg-white rounded-lg p-3 text-center border border-blue-100">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto mb-2 text-sm font-bold">
                    {item.num}
                  </div>
                  <div className="font-medium text-gray-900 text-sm">{item.name}</div>
                  <div className="text-xs text-gray-500">{item.desc}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Test Steps */}
        <div className="space-y-4 mb-8">
          {steps.map((step, index) => (
            <Card key={step.id} className="overflow-hidden">
              <button
                type="button"
                className="w-full text-left flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleExpanded(step.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                    {step.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-400">Step {index + 1}</span>
                      <h3 className="font-semibold text-gray-900">{step.name}</h3>
                    </div>
                    <p className="text-sm text-gray-500">{step.purpose}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    {step.estimatedTime}
                  </div>
                  {getStatusBadge(step.status)}
                  {step.isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>

              {step.isExpanded && (
                <CardContent className="border-t bg-gray-50 pt-4">
                  {/* Status Buttons */}
                  <div className="flex gap-2 mb-4">
                    <Button 
                      size="sm" 
                      variant={step.status === "running" ? "default" : "outline"}
                      onClick={() => updateStepStatus(step.id, "running")}
                      className="gap-1"
                    >
                      <Play className="w-3 h-3" /> Running
                    </Button>
                    <Button 
                      size="sm" 
                      variant={step.status === "pass" ? "default" : "outline"}
                      onClick={() => updateStepStatus(step.id, "pass")}
                      className={step.status === "pass" ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Pass
                    </Button>
                    <Button 
                      size="sm" 
                      variant={step.status === "fail" ? "default" : "outline"}
                      onClick={() => updateStepStatus(step.id, "fail")}
                      className={step.status === "fail" ? "bg-red-600 hover:bg-red-700" : ""}
                    >
                      <XCircle className="w-3 h-3 mr-1" /> Fail
                    </Button>
                  </div>

                  {/* Checklist */}
                  <div className="space-y-2 mb-4">
                    {step.checkItems.map((item) => (
                      <div 
                        key={item.id}
                        className={`flex items-center gap-3 p-2 rounded ${item.critical ? "bg-yellow-50 border border-yellow-200" : "bg-white border border-gray-100"}`}
                      >
                        <Checkbox 
                          id={`${step.id}-${item.id}`}
                          checked={item.checked}
                          onCheckedChange={() => toggleCheckItem(step.id, item.id)}
                        />
                        <Label 
                          htmlFor={`${step.id}-${item.id}`}
                          className={`flex-1 cursor-pointer ${item.checked ? "line-through text-gray-400" : "text-gray-700"}`}
                        >
                          {item.label}
                        </Label>
                        {item.critical && (
                          <Badge variant="outline" className="text-yellow-700 border-yellow-400 bg-yellow-50 text-xs">
                            Critical
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Notes */}
                  <div>
                    <Label htmlFor={`notes-${step.id}`} className="text-sm text-gray-500 mb-1 block">
                      Notes
                    </Label>
                    <Textarea 
                      id={`notes-${step.id}`}
                      value={step.notes}
                      onChange={(e) => updateStepNotes(step.id, e.target.value)}
                      placeholder="Add any observations, issues, or comments..."
                      className="min-h-[80px]"
                    />
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {/* Critical Blockers Reference */}
        <Card className="mb-6 border-yellow-300 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="w-5 h-5" />
              Critical Blockers Reference
            </CardTitle>
            <CardDescription className="text-yellow-700">
              Any of these issues will block production deployment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-2">
              {criticalBlockers.map((blocker) => (
                <div key={blocker} className="flex items-center gap-2 text-sm text-yellow-800">
                  <XCircle className="w-4 h-4 text-red-500" />
                  {blocker}
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Label htmlFor="blocker-notes" className="text-sm text-yellow-800 mb-1 block">
                Document any blockers found
              </Label>
              <Textarea 
                id="blocker-notes"
                value={blockerNotes}
                onChange={(e) => setBlockerNotes(e.target.value)}
                placeholder="List any critical issues that need resolution before launch..."
                className="min-h-[100px] bg-white"
              />
            </div>
          </CardContent>
        </Card>

        {/* Export Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Export Launch Report
            </CardTitle>
            <CardDescription>
              Generate a final report with all test results, blockers, and notes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Link2 className="w-4 h-4" />
                  {siteUrl}
                </div>
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {testerName || "Not specified"}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date().toLocaleDateString()}
                </div>
              </div>
              <Button onClick={exportReport} className="gap-2">
                <Download className="w-4 h-4" />
                Download Report
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-400">
          Production Readiness Dashboard for Planet Motors
        </div>
      </div>
    </div>
  )
}
