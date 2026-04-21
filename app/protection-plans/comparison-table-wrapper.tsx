"use client"

import { useRouter } from "next/navigation"
import { ProtectionComparisonTable } from "@/components/protection-comparison-table"

export function ComparisonTableWrapper() {
  const router = useRouter()

  function handleSelectPackage(packageId: string) {
    void packageId
    router.push("/inventory")
  }

  return <ProtectionComparisonTable onSelectPackage={handleSelectPackage} />
}
