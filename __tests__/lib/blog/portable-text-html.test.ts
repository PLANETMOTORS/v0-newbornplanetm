import { describe, it, expect } from "vitest"
import { portableTextToHtml } from "@/lib/blog/portable-text-html"

const block = (
  style: string,
  text: string,
  marks: string[] = [],
): Record<string, unknown> => ({
  _type: "block",
  style,
  children: [{ text, marks }],
})

const listBlock = (
  listItem: "bullet" | "number",
  text: string,
): Record<string, unknown> => ({
  _type: "block",
  style: "normal",
  listItem,
  children: [{ text }],
})

describe("portableTextToHtml", () => {
  it("returns empty string for null/undefined/empty", () => {
    expect(portableTextToHtml(null)).toBe("")
    expect(portableTextToHtml(undefined)).toBe("")
    expect(portableTextToHtml([])).toBe("")
  })

  it("returns empty string for non-array input", () => {
    // intentionally invalid shape; production code feeds Sanity output here
    expect(portableTextToHtml("oops" as unknown as never)).toBe("")
  })

  it("renders paragraph blocks", () => {
    const html = portableTextToHtml([block("normal", "Hello world")])
    expect(html).toBe("<p>Hello world</p>")
  })

  it("skips empty paragraphs", () => {
    const html = portableTextToHtml([block("normal", "")])
    expect(html).toBe("")
  })

  it("renders headings h1..h4", () => {
    const html = portableTextToHtml([
      block("h1", "One"),
      block("h2", "Two"),
      block("h3", "Three"),
      block("h4", "Four"),
    ])
    expect(html).toBe("<h1>One</h1>\n<h2>Two</h2>\n<h3>Three</h3>\n<h4>Four</h4>")
  })

  it("renders blockquote", () => {
    const html = portableTextToHtml([block("blockquote", "wisdom")])
    expect(html).toBe("<blockquote>wisdom</blockquote>")
  })

  it("falls back to <p> for unknown styles when text exists", () => {
    const html = portableTextToHtml([block("h7-not-a-thing", "still rendered")])
    expect(html).toBe("<p>still rendered</p>")
  })

  it("escapes &, <, > to entities to prevent XSS", () => {
    const html = portableTextToHtml([
      block("normal", "<script>alert('x')</script> & friends"),
    ])
    expect(html).toBe(
      "<p>&lt;script&gt;alert('x')&lt;/script&gt; &amp; friends</p>",
    )
  })

  it("applies <strong> and <em> marks", () => {
    const html = portableTextToHtml([
      {
        _type: "block",
        style: "normal",
        children: [
          { text: "bold", marks: ["strong"] },
          { text: " " },
          { text: "italic", marks: ["em"] },
          { text: " " },
          { text: "both", marks: ["strong", "em"] },
        ],
      },
    ])
    // Implementation applies <strong> first, then wraps result in <em>,
    // so a "both"-marked child renders as <em><strong>both</strong></em>.
    expect(html).toBe(
      "<p><strong>bold</strong> <em>italic</em> <em><strong>both</strong></em></p>",
    )
  })

  it("renders bullet lists with proper open/close", () => {
    const html = portableTextToHtml([
      listBlock("bullet", "alpha"),
      listBlock("bullet", "beta"),
    ])
    expect(html).toBe("<ul>\n<li>alpha</li>\n<li>beta</li>\n</ul>")
  })

  it("renders numbered lists with proper open/close", () => {
    const html = portableTextToHtml([
      listBlock("number", "first"),
      listBlock("number", "second"),
    ])
    expect(html).toBe("<ol>\n<li>first</li>\n<li>second</li>\n</ol>")
  })

  it("closes a list when style switches back to paragraph", () => {
    const html = portableTextToHtml([
      listBlock("bullet", "item"),
      block("normal", "after"),
    ])
    expect(html).toBe("<ul>\n<li>item</li>\n</ul>\n<p>after</p>")
  })

  it("closes one list and opens another when kind changes", () => {
    const html = portableTextToHtml([
      listBlock("bullet", "u"),
      listBlock("number", "o"),
    ])
    expect(html).toBe("<ul>\n<li>u</li>\n</ul>\n<ol>\n<li>o</li>\n</ol>")
  })

  it("closes a trailing list at the end of input", () => {
    const html = portableTextToHtml([listBlock("bullet", "tail")])
    expect(html).toBe("<ul>\n<li>tail</li>\n</ul>")
  })

  it("ignores non-block _types", () => {
    const html = portableTextToHtml([
      { _type: "image", url: "x" } as Record<string, unknown>,
      block("normal", "kept"),
    ])
    expect(html).toBe("<p>kept</p>")
  })

  it("ignores unknown listItem values, treating them as paragraphs", () => {
    const html = portableTextToHtml([
      {
        _type: "block",
        style: "normal",
        listItem: "weird-thing",
        children: [{ text: "x" }],
      },
    ])
    expect(html).toBe("<p>x</p>")
  })

  it("handles a block with no children safely", () => {
    const html = portableTextToHtml([{ _type: "block", style: "normal" }])
    expect(html).toBe("")
  })

  it("escapes HTML inside marks", () => {
    const html = portableTextToHtml([
      {
        _type: "block",
        style: "normal",
        children: [{ text: "<bold>", marks: ["strong"] }],
      },
    ])
    expect(html).toBe("<p><strong>&lt;bold&gt;</strong></p>")
  })

  it("emits combined headings, lists, and paragraphs in order", () => {
    const html = portableTextToHtml([
      block("h2", "Title"),
      block("normal", "Intro paragraph"),
      listBlock("bullet", "one"),
      listBlock("bullet", "two"),
      block("blockquote", "quote here"),
    ])
    expect(html).toBe(
      [
        "<h2>Title</h2>",
        "<p>Intro paragraph</p>",
        "<ul>",
        "<li>one</li>",
        "<li>two</li>",
        "</ul>",
        "<blockquote>quote here</blockquote>",
      ].join("\n"),
    )
  })
})
