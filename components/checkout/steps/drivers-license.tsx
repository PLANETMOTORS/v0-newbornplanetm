"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, X, FileImage, AlertCircle } from "lucide-react"

export interface DriversLicenseData {
  licenseFile: File | null
  licensePreviewUrl: string
  licenseFirstName: string
  licenseLastName: string
}

interface DriversLicenseStepProps {
  data: DriversLicenseData
  prefillFirstName: string
  prefillLastName: string
  onChange: (data: DriversLicenseData) => void
  onContinue: () => void
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"]

export function DriversLicenseStep({
  data,
  prefillFirstName,
  prefillLastName,
  onChange,
  onContinue,
}: DriversLicenseStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState("")

  const handleFile = (file: File) => {
    setError("")
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Please upload a JPG, PNG, WebP, or PDF file.")
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("File must be under 10 MB.")
      return
    }
    const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : ""
    onChange({
      ...data,
      licenseFile: file,
      licensePreviewUrl: previewUrl,
      licenseFirstName: data.licenseFirstName || prefillFirstName,
      licenseLastName: data.licenseLastName || prefillLastName,
    })
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const removeFile = () => {
    if (data.licensePreviewUrl) URL.revokeObjectURL(data.licensePreviewUrl)
    onChange({ ...data, licenseFile: null, licensePreviewUrl: "" })
  }

  const validate = (): boolean => {
    if (!data.licenseFile) {
      setError("Please upload your driver's license.")
      return false
    }
    return true
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Driver&apos;s license</h1>
        <p className="text-muted-foreground">
          Upload a photo of the front of your driver&apos;s license. This is required for vehicle registration.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Upload area */}
      {!data.licenseFile ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click() }}
          className="border-2 border-dashed border-blue-300 rounded-xl p-12 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-colors"
        >
          <Upload className="w-10 h-10 text-blue-500 mx-auto mb-3" />
          <p className="font-medium">Click or drag to upload</p>
          <p className="text-sm text-muted-foreground mt-1">JPG, PNG, WebP, or PDF — max 10 MB</p>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
            }}
          />
        </div>
      ) : (
        <div className="border rounded-xl p-4">
          <div className="flex items-center gap-4">
            {data.licensePreviewUrl ? (
              <Image
                src={data.licensePreviewUrl}
                alt="Driver's license preview"
                width={160}
                height={100}
                className="rounded-lg object-cover border"
              />
            ) : (
              <div className="w-40 h-24 bg-muted rounded-lg flex items-center justify-center">
                <FileImage className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{data.licenseFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {(data.licenseFile.size / 1024 / 1024).toFixed(1)} MB
              </p>
            </div>
            <button
              type="button"
              onClick={removeFile}
              className="p-2 rounded-full hover:bg-destructive/10 transition-colors"
              aria-label="Remove file"
            >
              <X className="w-5 h-5 text-destructive" />
            </button>
          </div>
        </div>
      )}

      {/* Name confirmation */}
      <section>
        <h2 className="font-semibold mb-1">Name on license</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Confirm the name matches your driver&apos;s license exactly.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="licenseFirstName">First name</Label>
            <Input
              id="licenseFirstName"
              value={data.licenseFirstName !== "" ? data.licenseFirstName : prefillFirstName}
              onChange={(e) => onChange({ ...data, licenseFirstName: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="licenseLastName">Last name</Label>
            <Input
              id="licenseLastName"
              value={data.licenseLastName !== "" ? data.licenseLastName : prefillLastName}
              onChange={(e) => onChange({ ...data, licenseLastName: e.target.value })}
            />
          </div>
        </div>
      </section>

      <Button
        onClick={() => { if (validate()) onContinue() }}
        className="w-full h-12 text-base font-semibold"
      >
        Continue
      </Button>
    </div>
  )
}
