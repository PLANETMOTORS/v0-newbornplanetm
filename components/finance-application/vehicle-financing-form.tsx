"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Car, Loader2, X } from "lucide-react"
import type { VehicleInfo, TradeInInfo, FinancingTerms, FinancingResult } from "./types"
import { safeNum } from "@/lib/pricing/format"

interface VehicleFinancingFormProps {
  vehicleInfo: VehicleInfo
  setVehicleInfo: (info: VehicleInfo) => void
  tradeIn: TradeInInfo
  setTradeIn: (info: TradeInInfo) => void
  financingTerms: FinancingTerms
  setFinancingTerms: (terms: FinancingTerms) => void
  financing: FinancingResult
  additionalNotes: string
  setAdditionalNotes: (notes: string) => void
}

/**
 * Map a payment-frequency code to its display label. Extracted from a
 * 4-way nested ternary to satisfy SonarCloud rule typescript:S3358.
 * Parameter is typed against the strict union from FinancingTerms so
 * invalid values are caught at compile time.
 */
function getPaymentFrequencyLabel(frequency: FinancingTerms["paymentFrequency"]): string {
  switch (frequency) {
    case "bi-weekly":
      return "Bi-Weekly"
    case "weekly":
      return "Weekly"
    case "semi-monthly":
      return "Semi-Monthly"
    case "monthly":
      return "Monthly"
    default: {
      const _exhaustive: never = frequency
      return _exhaustive ?? "Monthly"
    }
  }
}

