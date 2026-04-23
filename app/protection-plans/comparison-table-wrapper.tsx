"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ProtectionComparisonTable } from "@/components/protection-comparison-table"

export function ComparisonTableWrapper() {
  const router = useRouter()
  const [selectedProtection, setSelectedProtection] = useState<string>("")

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("selectedProtectionPackage")
      if (stored) {
        setSelectedProtection(stored)
      }
    }
  }, [])

  function handleSelectPackage(packageId: string) {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("selectedProtectionPackage", packageId)
    }
    router.push("/inventory")
  }

  return <ProtectionComparisonTable onSelectPackage={handleSelectPackage} />
}