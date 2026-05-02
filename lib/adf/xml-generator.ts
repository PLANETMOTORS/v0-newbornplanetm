/**
 * ADF XML generator — pure function, deterministic, fully unit-testable.
 *
 * Output conforms to STAR ADF v1.0. AutoRaptor's parser is the consumer
 * we test against; their docs explicitly accept v1.0 with the documented
 * relaxed-form parsing (missing optionals OK, attribute order doesn't matter).
 *
 * No external dependencies — we hand-roll the XML so we don't pull in
 * a heavy XML library for what is effectively a 50-line template.
 */

import type {
  ADFContact,
  ADFFinanceDetails,
  ADFProspect,
  ADFTradeIn,
  ADFVehicle,
} from "./types"

/**
 * Escape user-supplied text before embedding in XML.
 * Order matters: ampersand first to avoid double-escaping.
 */
export function escapeXml(value: string | number | boolean | undefined | null): string {
  if (value === undefined || value === null) return ""
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
}

function tag(name: string, value: string | number | boolean | undefined | null, attrs?: Record<string, string>): string {
  const escaped = escapeXml(value)
  if (escaped === "") return ""
  const attrStr = attrs
    ? Object.entries(attrs)
        .map(([k, v]) => ` ${k}="${escapeXml(v)}"`)
        .join("")
    : ""
  return `<${name}${attrStr}>${escaped}</${name}>`
}

function buildContact(contact: ADFContact): string {
  const parts: string[] = []
  if (contact.firstName) parts.push(tag("name", contact.firstName, { part: "first" }))
  if (contact.lastName) parts.push(tag("name", contact.lastName, { part: "last" }))
  if (contact.fullName && !contact.firstName && !contact.lastName) {
    parts.push(tag("name", contact.fullName, { part: "full" }))
  }
  if (contact.email) parts.push(tag("email", contact.email))
  if (contact.phone) parts.push(tag("phone", contact.phone))
  return parts.join("")
}

function buildVehicle(vehicle: ADFVehicle): string {
  const attrs: Record<string, string> = { interest: vehicle.interest }
  if (vehicle.status) attrs.status = vehicle.status

  const inner = [
    tag("year", vehicle.year),
    tag("make", vehicle.make),
    tag("model", vehicle.model),
    tag("trim", vehicle.trim),
    tag("vin", vehicle.vin),
    tag("stock", vehicle.stockNumber),
    tag("odometer", vehicle.mileage, { units: "km" }),
    tag("price", vehicle.price, { type: "asking" }),
  ]
    .filter(Boolean)
    .join("")

  const attrStr = Object.entries(attrs)
    .map(([k, v]) => ` ${k}="${escapeXml(v)}"`)
    .join("")
  return `<vehicle${attrStr}>${inner}</vehicle>`
}

function buildTradeIn(trade: ADFTradeIn): string {
  const inner = [
    tag("year", trade.year),
    tag("make", trade.make),
    tag("model", trade.model),
    tag("trim", trade.trim),
    tag("vin", trade.vin),
    tag("odometer", trade.mileage, { units: "km" }),
    tag("condition", trade.condition),
    tag("price", trade.offerAmount, { type: "appraisal" }),
  ]
    .filter(Boolean)
    .join("")
  if (inner === "") return ""
  return `<vehicle interest="trade-in">${inner}</vehicle>`
}

function buildFinance(finance: ADFFinanceDetails): string {
  const parts: string[] = []
  if (finance.monthlyBudget !== undefined) {
    parts.push(tag("amount", finance.monthlyBudget, { type: "monthly" }))
  }
  if (finance.downPayment !== undefined) {
    parts.push(tag("balance", finance.downPayment, { type: "downpayment" }))
  }
  if (parts.length === 0) return ""
  return `<finance>${parts.join("")}</finance>`
}

/**
 * Generate the complete ADF XML envelope for a single lead.
 *
 * The XML is intended to be sent as the *body* of an email to the
 * receiving CRM (AutoRaptor). The CRM's mail-parser treats the email
 * body as ADF when the XML envelope is detected.
 */
export function generateAdfXml(prospect: ADFProspect, dealerName: string): string {
  const customerSection = `<customer><contact>${buildContact(prospect.customer)}</contact></customer>`

  // Comments may include the trade-in details summarised plus any notes the
  // customer included. AutoRaptor surfaces this in the "Notes" field of the lead.
  const commentsTag = prospect.comments
    ? tag("comments", prospect.comments)
    : ""

  const vehicleSection = prospect.vehicle ? buildVehicle(prospect.vehicle) : ""
  const tradeInSection = prospect.tradeIn ? buildTradeIn(prospect.tradeIn) : ""
  const financeSection = prospect.finance ? buildFinance(prospect.finance) : ""

  const vendorSection = `<vendor><contact>${tag(
    "name",
    dealerName,
    { part: "full" },
  )}</contact></vendor>`

  const providerSection = `<provider>${tag("name", "planetmotors.ca", {
    part: "full",
  })}${tag("service", prospect.source)}</provider>`

  return `<?xml version="1.0" encoding="UTF-8"?>
<?adf version="1.0"?>
<adf>
  <prospect>
    ${tag("id", prospect.id, { sequence: "1", source: "planetmotors.ca" })}
    ${tag("requestdate", prospect.requestDate)}
    ${vehicleSection}
    ${tradeInSection}
    ${customerSection}
    ${financeSection}
    ${vendorSection}
    ${providerSection}
    ${commentsTag}
  </prospect>
</adf>`
}
