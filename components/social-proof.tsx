"use client"

import { useEffect } from "react"
import useSWR from "swr"
import { Eye, TrendingUp, Users } from "lucide-react"

interface SocialProofData {
  recentFinanceInquiries: number
  totalFinanceInquiries: number
  hasRecentReservation: boolean
  views24h: number
  viewsTracked: boolean
  lastInquiryAt: string | null
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 1) return "just now"
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return "yesterday"
  return `${days}d ago`
}

interface SocialProofProps {
  vehicleId: string
  className?: string
}

const postedIds = new Set<string>()

export function SocialProof({ vehicleId, className = "" }: SocialProofProps) {
  const { data } = useSWR<SocialProofData>(
    `/api/v1/vehicles/${vehicleId}/social-proof`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60_000,
    }
  )

  useEffect(() => {
    if (postedIds.has(vehicleId)) return
    postedIds.add(vehicleId)
    fetch(`/api/v1/vehicles/${vehicleId}/social-proof`, {
      method: "POST",
      keepalive: true,
    }).catch(() => {})
  }, [vehicleId])

  // Don't render anything until data arrives — prevents CLS
  if (!data) return null

  const signals: { icon: typeof Eye; text: string; emphasis?: boolean }[] = []

  // "X people viewed this in the last 24 hours"
  if (data.viewsTracked && data.views24h > 0) {
    signals.push({
      icon: Eye,
      text: `${data.views24h} ${data.views24h === 1 ? "person" : "people"} viewed this in the last 24 hours`,
    })
  }

  // "X people requested financing this week"
  if (data.recentFinanceInquiries > 0) {
    signals.push({
      icon: Users,
      text: `${data.recentFinanceInquiries} ${data.recentFinanceInquiries === 1 ? "person" : "people"} requested financing this week`,
      emphasis: true,
    })
  } else if (data.totalFinanceInquiries > 0 && data.lastInquiryAt) {
    // Fallback: show last inquiry time
    signals.push({
      icon: TrendingUp,
      text: `Someone requested financing ${timeAgo(data.lastInquiryAt)}`,
    })
  }

  // "This vehicle was recently reserved"
  if (data.hasRecentReservation) {
    signals.push({
      icon: TrendingUp,
      text: "This vehicle was recently reserved — high demand",
      emphasis: true,
    })
  }

  if (signals.length === 0) return null

  return (
    <div className={`space-y-1.5 ${className}`}>
      {signals.map((signal, i) => {
        const Icon = signal.icon
        return (
          <div
            key={i}
            className={`flex items-center gap-2 text-xs ${
              signal.emphasis
                ? "text-amber-600 dark:text-amber-400 font-medium"
                : "text-muted-foreground"
            }`}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            <span>{signal.text}</span>
          </div>
        )
      })}
    </div>
  )
}
