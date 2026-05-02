/** DELETE /api/v1/admin/reservations/[id] — admin removes a reservation. */

import { createCrmDeleteHandler } from "@/lib/admin/crm-delete/route-helpers"

export const DELETE = createCrmDeleteHandler("reservations")
