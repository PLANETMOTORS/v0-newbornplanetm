/** DELETE /api/v1/admin/leads/[id] — admin removes a single lead row. */

import { createCrmDeleteHandler } from "@/lib/admin/crm-delete/route-helpers"

export const DELETE = createCrmDeleteHandler("leads")
