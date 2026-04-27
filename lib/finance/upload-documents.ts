/**
 * Uploads financing application documents to the server.
 * Extracted as a standalone utility for testability.
 */
export interface DocumentItem {
  file: File | null
  type: string
}

export async function uploadDocuments(
  applicationId: string,
  docs: DocumentItem[]
): Promise<void> {
  for (const doc of docs) {
    if (!doc.file) continue
    const formData = new FormData()
    formData.append("file", doc.file)
    formData.append("applicationId", applicationId)
    formData.append("documentType", doc.type)
    try {
      const uploadRes = await fetch("/api/v1/financing/documents", { method: "POST", body: formData })
      if (!uploadRes.ok) console.error("Document upload failed:", doc.type)
    } catch (uploadErr) {
      console.error("Document upload error:", uploadErr)
    }
  }
}
