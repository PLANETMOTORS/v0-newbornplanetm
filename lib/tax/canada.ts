/**
 * Canadian provincial and territorial tax rates.
 *
 * Single source of truth — imported by:
 *   - app/api/v1/orders/route.ts
 *   - app/api/v1/financing/calculator/route.ts
 *
 * Rates accurate as of 2025.  Update all three fields when a rate changes;
 * `total` should always equal gst + pst + hst.
 */

export interface ProvinceTaxRate {
  gst: number
  pst: number
  hst: number
  /** Pre-computed sum: gst + pst + hst */
  total: number
}

export const PROVINCE_TAX_RATES: Record<string, ProvinceTaxRate> = {
  ON: { gst: 0,    pst: 0,       hst: 0.13, total: 0.13    },
  BC: { gst: 0.05, pst: 0.07,    hst: 0,    total: 0.12    },
  AB: { gst: 0.05, pst: 0,       hst: 0,    total: 0.05    },
  QC: { gst: 0.05, pst: 0.09975, hst: 0,    total: 0.14975 },
  NS: { gst: 0,    pst: 0,       hst: 0.15, total: 0.15    },
  NB: { gst: 0,    pst: 0,       hst: 0.15, total: 0.15    },
  PE: { gst: 0,    pst: 0,       hst: 0.15, total: 0.15    },
  MB: { gst: 0.05, pst: 0.07,    hst: 0,    total: 0.12    },
  SK: { gst: 0.05, pst: 0.06,    hst: 0,    total: 0.11    },
  NL: { gst: 0,    pst: 0,       hst: 0.15, total: 0.15    },
  NT: { gst: 0.05, pst: 0,       hst: 0,    total: 0.05    },
  YT: { gst: 0.05, pst: 0,       hst: 0,    total: 0.05    },
  NU: { gst: 0.05, pst: 0,       hst: 0,    total: 0.05    },
}