export
function VehicleFinancingForm({ vehicleInfo, setVehicleInfo, tradeIn, setTradeIn, financingTerms, setFinancingTerms, financing, additionalNotes, setAdditionalNotes }: Readonly<VehicleFinancingFormProps>) {
  // Check if vehicle data was pre-filled (has year and make)
  const isVehicleSelected = Boolean(vehicleInfo.year && vehicleInfo.make && vehicleInfo.totalPrice)
  const [showInventoryModal, setShowInventoryModal] = useState(false)
  interface InventoryVehicle {
    id: string
    year: number
    make: string
    model: string
    trim?: string
    price: number
    vin?: string
    mileage?: number
    exterior_color?: string
    primary_image_url?: string
    stock_number?: string
  }
  const [inventoryVehicles, setInventoryVehicles] = useState<InventoryVehicle[]>([])
  const [isLoadingInventory, setIsLoadingInventory] = useState(false)
  const [inventorySearch, setInventorySearch] = useState("")
  
  // Fetch vehicles from inventory when modal opens
  useEffect(() => {
    if (showInventoryModal && inventoryVehicles.length === 0) {
      fetchInventory()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showInventoryModal])
  
  const fetchInventory = async () => {
    setIsLoadingInventory(true)
    try {
      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()
      const { data } = await supabase
        .from("vehicles")
        .select("id, year, make, model, trim, price, vin, mileage, exterior_color, primary_image_url, stock_number")
        .eq("status", "available")
        .order("created_at", { ascending: false })
        .limit(50)
      
      if (data) {
        setInventoryVehicles(data)
      }
    } catch (error) {
      console.error("Error fetching inventory:", error)
    } finally {
      setIsLoadingInventory(false)
    }
  }
  
  const handleSelectVehicle = (vehicle: InventoryVehicle) => {
    setVehicleInfo({
      ...vehicleInfo,
      vin: vehicle.vin || "",
      year: vehicle.year?.toString() || "",
      make: vehicle.make || "",
      model: vehicle.model || "",
      trim: vehicle.trim || "",
      color: vehicle.exterior_color || "",
      mileage: vehicle.mileage?.toString() || "",
      totalPrice: (safeNum(vehicle.price) / 100).toString(), // Convert from cents
    })
    setShowInventoryModal(false)
  }
  
  const filteredVehicles = inventoryVehicles.filter(v => {
    if (!inventorySearch) return true
    const searchLower = inventorySearch.toLowerCase()
    return (
      v.make?.toLowerCase().includes(searchLower) ||
      v.model?.toLowerCase().includes(searchLower) ||
      v.year?.toString().includes(searchLower) ||
      v.vin?.toLowerCase().includes(searchLower)
    )
  })
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Inventory Selection Modal */}
      {showInventoryModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-lg">Select Vehicle from Inventory</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowInventoryModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-4 border-b">
              <Input
                placeholder="Search by make, model, year, or VIN..."
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {(() => {
                if (isLoadingInventory) {
                  return (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  )
                }
                if (filteredVehicles.length === 0) {
                  return (
                    <div className="text-center py-12 text-muted-foreground">
                      No vehicles found in inventory
                    </div>
                  )
                }
                return (
                <div className="grid gap-3">
                  {filteredVehicles.map((vehicle) => (
                    <button
                      key={vehicle.id}
                      type="button"
                      className="flex items-center gap-4 p-3 rounded-lg border hover:border-primary hover:bg-primary/5 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-primary w-full text-left"
                      onClick={() => handleSelectVehicle(vehicle)}
                    >
                      <div className="w-24 h-16 bg-muted rounded overflow-hidden shrink-0">
                        {vehicle.primary_image_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element -- External CDN URL in modal */
                          <img
                            src={vehicle.primary_image_url}
                            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Car className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">
                          {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <span className="tabular-nums">{vehicle.mileage?.toLocaleString()} km</span> | Stock #{vehicle.stock_number}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">{vehicle.vin}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary tabular-nums" title="Price estimate — final all-in price confirmed at signing per OMVIC regulations">
                          ${(safeNum(vehicle.price) / 100).toLocaleString()}*
                        </p>
                        <span className="inline-block mt-1 text-xs font-semibold text-primary">Select →</span>
                      </div>
                    </button>
                  ))}
                </div>
                )
              })()}
              <p className="text-xs text-muted-foreground italic mt-3 px-1">*Prices are estimates. Final all-in price confirmed at signing per OMVIC regulations.</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Left Column - Vehicle Info */}
      <div className="space-y-6">
        <section>
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <Car className="w-4 h-4" />
            Vehicle Information
            {isVehicleSelected && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Selected from inventory</span>
            )}
          </h4>
          
          {!isVehicleSelected ? (
            // No vehicle selected - show browse button
            <div className="border-2 border-dashed border-primary/30 bg-primary/5 rounded-xl p-8 text-center">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Car className="w-8 h-8 text-primary" />
              </div>
              <h5 className="font-semibold text-lg mb-2">Select Your Vehicle</h5>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                Choose a vehicle from our inventory to proceed with your financing application. Vehicle information will be filled automatically.
              </p>
              <Button size="lg" onClick={() => setShowInventoryModal(true)}>
                <Car className="w-5 h-5 mr-2" />
                Browse Available Inventory
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                Vehicle selection is required to continue
              </p>
            </div>
          ) : (
            // Vehicle selected - show read-only details
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Vehicle details have been automatically filled from your selected vehicle.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>VIN</Label>
                  <Input 
                    data-testid="finance-step-3-vin" value={vehicleInfo.vin} 
                    readOnly
                    className="bg-muted font-mono text-sm"
                  />
                </div>
                <div>
                  <Label>Year</Label>
                  <Input 
                    data-testid="finance-step-3-year" value={vehicleInfo.year} 
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div>
                  <Label>Make</Label>
                  <Input 
                    data-testid="finance-step-3-make" value={vehicleInfo.make} 
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div>
                  <Label>Model/Trim</Label>
                  <Input 
                    value={`${vehicleInfo.model}${vehicleInfo.trim ? ` ${vehicleInfo.trim}` : ''}`} 
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div>
                  <Label>Color</Label>
                  <Input 
                    value={vehicleInfo.color} 
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div>
                  <Label>Current KMs</Label>
                  <Input 
                    value={vehicleInfo.mileage ? Number.parseInt(vehicleInfo.mileage).toLocaleString() : ""} 
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div>
                  <Label>Total Price Before Tax</Label>
                  <Input 
                    value={vehicleInfo.totalPrice ? `$${Number.parseFloat(vehicleInfo.totalPrice).toLocaleString()}` : ""} 
                    readOnly
                    className="bg-muted font-semibold"
                  />
                </div>
                <div>
                  <Label>Down Payment</Label>
                  <Input type="number" data-testid="finance-step-3-down-payment" value={vehicleInfo.downPayment} onChange={(e) => setVehicleInfo({ ...vehicleInfo, downPayment: e.target.value })} className="bg-green-50" />
                </div>
                <div>
                  <Label>Max Down Payment If Needed</Label>
                  <Input type="number" value={vehicleInfo.maxDownPayment} onChange={(e) => setVehicleInfo({ ...vehicleInfo, maxDownPayment: e.target.value })} />
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={() => setShowInventoryModal(true)}
              >
                <Car className="w-4 h-4 mr-2" />
                Change Vehicle
              </Button>
            </>
          )}
        </section>
        
        <Separator />
        
        {/* Trade-In */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Checkbox
              id="hasTradeIn"
              checked={tradeIn.hasTradeIn}
              onCheckedChange={(checked) => setTradeIn({ ...tradeIn, hasTradeIn: checked as boolean })}
            />
            <Label htmlFor="hasTradeIn" className="font-semibold cursor-pointer">Include Trade-in</Label>
          </div>
          
          {tradeIn.hasTradeIn && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="col-span-2">
                <Label>VIN</Label>
                <Input data-testid="finance-step-3-trade-vin" value={tradeIn.vin} onChange={(e) => setTradeIn({ ...tradeIn, vin: e.target.value })} />
              </div>
              <div>
                <Label>Year</Label>
                <Input value={tradeIn.year} onChange={(e) => setTradeIn({ ...tradeIn, year: e.target.value })} />
              </div>
              <div>
                <Label>Make</Label>
                <Input value={tradeIn.make} onChange={(e) => setTradeIn({ ...tradeIn, make: e.target.value })} />
              </div>
              <div>
                <Label>Model</Label>
                <Input value={tradeIn.model} onChange={(e) => setTradeIn({ ...tradeIn, model: e.target.value })} />
              </div>
              <div>
                <Label>Mileage (km)</Label>
                <Input type="text" inputMode="numeric" pattern="[0-9]*" value={tradeIn.mileage} onChange={(e) => setTradeIn({ ...tradeIn, mileage: e.target.value.replaceAll(/[^0-9]/g, '') })} autoComplete="off" />
              </div>
              <div>
                <Label>Condition</Label>
                <Select value={tradeIn.condition} onValueChange={(v) => setTradeIn({ ...tradeIn, condition: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Estimated Value</Label>
                <Input type="number" data-testid="finance-step-3-trade-value" value={tradeIn.estimatedValue} onChange={(e) => setTradeIn({ ...tradeIn, estimatedValue: e.target.value })} />
              </div>
              <div className="col-span-2 flex items-center gap-3 mt-2">
                <Checkbox
                  id="hasLien"
                  checked={tradeIn.hasLien}
                  onCheckedChange={(checked) => setTradeIn({ ...tradeIn, hasLien: checked as boolean })}
                />
                <Label htmlFor="hasLien" className="cursor-pointer">Vehicle has existing lien</Label>
              </div>
              {tradeIn.hasLien && (
                <>
                  <div>
                    <Label>Lien Holder</Label>
                    <Input value={tradeIn.lienHolder} onChange={(e) => setTradeIn({ ...tradeIn, lienHolder: e.target.value })} />
                  </div>
                  <div>
                    <Label>Lien Amount</Label>
                    <Input type="number" value={tradeIn.lienAmount} onChange={(e) => setTradeIn({ ...tradeIn, lienAmount: e.target.value })} />
                  </div>
                </>
              )}
            </div>
          )}
        </section>
        
        <Separator />
        
        {/* Additional Notes */}
        <section>
          <Label>Additional Notes</Label>
          <Textarea
            data-testid="finance-step-3-notes" value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            placeholder="Any additional information for your application..."
            rows={3}
          />
        </section>
      </div>
      
      {/* Right Column - Financing */}
      <div className="space-y-6">
        <section className="bg-muted/30 rounded-xl p-6">
          <h4 className="font-semibold mb-4">Financing</h4>
          
          {/* Agreement Type */}
          <div className="mb-4">
            <Label className="text-xs uppercase text-muted-foreground">Agreement Type</Label>
            <div className="flex gap-2 mt-2">
              <Button
                type="button"
                variant={financingTerms.agreementType === "finance" ? "default" : "outline"}
                onClick={() => setFinancingTerms({ ...financingTerms, agreementType: "finance" })}
                className="flex-1"
              >
                Finance
              </Button>
              <Button
                type="button"
                variant={financingTerms.agreementType === "cash" ? "default" : "outline"}
                onClick={() => setFinancingTerms({ ...financingTerms, agreementType: "cash" })}
                className="flex-1"
              >
                Cash (Out-the-Door)
              </Button>
            </div>
          </div>
          
          {financingTerms.agreementType === "finance" && (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label className="text-xs">Sales Tax %</Label>
                  <Input value={financingTerms.salesTaxRate} onChange={(e) => setFinancingTerms({ ...financingTerms, salesTaxRate: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Interest Rate %</Label>
                  <Input value={financingTerms.interestRate} onChange={(e) => setFinancingTerms({ ...financingTerms, interestRate: e.target.value })} placeholder="8.99" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label className="text-xs">Finance Docs Fee $ <span className="text-primary font-semibold">($895)</span></Label>
                  <Input value={financingTerms.adminFee} onChange={(e) => setFinancingTerms({ ...financingTerms, adminFee: e.target.value })} readOnly className="bg-muted" />
                </div>
                <div>
                  <Label className="text-xs">Delivery Fee $ <span className="text-muted-foreground">(Enter postal code)</span></Label>
                  <div className="flex gap-2">
                    <Input 
                      value={financingTerms.deliveryPostalCode} 
                      onChange={(e) => setFinancingTerms({ ...financingTerms, deliveryPostalCode: e.target.value.toUpperCase() })}
                      placeholder="L4C 1G7"
                      className="flex-1 font-mono uppercase"
                    />
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="outline"
                      onClick={async () => {
                        if (financingTerms.deliveryPostalCode.length >= 3) {
                          try {
                            const res = await fetch(`/api/v1/deliveries/quote?postalCode=${encodeURIComponent(financingTerms.deliveryPostalCode)}`)
                            const data = await res.json()
                            if (data.deliveryCost !== undefined) {
                              setFinancingTerms({ ...financingTerms, deliveryFee: data.deliveryCost.toString() })
                            }
                          } catch {
                            setFinancingTerms({ ...financingTerms, deliveryFee: "0" })
                          }
                        }
                      }}
                    >
                      Check
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {Number.parseFloat(financingTerms.deliveryFee) > 0 
                      ? `Delivery: $${Number.parseFloat(financingTerms.deliveryFee).toFixed(0)}` 
                      : "Free within 300km of Richmond Hill"}
                  </p>
                </div>
              </div>
              
              {/* Loan Term */}
              <div className="mb-4">
                <Label className="text-xs uppercase text-muted-foreground">Loan Term (Months)</Label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mt-2">
                  {[24, 36, 48, 60, 72, 84, 96].map((term) => (
                    <Button
                      key={term}
                      type="button"
                      size="sm"
                      variant={financingTerms.loanTermMonths === term ? "default" : "outline"}
                      onClick={() => setFinancingTerms({ ...financingTerms, loanTermMonths: term })}
                    >
                      {term}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Payment Frequency */}
              <div className="mb-6">
                <Label className="text-xs uppercase text-muted-foreground">Payment Frequency</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                  {([
                    { value: "weekly" as const, label: "Weekly" },
                    { value: "bi-weekly" as const, label: "Bi-Weekly" },
                    { value: "semi-monthly" as const, label: "Semi-Mo" },
                    { value: "monthly" as const, label: "Monthly" },
                  ]).map((freq) => (
                    <Button
                      key={freq.value}
                      type="button"
                      size="sm"
                      variant={financingTerms.paymentFrequency === freq.value ? "default" : "outline"}
                      onClick={() => setFinancingTerms({ ...financingTerms, paymentFrequency: freq.value })}
                    >
                      {freq.label}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Loan Breakdown */}
              <Separator className="my-4" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vehicle Price:</span>
                  <span>${financing.price.toLocaleString()}</span>
                </div>
                {financing.adminFee > 0 && (
                  <div className="flex justify-between text-primary">
                    <span className="font-semibold">Finance Docs Fee:</span>
                    <span className="font-semibold">+${financing.adminFee.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">OMVIC Fee:</span>
                  <span>+${financing.omvicFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Certification Fee:</span>
                  <span>+${financing.certificationFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Licensing Fee:</span>
                  <span>+${financing.licensingFee.toLocaleString()}</span>
                </div>
                {financing.deliveryFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery Fee:</span>
                    <span>+${financing.deliveryFee.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sales Tax ({financingTerms.salesTaxRate}%):</span>
                  <span>+${financing.tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Down Payment:</span>
                  <span>-${financing.downPayment.toLocaleString()}</span>
                </div>
                {financing.netTrade > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Net Trade Value:</span>
                    <span>-${financing.netTrade.toLocaleString()}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Amount Financed:</span>
                  <span>${financing.amountFinanced.toLocaleString()}</span>
                </div>
              </div>
              
              {/* Total Cost */}
              <div className="mt-4 p-4 bg-background rounded-lg border">
                <div className="text-xs text-muted-foreground mb-1">TOTAL COST</div>
                <div className="flex justify-between text-sm">
                  <span>{financing.totalPayments.toFixed(0)} payments x ${financing.payment.toFixed(2)}:</span>
                  <span>${financing.totalToRepay.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total to Repay:</span>
                  <span>${financing.totalToRepay.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Interest:</span>
                  <span>${financing.totalInterest.toLocaleString()}</span>
                </div>
              </div>
              
              {/* Payment Display */}
              <div className="mt-4 p-6 bg-primary/10 rounded-xl text-center">
                <div className="text-sm text-muted-foreground mb-1">
                  {getPaymentFrequencyLabel(financingTerms.paymentFrequency)} Payment
                </div>
                <div className="text-4xl font-bold text-primary tabular-nums">
                  ${financing.payment.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  <span className="tabular-nums">{financingTerms.loanTermMonths} months @ {financingTerms.interestRate || "0"}% APR</span>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
