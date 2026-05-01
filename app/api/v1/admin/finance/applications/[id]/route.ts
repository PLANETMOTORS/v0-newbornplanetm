/** DELETE /api/v1/admin/finance/applications/[id] — admin removes a finance app. */

import { createCrmDeleteHandler } from "@/lib/admin/crm-delete/route-helpers"

export const DELETE = createCrmDeleteHandler("finance_applications_v2")
