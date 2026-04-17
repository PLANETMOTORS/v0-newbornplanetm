import type { Metadata } from 'next'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Test Results — Internal',
}

export default function TestResultsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
