import { z } from "zod"

/** Helpers */
const unit = z.number().min(0).max(1)
const positive = z.number().positive()
const nonNegative = z.number().min(0)
const hexColor = z
  .string()
  .regex(/^#([0-9A-Fa-f]{6})$/, "Expected #RRGGBB color")

const WheelIdSchema = z.enum(["FL", "FR", "RL", "RR"])

const AnchorSchema = z.object({
  id: WheelIdSchema,
  x: unit,
  y: unit,
})

const SafeBoxSchema = z
  .object({
    x: unit,
    y: unit,
    w: z.number().min(0).max(1),
    h: z.number().min(0).max(1),
  })
  .superRefine((v, ctx) => {
    if (v.x + v.w > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["w"],
        message: "safeBox.x + safeBox.w must be <= 1",
      })
    }
    if (v.y + v.h > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["h"],
        message: "safeBox.y + safeBox.h must be <= 1",
      })
    }
  })

const ShadowEllipseSchema = z.object({
  cx: unit,
  cy: unit,
  rx: z.number().min(0).max(1),
  ry: z.number().min(0).max(1),
})

const ReflectionSchema = z.object({
  maxOpacity: z.number().min(0).max(1),
  fadeDistanceVehicleHeight: z.number().min(0).max(2),
})

const TireMergeSpotSchema = z.object({
  id: WheelIdSchema,
  x: unit,
  y: unit,
  radiusPxAt1200w: z.number().min(1).max(500),
})

const TireMergeSchema = z.object({
  enabled: z.boolean(),
  contactTolerancePx: z.number().min(0).max(50),
  verticalSnapPxMax: z.number().min(0).max(50),
  anchorSmoothingAlpha: z.number().min(0).max(1),
  spots: z.array(TireMergeSpotSchema).length(4),
})

const ProfileSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  colors: z.object({
    wallTop: hexColor,
    wallMid: hexColor,
    floorNear: hexColor,
    floorFar: hexColor,
  }),
  shadow: z.object({
    maxOpacity: z.number().min(0).max(1),
    featherPxAt4K: z.number().min(0).max(400),
    underbodyAO: z.number().min(0).max(1),
  }),
  reflection: ReflectionSchema,
})

const QualityThresholdsSchema = z.object({
  floorConfidenceMin: z.number().min(0).max(1),
  meanTireFloorErrorCmMax: positive,
  p95TireFloorErrorCmMax: positive,
  verticalJitterRmsCmMax: positive,
  horizonDriftPxPerFrameMax: nonNegative,
  reflectionVariancePctMax: z.number().min(0).max(100),
})

const RuntimeRulesSchema = z.object({
  lockHorizon: z.boolean(),
  enforceWheelOnFloor: z.boolean(),
  allowDynamicAnchorAdjustment: z.boolean(),
  maxAnchorDeltaPxPerFrame: nonNegative,
  autoVerticalCorrection: z.object({
    enabled: z.boolean(),
    deadZonePx: nonNegative,
    gain: z.number().min(0).max(2),
    maxCorrectionPxPerFrame: nonNegative,
  }),
})

const CanvasSchema = z.object({
  width: z.number().int().min(1),
  height: z.number().int().min(1),
  normalized: z.literal(true),
  aspectRatio: z
    .string()
    .regex(/^\d+:\d+$/, "Expected aspectRatio format like 16:9"),
})

export const OverlayConfigSchema = z
  .object({
    schemaVersion: z.string().min(1),
    version: z.string().min(1),
    activeProfile: z.string().min(1),
    canvas: CanvasSchema,
    global: z.object({
      horizonY: unit,
      safeBox: SafeBoxSchema,
      wheelAnchors: z.array(AnchorSchema).length(4),
      shadowEllipse: ShadowEllipseSchema,
      reflection: ReflectionSchema,
      tireMerge: TireMergeSchema,
    }),
    profiles: z
      .record(ProfileSchema)
      .refine((v) => Object.keys(v).length > 0, {
        message: "profiles must contain at least one profile",
      }),
    qualityThresholds: QualityThresholdsSchema,
    runtimeRules: RuntimeRulesSchema,
  })
  .superRefine((cfg, ctx) => {
    // activeProfile must exist
    if (!cfg.profiles[cfg.activeProfile]) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["activeProfile"],
        message: `activeProfile "${cfg.activeProfile}" does not exist in profiles`,
      })
    }

    // wheel anchors unique IDs and all FL/FR/RL/RR present
    const ids = cfg.global.wheelAnchors.map((a) => a.id)
    const required: Array<z.infer<typeof WheelIdSchema>> = [
      "FL",
      "FR",
      "RL",
      "RR",
    ]
    for (const id of required) {
      if (!ids.includes(id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["global", "wheelAnchors"],
          message: `wheelAnchors must include ${id}`,
        })
      }
    }
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["global", "wheelAnchors"],
        message: "wheelAnchors ids must be unique",
      })
    }

    // tire merge spots must align 1:1 with wheel IDs
    const spotIds = cfg.global.tireMerge.spots.map((s) => s.id)
    for (const id of required) {
      if (!spotIds.includes(id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["global", "tireMerge", "spots"],
          message: `tireMerge.spots must include ${id}`,
        })
      }
    }
    if (new Set(spotIds).size !== spotIds.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["global", "tireMerge", "spots"],
        message: "tireMerge spot ids must be unique",
      })
    }

    // practical threshold consistency
    if (
      cfg.qualityThresholds.p95TireFloorErrorCmMax <
      cfg.qualityThresholds.meanTireFloorErrorCmMax
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["qualityThresholds", "p95TireFloorErrorCmMax"],
        message: "p95 threshold should be >= mean threshold",
      })
    }
  })

/** Validated overlay config type — inferred from the Zod schema. */
export type ValidatedOverlayConfig = z.infer<typeof OverlayConfigSchema>
