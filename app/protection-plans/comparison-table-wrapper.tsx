"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ProtectionComparisonTable } from "@/components/protection-comparison-table"

export function ComparisonTableWrapper() {
  const router = useRouter()
  const [_selectedProtection, setSelectedProtection] = useState<string>("")

  useEffect(() => {
    if (typeof globalThis.window !== "undefined") {
      const stored = sessionStorage.getItem("selectedProtectionPackage")
      if (stored) {
        setSelectedProtection(stored)
      }
    }
  }, [])

  function handleSelectPackage(packageId: string) {
    if (typeof globalThis.window !== "undefined") {
      sessionStorage.setItem("selectedProtectionPackage", packageId)
    }
    router.push("/inventory")
  }

  return <ProtectionComparisonTable onSelectPackage={handleSelectPackage} />
}