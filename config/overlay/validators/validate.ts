import {
  OverlayConfigSchema,
  type ValidatedOverlayConfig,
} from "./overlay-config.schema"

export function parseOverlayConfig(input: unknown): ValidatedOverlayConfig {
  const parsed = OverlayConfigSchema.safeParse(input)
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("; ")
    throw new Error(`Invalid overlay config: ${details}`)
  }
  return parsed.data
}
