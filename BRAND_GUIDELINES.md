# Planet Motors — Brand Guidelines

The colour palette, semantic roles and accessibility rules below are
authoritative for **all** Planet Motors surfaces: web, email, PDF
receipts, AI agent UIs and partner integrations.

A SonarCloud / qodo "approved palette" rule is wired against this list,
so introducing a new background colour outside the table here will
trigger a code-smell on review. Add the colour here first, then ship.

---

## 1. Source of truth

| Layer | File | Notes |
| --- | --- | --- |
| TypeScript | `lib/brand/colors.ts` | `BRAND` object + `BRAND_ROLE` aliases + `BRAND_BG_CLASS` / `BRAND_TEXT_CLASS` / `BRAND_RING_CLASS` maps |
| CSS / Tailwind v4 | `app/globals.css` `@theme` block | `--color-brand-*` tokens; generates `bg-brand-*`, `text-brand-*`, `ring-brand-*`, `border-brand-*` |
| Email templates | `lib/email/lead-notifier.ts` (and any future `lib/email/*`) | imports from `lib/brand/colors.ts`; never hard-codes hex |

If you change a colour in one layer, change all three. The sole excuse
to deviate from the palette is a **third-party brand** lock-up (e.g.
Tesla red on a partner page) — and even then it must live in the
component file with an explicit comment.

---

## 2. The five brand roles

Each role owns **one** semantic meaning. If two badges fight over the
same colour, the role table below wins — relabel the weaker badge.

| Role | Token | Hex | Meaning | Where it shows up |
| --- | --- | --- | --- | --- |
| **Primary / trust** | `brand.navy` | `#1e3a8a` | Brand identity, default badge, headers | Page header, default vehicle badge, "Certified" pill, primary buttons |
| **Urgency** | `brand.red` | `#dc2626` | Hot lead, popular item, time-bound deal | "Popular" badge, sale banner, hot-lead toast, alert pills |
| **EV / freshness** | `brand.green` | `#16a34a` | Electric vehicle, availability, success | "EV" badge, "New Arrival", "In Stock", success toast, range chart |
| **Shopping / commerce** | `brand.orange` | `#ea580c` | Buy / reserve / lease intent | "Buy Now", "Reserve", "Add to deal sheet", lease-deal CTA, cart |
| **Premium / luxury** | `brand.purple` | `#7e22ce` | Premium tier, luxury badge, VIP | "Premium" badge, "Luxury", VIP membership, certified-pre-owned overlay |

### Rung extensions

Each base role exposes two extra rungs for state and surface variation:

| Suffix | Use | Example |
| --- | --- | --- |
| `-hover` | `hover:` state on buttons / pills | `hover:bg-brand-red-hover` |
| `-dark` | Deeper surface (only `navy` exposes this) | Email header, dark hero overlay |
| `-light` | Soft tint (only `green` + `gold` expose this) | Success toast background, hero accent strip |

---

## 3. Choosing a colour — decision tree

```
Is this surface communicating a concept?
├─ "It's electric / new / available / safe"        → brand.green
├─ "Buy it / reserve it / lease it / cart"         → brand.orange
├─ "Premium / VIP / luxury / certified pre-owned"  → brand.purple
├─ "Limited time / hot / popular / urgent"         → brand.red
└─ "None of the above (default / trust / chrome)"  → brand.navy
```

If the answer is "I just want a nice-looking accent that doesn't carry
meaning", reach for the supporting palette (`brand.slate`,
`brand.slate-light`, `brand.border`) — never invent a new hex.

---

## 4. Accessibility floor

Every brand colour passes **WCAG 2.2 AA** with white text:

| Token | Contrast on `#ffffff` text | Notes |
| --- | --- | --- |
| `brand.navy` `#1e3a8a` | 9.61 : 1 | AAA |
| `brand.red` `#dc2626` | 4.83 : 1 | AA |
| `brand.green` `#16a34a` | 4.59 : 1 | AA — keep text bold ≥ 13 px |
| `brand.orange` `#ea580c` | 4.64 : 1 | AA — keep text bold ≥ 13 px |
| `brand.purple` `#7e22ce` | 7.34 : 1 | AAA |

Rules:

1. Primary copy on a brand-tinted surface uses `text-white`. Don't
   reach for `text-gray-100` or `text-slate-50` — they fail AA on
   `brand.green` and `brand.orange`.
2. Body copy on white surfaces uses `text-brand-navy` (≥ 9 : 1) or
   `text-slate-700` for muted variants.
3. Focus rings use `ring-brand-*` — never default Tailwind `ring-blue-500`.

---

## 5. Examples

### Tailwind / React

```tsx
// Vehicle badge — picks colour from the role map, not from a string
<span className={`${BRAND_BG_CLASS.ev} text-white px-3 py-1 rounded-full`}>
  EV
</span>

// Reserve CTA
<button className="bg-brand-orange hover:bg-brand-orange-hover text-white">
  Reserve this vehicle
</button>

// Premium overlay
<div className="bg-brand-purple/10 ring-1 ring-brand-purple text-brand-purple">
  Premium pre-owned
</div>
```

### Email (HTML)

```ts
import { BRAND } from "@/lib/brand/colors"

const html = `
  <td style="background:${BRAND.navyDark};">
    <a style="background:${BRAND.gold};color:${BRAND.navyDark};">
      View VDP →
    </a>
  </td>
`
```

---

## 6. Adding a new colour

1. Open a PR against `lib/brand/colors.ts` proposing the new token,
   semantic role, hex, and contrast number on white.
2. Mirror the token in `app/globals.css` `@theme`.
3. Append a row to the table in §2 above.
4. Update any code that previously reached for an inline hex.
5. Tag a maintainer for sign-off — this is intentionally heavy
   ceremony so the palette stays small.

If a colour does **not** earn a row in §2, it belongs in the supporting
slate / blue tints, not as a new role.
