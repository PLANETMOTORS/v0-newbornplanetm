"use client"

import { useRef, useState, useEffect, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, X, FileImage, AlertCircle, Loader2 } from "lucide-react"
import { uploadDriversLicense } from "@/app/actions/upload-license"

export interface DriversLicenseData {
  licenseFile: File | null
  licensePreviewUrl: string
  licenseFirstName: string
  licenseLastName: string
  licenseStoragePath?: string
}

interface DriversLicenseStepProps {
  data: DriversLicenseData
  prefillFirstName: string
  prefillLastName: string
  vehicleId: string
  customerEmail: string
  onChange: (data: DriversLicenseData) => void
  onContinue: () => void
}

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"]

export function DriversLicenseStep({
  data,
  prefillFirstName,
  prefillLastName,
  vehicleId,
  customerEmail,
  onChange,
  onContinue,
}: DriversLicenseStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Re-create blob URL if we remount with a File but a stale/revoked preview URL
  useEffect(() => {
    if (data.licenseFile && data.licenseFile.type.startsWith("image/") && !data.licensePreviewUrl) {
      const freshUrl = URL.createObjectURL(data.licenseFile)
      onChange({ ...data, licensePreviewUrl: freshUrl })
    }
    // Only run on mount to recover from revoked blob URLs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFile = (file: File) => {
    setError("")
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Please upload a JPG, PNG, WebP, or PDF file.")
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("File must be under 5 MB.")
      return
    }

    // Revoke previous blob URL to prevent memory leak
    if (data.licensePreviewUrl) URL.revokeObjectURL(data.licensePreviewUrl)

    const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : ""

    onChange({
      ...data,
      licenseFile: file,
      licensePreviewUrl: previewUrl,
      licenseStoragePath: undefined,
      licenseFirstName: data.licenseFirstName || prefillFirstName,
      licenseLastName: data.licenseLastName || prefillLastName,
    })
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const removeFile = () => {
    if (data.licensePreviewUrl) {
      URL.revokeObjectURL(data.licensePreviewUrl)
    }
    onChange({ ...data, licenseFile: null, licensePreviewUrl: "", licenseStoragePath: undefined })
    // Reset input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleContinue = () => {
    if (!data.licenseFile) {
      setError("Please upload your driver's license.")
      return
    }

    // If already uploaded to server, just advance
    if (data.licenseStoragePath) {
      onContinue()
      return
    }

    // Upload to secure server-side storage
    startTransition(async () => {
      setError("")
      const formData = new FormData()
      formData.append("file", data.licenseFile as File)
      formData.append("vehicleId", vehicleId)
      formData.append("customerEmail", customerEmail)

      const result = await uploadDriversLicense(formData)

      if (!result.success) {
        setError(result.error ?? "Upload failed. Please try again.")
        return
      }

      onChange({ ...data, licenseStoragePath: result.storagePath })
      onContinue()
    })
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-[-0.01em] mb-1">Driver&apos;s license</h1>
        <p className="text-muted-foreground">
          Upload a photo of the front of your driver&apos;s license. This is required for vehicle registration.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive" role="alert">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {!data.licenseFile ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click() }}
          aria-label="Upload driver's license"
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
            isDragging
              ? "border-blue-600 bg-blue-50"
              : "border-blue-300 hover:border-blue-500 hover:bg-blue-50/50"
          }`}
        >
          <Upload className="w-10 h-10 text-blue-500 mx-auto mb-3" aria-hidden="true" />
          <p className="font-semibold">Click or drag to upload</p>
          <p className="text-sm text-muted-foreground mt-1">JPG, PNG, WebP, or PDF — max 5 MB</p>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            className="sr-only"
            aria-label="Choose driver's license file"
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
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={data.licensePreviewUrl}
                alt="Driver's license preview"
                width={160}
                height={100}
                className="w-40 h-24 rounded-lg object-cover border"
              />
            ) : (
              <div className="w-40 h-24 bg-muted rounded-lg flex items-center justify-center">
                <FileImage className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{data.licenseFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {(data.licenseFile.size / 1024 / 1024).toFixed(1)} MB
              </p>
              {data.licenseStoragePath && (
                <p className="text-xs text-green-600 mt-1">Securely uploaded</p>
              )}
            </div>
            <button
              type="button"
              onClick={removeFile}
              disabled={isPending}
              className="p-2 rounded-full hover:bg-destructive/10 transition-colors disabled:opacity-50"
              aria-label="Remove uploaded file"
            >
              <X className="w-5 h-5 text-destructive" />
            </button>
          </div>
        </div>
      )}

      <fieldset>
        <legend className="font-semibold mb-1">Name on license</legend>
        <p className="text-sm text-muted-foreground mb-4">
          Confirm the name matches your driver&apos;s license exactly.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="licenseFirstName">First name</Label>
            <Input
              id="licenseFirstName"
              autoComplete="given-name"
              disabled={isPending}
              value={data.licenseFirstName !== "" ? data.licenseFirstName : prefillFirstName}
              onChange={(e) => onChange({ ...data, licenseFirstName: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="licenseLastName">Last name</Label>
            <Input
              id="licenseLastName"
              autoComplete="family-name"
              disabled={isPending}
              value={data.licenseLastName !== "" ? data.licenseLastName : prefillLastName}
              onChange={(e) => onChange({ ...data, licenseLastName: e.target.value })}
            />
          </div>
        </div>
      </fieldset>

      <Button
        onClick={handleContinue}
        disabled={isPending}
        className="w-full h-12 text-base font-semibold"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
            Uploading securely…
          </>
        ) : (
          "Continue"
        )}
      </Button>
    </div>
  )
}
