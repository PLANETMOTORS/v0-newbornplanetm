import type { Metadata } from 'next'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Production Readiness — Internal',
}

export default function ProductionReadinessLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>
}
