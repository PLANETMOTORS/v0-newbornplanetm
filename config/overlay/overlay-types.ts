export type WheelId = "FL" | "FR" | "RL" | "RR"
export type Anchor = { id: WheelId; x: number; y: number }

export type OverlayProfile = {
  id: string
  label: string
  colors: {
    wallTop: string
    wallMid: string
    floorNear: string
    floorFar: string
  }
  shadow: { maxOpacity: number; featherPxAt4K: number; underbodyAO: number }
  reflection: { maxOpacity: number; fadeDistanceVehicleHeight: number }
}

export type OverlayConfig = {
  schemaVersion: string
  version: string
  activeProfile: string
  canvas: {
    width: number
    height: number
    normalized: boolean
    aspectRatio: string
  }
  global: {
    horizonY: number
    safeBox: { x: number; y: number; w: number; h: number }
    wheelAnchors: Anchor[]
    shadowEllipse: { cx: number; cy: number; rx: number; ry: number }
    reflection: { maxOpacity: number; fadeDistanceVehicleHeight: number }
    tireMerge: {
      enabled: boolean
      contactTolerancePx: number
      verticalSnapPxMax: number
      anchorSmoothingAlpha: number
      spots: Array<{
        id: WheelId
        x: number
        y: number
        radiusPxAt1200w: number
      }>
    }
  }
  profiles: Record<string, OverlayProfile>
  qualityThresholds: {
    floorConfidenceMin: number
    meanTireFloorErrorCmMax: number
    p95TireFloorErrorCmMax: number
    verticalJitterRmsCmMax: number
    horizonDriftPxPerFrameMax: number
    reflectionVariancePctMax: number
  }
  runtimeRules: {
    lockHorizon: boolean
    enforceWheelOnFloor: boolean
    allowDynamicAnchorAdjustment: boolean
    maxAnchorDeltaPxPerFrame: number
    autoVerticalCorrection: {
      enabled: boolean
      deadZonePx: number
      gain: number
      maxCorrectionPxPerFrame: number
    }
  }
}
