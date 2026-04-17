import type { Metadata } from 'next'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: '360° Viewer Demo — Internal',
}

export default function ViewerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
