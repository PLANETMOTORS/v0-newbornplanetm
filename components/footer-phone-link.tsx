"use client"

import { Phone } from "lucide-react"
import { trackPhoneClick } from "@/components/analytics/google-tag-manager"

interface FooterPhoneLinkProps {
  phone: string
}

export function FooterPhoneLink({ phone }: FooterPhoneLinkProps) {
  return (
    <a
      href={`tel:${phone.replaceAll(/[^0-9]/g, '')}`}
      className="flex items-center gap-2.5 min-h-[44px] text-sm text-white/80 hover:text-white transition-colors"
      onClick={() => trackPhoneClick(phone)}
    >
      <Phone className="w-4 h-4 shrink-0" />
      <span>{phone}</span>
    </a>
  )
}
