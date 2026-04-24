"use client"
import { useTradeIn } from "./trade-in-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Camera, Upload, TrendingUp, CheckCircle, ArrowRight } from "lucide-react"

export function WizardStepPhotos() {
  const { photos, fileInputRefs, handlePhotoUpload, removePhoto, nextStep, prevStep } = useTradeIn()
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Camera className="h-5 w-5 text-primary" />Add Photos (Optional)</CardTitle>
        <CardDescription>Photos can increase your offer by up to 10%</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {["Front", "Back", "Interior", "Dashboard"].map((angle) => (
            <div key={angle} className="relative">
              <input id={`photo-upload-${angle}`} type="file" accept="image/*" capture="environment" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" style={{ zIndex: photos[angle] ? -1 : 1 }} ref={(el) => { fileInputRefs.current[angle] = el }} onChange={(e) => { handlePhotoUpload(angle, e.target.files?.[0] || null); e.currentTarget.value = "" }} />
              {photos[angle] ? (
                <div className="aspect-video rounded-lg overflow-hidden relative group/photo border-2 border-green-500">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photos[angle].preview} alt={angle} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <label htmlFor={`photo-upload-${angle}`} className="bg-white text-black px-2 py-1 rounded text-xs font-semibold cursor-pointer">Replace</label>
                    <button aria-label={`Remove ${angle} photo`} onClick={() => removePhoto(angle)} className="bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold relative z-10">Remove</button>
                  </div>
                  <CheckCircle className="absolute top-2 right-2 w-5 h-5 text-green-500" />
                </div>
              ) : (
                <label htmlFor={`photo-upload-${angle}`} className="aspect-video border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 cursor-pointer transition-all">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{angle}</span>
                </label>
              )}
            </div>
          ))}
        </div>
        {Object.keys(photos).length > 0 && <p className="text-sm text-green-600 font-semibold">✓ {Object.keys(photos).length} photo{Object.keys(photos).length > 1 ? "s" : ""} added</p>}
        <div className="p-4 bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800 rounded-lg">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-teal-600 mt-0.5" />
            <div><p className="font-semibold text-teal-900 dark:text-teal-100">Photos boost your offer!</p><p className="text-sm text-teal-700 dark:text-teal-300">Vehicles with photos typically receive offers 5-10% higher than those without.</p></div>
          </div>
        </div>
        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={prevStep} className="flex-1">Back</Button>
          <Button variant="outline" onClick={nextStep} className="flex-1">Skip for Now</Button>
          <Button onClick={nextStep} className="flex-1">Continue <ArrowRight className="ml-2 h-4 w-4" /></Button>
        </div>
      </CardContent>
    </Card>
  )
}
