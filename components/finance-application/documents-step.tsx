"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { FileText, Upload, CheckCircle, Shield } from "lucide-react"
import type { DocumentUpload } from "./types"

interface DocumentsStepProps {
  documents: DocumentUpload[]
  setDocuments: (d: DocumentUpload[]) => void
  onSubmit: () => void
  isSubmitting: boolean
}

export function DocumentsStep({ documents, setDocuments, onSubmit: _onSubmit, isSubmitting: _isSubmitting }: DocumentsStepProps) {
  const documentTypes = [
    { value: "drivers_license", label: "Driver's License", required: true },
    { value: "proof_of_income", label: "Proof of Income (Pay Stub/T4)", required: true },
    { value: "proof_of_address", label: "Proof of Address (Utility Bill)", required: false },
    { value: "void_cheque", label: "Void Cheque", required: false },
  ]
  
  const handleFileChange = (type: string, file: File | null) => {
    const existing = documents.find(d => d.type === type)
    if (existing) {
      setDocuments(documents.map(d => d.type === type ? { ...d, file } : d))
    } else {
      setDocuments([...documents, { type, name: file?.name || "", file }])
    }
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Upload Verification Documents</h3>
        <p className="text-sm text-muted-foreground">
          Please upload the following documents to verify your identity and income.
        </p>
      </div>
      
      <div className="grid gap-4">
        {documentTypes.map((docType) => {
          const uploaded = documents.find(d => d.type === docType.value)
          return (
            <div key={docType.value} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  uploaded?.file ? "bg-green-100" : "bg-muted"
                )}>
                  {uploaded?.file ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <FileText className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{docType.label}</p>
                  {uploaded?.file && (
                    <p className="text-sm text-muted-foreground">{uploaded.file.name}</p>
                  )}
                </div>
              </div>
              <div>
                <input
                  type="file"
                  id={docType.value}
                  className="hidden"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileChange(docType.value, e.target.files?.[0] || null)}
                />
                <Button
                  type="button"
                  variant={uploaded?.file ? "outline" : "secondary"}
                  size="sm"
                  onClick={() => document.getElementById(docType.value)?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploaded?.file ? "Replace" : "Upload"}
                </Button>
              </div>
            </div>
          )
        })}
      </div>
      
      <div className="p-4 bg-muted/50 rounded-lg flex items-start gap-3">
        <Shield className="w-5 h-5 text-primary mt-0.5" />
        <div className="text-sm">
          <p className="font-medium">Your documents are secure</p>
          <p className="text-muted-foreground">
            All uploaded documents are encrypted and stored securely. They will only be used for verification purposes.
          </p>
        </div>
      </div>
    </div>
  )
}
