"use client"

import { useRouter } from "next/navigation"
import { ProtectionComparisonTable } from "@/components/protection-comparison-table"

export function ComparisonTableWrapper() {
  const router = useRouter()

  function handleSelectPackage(packageId: string) {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("selectedProtectionPackage", packageId)
    }
    router.push("/inventory")
  }

  return <ProtectionComparisonTable onSelectPackage={handleSelectPackage} />
}
