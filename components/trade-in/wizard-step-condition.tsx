"use client"
import { useTradeIn, conditionOptions } from "./trade-in-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { CheckCircle, Target, ArrowRight } from "lucide-react"

export function WizardStepCondition() {
  const { selectedYear, selectedMake, selectedModel, selectedTrim, mileage, goToStep, nextStep, prevStep, condition, setCondition, hasAccident, setHasAccident, hasMechanicalIssues, setHasMechanicalIssues, hasLien, setHasLien, payoffAmount, setPayoffAmount, additionalNotes, setAdditionalNotes } = useTradeIn()
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-primary" />Vehicle Condition</CardTitle>
        <CardDescription>Help us give you the most accurate offer</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 bg-muted/50 rounded-lg flex items-center justify-between">
          <div>
            <p className="font-semibold">{selectedYear} {selectedMake} {selectedModel} {selectedTrim}</p>
            <p className="text-sm text-muted-foreground">{mileage ? parseInt(mileage).toLocaleString() : "0"} km</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => goToStep(1)}>Edit</Button>
        </div>
        <div className="space-y-3">
          <Label className="text-base font-semibold">Overall Condition</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {conditionOptions.map((opt) => (
              <div key={opt.value} className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${condition === opt.value ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"}`} onClick={() => setCondition(opt.value)}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold">{opt.label}</span>
                  {condition === opt.value && <CheckCircle className="h-5 w-5 text-primary" />}
                </div>
                <p className="text-sm text-muted-foreground">{opt.description}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4 pt-4 border-t">
          <Label className="text-base font-semibold">Additional Information</Label>
          <div className="flex items-start space-x-3 p-4 border rounded-lg">
            <Checkbox id="accident" checked={hasAccident} onCheckedChange={(c) => setHasAccident(c as boolean)} />
            <div className="space-y-1"><Label htmlFor="accident" className="cursor-pointer font-semibold">Has this vehicle been in an accident?</Label><p className="text-sm text-muted-foreground">Include any collision, even minor fender benders</p></div>
          </div>
          <div className="flex items-start space-x-3 p-4 border rounded-lg">
            <Checkbox id="mechanical" checked={hasMechanicalIssues} onCheckedChange={(c) => setHasMechanicalIssues(c as boolean)} />
            <div className="space-y-1"><Label htmlFor="mechanical" className="cursor-pointer font-semibold">Are there any mechanical issues?</Label><p className="text-sm text-muted-foreground">Check engine light, transmission issues, unusual sounds, etc.</p></div>
          </div>
          <div className="flex items-start space-x-3 p-4 border rounded-lg">
            <Checkbox id="lien" checked={hasLien} onCheckedChange={(c) => setHasLien(c as boolean)} />
            <div className="space-y-1"><Label htmlFor="lien" className="cursor-pointer font-semibold">Is there a loan or lien on this vehicle?</Label><p className="text-sm text-muted-foreground">We can pay off your lender directly</p></div>
          </div>
          {hasLien && (
            <div className="ml-7 space-y-2">
              <Label>Approximate Payoff Amount</Label>
              <Input type="number" placeholder="Enter payoff amount" value={payoffAmount} onChange={(e) => setPayoffAmount(e.target.value)} className="max-w-xs" />
            </div>
          )}
          <div className="space-y-2">
            <Label>Additional Notes (optional)</Label>
            <Textarea placeholder="Any other details about your vehicle..." value={additionalNotes} onChange={(e) => setAdditionalNotes(e.target.value)} rows={3} />
          </div>
        </div>
        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={prevStep} className="flex-1">Back</Button>
          <Button onClick={nextStep} className="flex-1">Continue <ArrowRight className="ml-2 h-4 w-4" /></Button>
        </div>
      </CardContent>
    </Card>
  )
}
