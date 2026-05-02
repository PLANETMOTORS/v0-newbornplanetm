import type { PageType } from './types'

export function getPageType(pathname: string): PageType {
  if (pathname === '/') return 'homepage'
  if (/^\/vehicles\/[^/]+\/?$/.test(pathname)) return 'vdp'
  if (pathname.startsWith('/inventory')) return 'srp'
  if (pathname.startsWith('/financing')) return 'finance'
  if (pathname.startsWith('/trade-in')) return 'trade_in'
  if (pathname.startsWith('/service')) return 'service'
  if (pathname.startsWith('/contact')) return 'contact'
  if (pathname.startsWith('/about')) return 'about'
  if (pathname.startsWith('/blog') || pathname.startsWith('/resources')) return 'blog'
  if (pathname.startsWith('/privacy') || pathname.startsWith('/terms')) return 'legal'
  return 'other'
}
