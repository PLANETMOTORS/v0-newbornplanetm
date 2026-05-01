/** DELETE /api/v1/admin/trade-ins/[id] — admin removes a trade-in quote. */

import { createCrmDeleteHandler } from "@/lib/admin/crm-delete/route-helpers"

export const DELETE = createCrmDeleteHandler("trade_in_quotes")
