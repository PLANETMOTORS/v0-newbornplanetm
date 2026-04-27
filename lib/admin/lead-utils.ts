import { Bot, Car, CalendarCheck, Clock, DollarSign, MessageSquare } from "lucide-react"

export function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (seconds < 60) return "just now"
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export function sourceIcon(source: string) {
  switch (source) {
    case "contact_form": return MessageSquare
    case "chat": return Bot
    case "finance_app": return DollarSign
    case "reservation": return CalendarCheck
    case "trade_in": return Car
    case "test_drive": return Clock
    default: return MessageSquare
  }
}

export type StatusBadgeVariant = "default" | "secondary" | "outline" | "destructive"

export function leadStatusVariant(status: string): StatusBadgeVariant {
  switch (status) {
    case "new": return "default"
    case "contacted": return "secondary"
    case "qualified": return "outline"
    case "converted": return "default"
    case "lost": return "destructive"
    default: return "secondary"
  }
}
