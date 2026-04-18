type AnyConfig = Record<string, unknown>

type AnchorLike = { id: string; x: number; y: number }

export function migrateV1_1ToV2(input: AnyConfig): AnyConfig {
  const cfg = structuredClone(input)
  cfg.schemaVersion = "2.0.0"
  cfg.version = "2.0.0"

  // ensure tireMerge exists
  const global = (cfg.global as Record<string, unknown>) ?? {}
  if (!global.tireMerge) {
    const anchors = (global.wheelAnchors as AnchorLike[]) ?? []
    global.tireMerge = {
      enabled: true,
      contactTolerancePx: 3,
      verticalSnapPxMax: 6,
      anchorSmoothingAlpha: 0.25,
      spots: anchors.map((a) => ({
        id: a.id,
        x: a.x,
        y: a.y,
        radiusPxAt1200w: 12,
      })),
    }
  }
  cfg.global = global

  return cfg
}
