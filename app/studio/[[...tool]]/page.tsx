'use client'

import { NextStudio } from 'next-sanity/studio'
import config from '@/sanity.config'

// Simple, clean Sanity Studio page
// Memory optimization handled by next.config.mjs transpilePackages
export default function StudioPage() {
  return <NextStudio config={config} />
}
