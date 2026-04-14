/**
 * Shared runtime type guards for financing document API routes.
 * Used by:
 *   app/api/v1/financing/documents/route.ts
 *   app/api/v1/financing/documents/download/route.ts
 */

export type DocumentWithApplication = {
  id: string
  finance_applications_v2: { user_id: string } | Array<{ user_id: string }>
}

export type DocumentWithFileAndApplication = {
  id: string
  file_url: string
  finance_applications_v2: { user_id: string } | Array<{ user_id: string }>
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === "[object Object]"
}

function isRecordWithString<K extends string>(
  value: unknown,
  key: K
): value is Record<K, string> {
  return isPlainObject(value) && typeof value[key] === "string"
}

function hasUserId(value: unknown): value is { user_id: string } {
  return isRecordWithString(value, "user_id")
}

export function isDocumentWithApplication(
  value: unknown
): value is DocumentWithApplication {
  if (!isRecordWithString(value, "id")) {
    return false
  }

  const application = value.finance_applications_v2
  if (Array.isArray(application)) {
    return application.every(hasUserId)
  }

  return hasUserId(application)
}

export function isDocumentWithFileAndApplication(
  value: unknown
): value is DocumentWithFileAndApplication {
  if (!isRecordWithString(value, "id") || !isRecordWithString(value, "file_url")) {
    return false
  }

  const application = value.finance_applications_v2
  if (Array.isArray(application)) {
    return application.every(hasUserId)
  }

  return hasUserId(application)
}
