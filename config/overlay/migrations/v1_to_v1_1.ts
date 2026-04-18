type AnyConfig = Record<string, unknown>

export function migrateV1ToV1_1(input: AnyConfig): AnyConfig {
  const cfg = structuredClone(input)
  cfg.version = "1.1.0"

  // add activeProfile default if missing
  if (!("activeProfile" in cfg)) {
    cfg.activeProfile = "pure_white_cyclorama"
  }

  return cfg
}
