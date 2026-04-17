import type { Metadata } from 'next'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Mockup — Internal',
}

export default function MockupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
