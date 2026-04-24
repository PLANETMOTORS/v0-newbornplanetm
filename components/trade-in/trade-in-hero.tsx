"use client"

import { useTradeIn } from "./trade-in-context"
import { vehicleMakes, vehicleTrims } from "./trade-in-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, AlertCircle, Shield, Zap, Truck, ArrowRight } from "lucide-react"

export function TradeInHero() {
  const {
    lookupMethod, setLookupMethod,
    vinNumber, setVinNumber, isLookingUp, handleVinLookup,
    plateNumber, setPlateNumber, province, setProvince, handlePlateLookup,
    selectedYear, setSelectedYear, selectedMake, setSelectedMake,
    selectedModel, setSelectedModel, selectedTrim, setSelectedTrim,
    mileage, setMileage, goToStep, setVehicleFound,
  } = useTradeIn()

  return (
    <section className="relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-16 sm:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.08),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(16,185,129,0.06),transparent_50%)]" />
      <div className="container mx-auto px-4 relative">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-[-0.01em] sm:tracking-[-0.02em]">
            What&apos;s Your Car Worth?
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 max-w-xl mx-auto">
            Get an instant trade-in offer in under 60 seconds.
            <br className="hidden sm:block" />
            No haggling. No spam. Just your number.
          </p>
        </div>

        <div className="max-w-xl mx-auto">
          <Card className="shadow-2xl border-0 bg-white/[0.03] backdrop-blur-xl border border-white/10">
            <CardContent className="p-6 sm:p-8">
              <Tabs value={lookupMethod} onValueChange={(v) => setLookupMethod(v as "vin" | "plate" | "manual")}>
                <TabsList className="grid w-full grid-cols-3 mb-6 bg-white/5 border border-white/10 h-12">
                  <TabsTrigger value="vin" className="text-white/70 data-[state=active]:bg-primary data-[state=active]:text-white text-sm font-semibold">VIN Lookup</TabsTrigger>
                  <TabsTrigger value="plate" className="text-white/70 data-[state=active]:bg-primary data-[state=active]:text-white text-sm font-semibold">Plate #</TabsTrigger>
                  <TabsTrigger value="manual" className="text-white/70 data-[state=active]:bg-primary data-[state=active]:text-white text-sm font-semibold">Manual</TabsTrigger>
                </TabsList>

                <TabsContent value="vin" className="space-y-4">
                  <div className="relative">
                    <Input
                      placeholder="Enter your 17-character VIN"
                      aria-label="Vehicle Identification Number (VIN)"
                      className="uppercase text-lg tracking-wider font-mono h-14 bg-white/5 border-white/20 text-white placeholder:text-white/30 pr-12"
                      maxLength={17}
                      value={vinNumber}
                      onChange={(e) => setVinNumber(e.target.value.toUpperCase())}
                    />
                    {vinNumber.length > 0 && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-white/40 font-mono">{vinNumber.length}/17</span>
                    )}
                  </div>
                  <p className="text-xs text-white/40 flex items-center gap-1.5">
                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                    Found on your registration, insurance card, or driver-side door jamb
                  </p>
                  <Button className="w-full h-14 text-lg font-semibold" size="lg" onClick={handleVinLookup} disabled={vinNumber.length !== 17 || isLookingUp}>
                    {isLookingUp ? <span className="flex items-center gap-2"><span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> Decoding VIN...</span> : <><Search className="mr-2 h-5 w-5" /> Look Up My Vehicle</>}
                  </Button>
                </TabsContent>

                <TabsContent value="plate" className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <Input placeholder="License plate" aria-label="License plate number" className="uppercase text-lg tracking-wider font-mono h-14 bg-white/5 border-white/20 text-white placeholder:text-white/30" value={plateNumber} onChange={(e) => setPlateNumber(e.target.value.toUpperCase())} />
                    </div>
                    <Select value={province} onValueChange={setProvince}>
                      <SelectTrigger aria-label="Province" className="h-14 bg-white/5 border-white/20 text-white"><SelectValue placeholder="ON" /></SelectTrigger>
                      <SelectContent>{["ON","QC","BC","AB","SK","MB","NS","NB","NL","PE","NT","NU","YT"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full h-14 text-lg font-semibold" size="lg" onClick={handlePlateLookup} disabled={!plateNumber || isLookingUp}>
                    {isLookingUp ? <span className="flex items-center gap-2"><span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> Looking Up...</span> : <><Search className="mr-2 h-5 w-5" /> Look Up Vehicle</>}
                  </Button>
                </TabsContent>

                <TabsContent value="manual" className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger aria-label="Year" className="h-12 bg-white/5 border-white/20 text-white"><SelectValue placeholder="Year" /></SelectTrigger>
                      <SelectContent>{Array.from({ length: 25 }, (_, i) => 2026 - i).map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={selectedMake} onValueChange={(v) => { setSelectedMake(v); setSelectedModel(""); setSelectedTrim("") }}>
                      <SelectTrigger aria-label="Make" className="h-12 bg-white/5 border-white/20 text-white"><SelectValue placeholder="Make" /></SelectTrigger>
                      <SelectContent>{Object.keys(vehicleMakes).map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={selectedModel} onValueChange={(v) => { setSelectedModel(v); setSelectedTrim("") }} disabled={!selectedMake}>
                      <SelectTrigger aria-label="Model" className="h-12 bg-white/5 border-white/20 text-white"><SelectValue placeholder="Model" /></SelectTrigger>
                      <SelectContent>{selectedMake && vehicleMakes[selectedMake]?.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={selectedTrim} onValueChange={setSelectedTrim} disabled={!selectedModel}>
                      <SelectTrigger aria-label="Trim" className="h-12 bg-white/5 border-white/20 text-white"><SelectValue placeholder="Trim" /></SelectTrigger>
                      <SelectContent>{selectedModel && (vehicleTrims[selectedModel] || vehicleTrims["default"])?.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <Input placeholder="Mileage (km)" aria-label="Vehicle mileage in kilometres" type="text" inputMode="numeric" pattern="[0-9]*" className="h-12 bg-white/5 border-white/20 text-white placeholder:text-white/30" value={mileage} onChange={(e) => setMileage(e.target.value.replace(/[^0-9]/g, ""))} autoComplete="off" />
                  <Button className="w-full h-14 text-lg font-semibold" size="lg" onClick={() => { goToStep(2); setVehicleFound(true) }} disabled={!selectedYear || !selectedMake || !selectedModel || !selectedTrim || !mileage}>
                    Get My Instant Offer <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  {(!selectedYear || !selectedMake || !selectedModel || !selectedTrim || !mileage) && (
                    <p className="text-xs text-white/50 text-center mt-2">Please fill in all fields above to get your offer</p>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="flex items-center justify-center gap-6 mt-6 text-xs sm:text-sm text-white/40">
            <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> No Obligation</span>
            <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5" /> Instant Result</span>
            <span className="flex items-center gap-1.5"><Truck className="h-3.5 w-3.5" /> Free Pickup</span>
          </div>
        </div>
      </div>
    </section>
  )
}
