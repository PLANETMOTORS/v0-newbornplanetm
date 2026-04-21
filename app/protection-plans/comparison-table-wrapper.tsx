"use client"

import { useRouter } from "next/navigation"
import { ProtectionComparisonTable } from "@/components/protection-comparison-table"

export function ComparisonTableWrapper() {
  const router = useRouter()

  function handleSelectPackage(packageId: string) {
    // For now, route to inventory with the selected package stored in sessionStorage
    // When the user picks a vehicle, the checkout page will read this selection
    if (typeof window !== "undefined") {
      sessionStorage.setItem("selectedProtectionPackage", packageId)
    }
    router.push("/inventory")
  }

  return <ProtectionComparisonTable onSelectPackage={handleSelectPackage} />
}
