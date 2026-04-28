/**
 * Brand-mark SVG icons (Google, Facebook, X / Twitter, LinkedIn).
 *
 * Lucide deprecated `Chrome`, `Chromium`, `Facebook`, `Twitter`, and `Linkedin`
 * because they no longer ship the official brand glyphs. These local
 * components replace those imports without changing render-output meaningfully:
 *  - `GoogleIcon`     — replacement for the previous `Chrome` button glyph.
 *  - `FacebookIcon`   — replacement for `Facebook`.
 *  - `XIcon`          — replacement for `Twitter` (current X branding).
 *  - `LinkedInIcon`   — replacement for `Linkedin`.
 *
 * Each accepts the same `className` / size / a11y props as a Lucide icon and
 * defaults to `currentColor` so existing button styling continues to apply.
 */
import * as React from "react"

type IconProps = React.SVGProps<SVGSVGElement> & {
  size?: number | string
  title?: string
}

function withDefaults({ size = 24, ...rest }: IconProps): React.SVGProps<SVGSVGElement> {
  return {
    width: size,
    height: size,
    fill: "currentColor",
    "aria-hidden": "true",
    focusable: "false",
    ...rest,
  } as React.SVGProps<SVGSVGElement>
}

export function GoogleIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 48 48" {...withDefaults(props)}>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35 26.7 36 24 36c-5.2 0-9.7-3.4-11.3-8l-6.6 5.1C9.6 39.6 16.3 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.6l6.2 5.2C41 35.5 44 30.2 44 24c0-1.3-.1-2.4-.4-3.5z"/>
    </svg>
  )
}

export function FacebookIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...withDefaults(props)}>
      <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.99 3.66 9.13 8.44 9.88v-6.99H7.9V12h2.54V9.8c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99C18.34 21.13 22 16.99 22 12z"/>
    </svg>
  )
}

export function XIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...withDefaults(props)}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  )
}

export function LinkedInIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...withDefaults(props)}>
      <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"/>
    </svg>
  )
}
