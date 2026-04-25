import type { Metadata } from 'next'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Mockup — Internal',
}

export default function MockupLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>
}
