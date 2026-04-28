/**
 * Brand icons.
 *
 * lucide-react has deprecated all of its brand icons (Facebook, Twitter,
 * LinkedIn, Chrome, etc.) per
 * https://github.com/lucide-icons/lucide/issues/670 and recommends using
 * Simple Icons instead. To stop tripping S1874 (deprecated API) and to keep
 * the brand glyphs available, we ship a tiny inline-SVG component per brand,
 * sized via the `size` prop and themed via `currentColor`.
 *
 * Path data is from https://simpleicons.org/ (CC0 license — paths are not
 * copyrightable; trademark belongs to the respective brand owners). When
 * adding a new brand, follow the same `size` + `className` contract so the
 * icon drops in wherever a lucide icon used to live.
 */
import * as React from 'react'

import { cn } from '@/lib/utils'

type Props = Readonly<{
  className?: string
  size?: number | string
  'aria-label'?: string
}>

function svgProps(p: Props) {
  return {
    width: p.size ?? 24,
    height: p.size ?? 24,
    viewBox: '0 0 24 24',
    fill: 'currentColor',
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': p['aria-label'] ? undefined : true,
    role: p['aria-label'] ? ('img' as const) : undefined,
    'aria-label': p['aria-label'],
    className: cn('shrink-0', p.className),
  }
}

export function FacebookIcon(props: Props) {
  return (
    <svg {...svgProps(props)}>
      <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
    </svg>
  )
}

export function TwitterIcon(props: Props) {
  // Modern X (formerly Twitter) wordmark.
  return (
    <svg {...svgProps(props)}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

export function LinkedinIcon(props: Props) {
  return (
    <svg {...svgProps(props)}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.063 2.063 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

export function GoogleIcon(props: Props) {
  // Multi-color "G" — uses fixed brand colors and ignores currentColor.
  const dim = props.size ?? 24
  return (
    <svg
      width={dim}
      height={dim}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={props['aria-label'] ? undefined : true}
      role={props['aria-label'] ? 'img' : undefined}
      aria-label={props['aria-label']}
      className={cn('shrink-0', props.className)}
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.24 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.95l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  )
}
