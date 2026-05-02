/**
 * Sanity Portable Text → HTML string for dangerouslySetInnerHTML.
 *
 * Pure function module — no I/O, no React, no globals. The blog post page
 * imports `portableTextToHtml` and feeds it the raw `body` blocks returned
 * by `getBlogPost()`. Anything that lives outside this contract belongs in
 * the renderer or the fetcher, not here.
 *
 * Cognitive complexity is intentionally kept under Sonar's S3776 limit by
 * extracting the per-child, per-block, list-state, and style decisions into
 * single-responsibility helpers.
 */

export type ListKind = "bullet" | "number"

export interface PortableTextChild {
  readonly text?: string
  readonly marks?: readonly string[]
}

export interface PortableTextBlock {
  readonly _type: string
  readonly style?: string
  readonly listItem?: ListKind | string
  readonly children?: readonly PortableTextChild[]
}

function escapeHtml(raw: string): string {
  return raw
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
}

function renderChild(child: PortableTextChild): string {
  const escaped = escapeHtml(child.text ?? "")
  const marks = child.marks ?? []
  let out = escaped
  if (marks.includes("strong")) out = `<strong>${out}</strong>`
  if (marks.includes("em")) out = `<em>${out}</em>`
  return out
}

function blockText(block: PortableTextBlock): string {
  return (block.children ?? []).map(renderChild).join("")
}

function wrapByStyle(style: string | undefined, text: string): string {
  switch (style) {
    case "h1":
    case "h2":
    case "h3":
    case "h4":
      return `<${style}>${text}</${style}>`
    case "blockquote":
      return `<blockquote>${text}</blockquote>`
    default:
      return text ? `<p>${text}</p>` : ""
  }
}

function listTags(kind: ListKind): { open: string; close: string } {
  return kind === "number"
    ? { open: "<ol>", close: "</ol>" }
    : { open: "<ul>", close: "</ul>" }
}

function asListKind(value: unknown): ListKind | null {
  return value === "bullet" || value === "number" ? value : null
}

/**
 * Convert an array of Sanity Portable Text blocks into a single HTML string
 * suitable for `dangerouslySetInnerHTML`.
 *
 * Returns `""` for null/undefined/empty input. Unknown block types are
 * skipped silently. Unknown styles fall back to `<p>`.
 */
export function portableTextToHtml(
  blocks: ReadonlyArray<Record<string, unknown>> | null | undefined,
): string {
  if (!Array.isArray(blocks) || blocks.length === 0) return ""

  const lines: string[] = []
  let inList: ListKind | null = null

  const closeListIfOpen = () => {
    if (inList) {
      lines.push(listTags(inList).close)
      inList = null
    }
  }

  for (const raw of blocks) {
    const block = raw as unknown as PortableTextBlock
    if (block._type !== "block") continue

    const text = blockText(block)
    const listItem = asListKind(block.listItem)

    if (inList && listItem !== inList) closeListIfOpen()

    if (listItem) {
      if (!inList) {
        lines.push(listTags(listItem).open)
        inList = listItem
      }
      lines.push(`<li>${text}</li>`)
      continue
    }

    const wrapped = wrapByStyle(block.style, text)
    if (wrapped) lines.push(wrapped)
  }

  closeListIfOpen()
  return lines.join("\n")
}
