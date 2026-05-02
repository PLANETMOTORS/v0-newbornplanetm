'use client'

import { NextStudio } from 'next-sanity/studio'
import config from '@/sanity.config'
import { Suspense } from 'react'

function Studio() {
  return <NextStudio config={config} />
}

export default function StudioPage() {
  return (
    <Suspense fallback={<div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p>Loading Studio...</p></div>}>
      <Studio />
    </Suspense>
  )
}
