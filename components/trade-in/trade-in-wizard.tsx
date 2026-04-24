"use client"

import { useTradeIn } from "./trade-in-context"
import { WizardStepCondition } from "./wizard-step-condition"
import { WizardStepPhotos } from "./wizard-step-photos"
import { WizardStepOffer } from "./wizard-step-offer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, DollarSign, ArrowRight } from "lucide-react"

export function TradeInWizard() {
  const { step, stepContentRef, selectedYear, selectedMake, selectedModel, vehicleFound, foundVehicle, lookupMethod, mileage, setMileage, goToStep, isCalculating, calculationProgress } = useTradeIn()

  return (
    <>
      {/* VIN/Plate result banner */}
      {vehicleFound && foundVehicle && (lookupMethod === "vin" || lookupMethod === "plate") && step === 1 && (
        <section className="py-8 bg-emerald-50 dark:bg-emerald-950/20 border-b">
          <div className="container mx-auto px-4">
            <div className="max-w-xl mx-auto">
              <Card className="shadow-lg border-emerald-200 dark:border-emerald-800">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">Vehicle Found!</h3>
                      <p className="text-2xl font-bold mt-1">{foundVehicle.year} {foundVehicle.make} {foundVehicle.model} {foundVehicle.trim}</p>
                      {foundVehicle.vin && <p className="text-sm text-muted-foreground font-mono mt-1">VIN: {foundVehicle.vin}</p>}
                      <div className="mt-4 space-y-3">
                        <Input placeholder="Enter your mileage (km)" aria-label="Vehicle mileage in kilometres" type="text" inputMode="numeric" pattern="[0-9]*" className="h-12" value={mileage} onChange={(e) => setMileage(e.target.value.replace(/[^0-9]/g, ""))} autoComplete="off" />
                        <Button className="w-full h-12 text-lg" size="lg" onClick={() => goToStep(2)} disabled={!mileage}>
                          Continue to Get Offer <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* Main wizard */}
      {step >= 2 && (
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto" ref={stepContentRef}>
              {/* Progress bar */}
              <div className="flex items-center justify-between mb-8 px-4">
                <div className="flex items-center gap-3 bg-muted/50 rounded-full px-4 py-2 mr-4">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span className="text-sm font-semibold truncate">{selectedYear} {selectedMake} {selectedModel}</span>
                </div>
                {[{ num: 2, label: "Condition" }, { num: 3, label: "Photos" }, { num: 4, label: "Your Offer" }].map((s, i) => (
                  <div key={s.num} className="flex items-center">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all ${step >= s.num ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      {step > s.num ? <CheckCircle className="h-5 w-5" /> : i + 1}
                    </div>
                    <span className={`ml-2 hidden sm:block text-sm ${step >= s.num ? "text-foreground font-semibold" : "text-muted-foreground"}`}>{s.label}</span>
                    {i < 2 && <div className={`hidden sm:block w-12 lg:w-24 h-0.5 mx-3 ${step > s.num ? "bg-primary" : "bg-muted"}`} />}
                  </div>
                ))}
              </div>

              {step === 2 && <WizardStepCondition />}
              {step === 3 && <WizardStepPhotos />}
              {step === 4 && !isCalculating && <WizardStepOffer />}

              {isCalculating && (
                <Card className="shadow-lg">
                  <CardContent className="py-16 text-center">
                    <div className="w-20 h-20 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
                      <DollarSign className="h-10 w-10 text-primary animate-pulse" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4">Calculating Your Offer...</h3>
                    <Progress value={calculationProgress} className="max-w-md mx-auto mb-4" />
                    <p className="text-muted-foreground">Checking Canadian Black Book values and market data</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
