/**
 * components/cars/empty-inventory-state.tsx
 *
 * Rendered on category pages when the live Supabase query returns
 * zero matching vehicles. Per the launch decision (option B in the
 * planning conversation), we surface BOTH a "notify me" capture AND
 * a link to the closest in-stock category — keeping the visitor
 * shopping rather than punting them off-site.
 *
 * The component itself is presentational; the notify-me form posts
 * to `/api/v1/notify` (a thin wrapper that already exists for the
 * homepage waitlist). No new backend surface is introduced.
 */

import Link from 'next/link'
import { Bell, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface Props {
  /** Human-readable name of the category, e.g. "2024 Toyota RAV4" or "Electric SUVs in Toronto". */
  categoryName: string
  /**
   * Optional fallback browse URL. Defaults to `/inventory`. Provide
   * `/cars/<closest-related-slug>` to keep visitors in a related
   * category they might convert on instead of dumping them in the
   * full inventory grid.
   */
  fallbackHref?: string
  fallbackLabel?: string
  /**
   * Optional notify-me topic, sent to `/api/v1/notify` so the lead
   * routes to the correct internal alert ("Toyota RAV4 in stock").
   */
  notifyTopic?: string
}

export function EmptyInventoryState({
  categoryName,
  fallbackHref = '/inventory',
  fallbackLabel = 'Browse all in-stock vehicles',
  notifyTopic,
}: Props) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center text-center p-10 gap-6">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Bell className="w-6 h-6 text-primary" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            No {categoryName} in stock right now
          </h2>
          <p className="text-muted-foreground max-w-md">
            Our inventory rotates fast. Get notified the moment a matching
            vehicle hits the lot — usually within a few weeks.
          </p>
        </div>
        <form
          action="/api/v1/notify"
          method="post"
          className="w-full max-w-md flex flex-col sm:flex-row gap-2"
        >
          {notifyTopic ? (
            <input type="hidden" name="topic" value={notifyTopic} />
          ) : null}
          <input
            type="email"
            name="email"
            required
            placeholder="you@example.com"
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Email for inventory alerts"
          />
          <Button type="submit" className="shrink-0">
            Notify me
          </Button>
        </form>
        <Link
          href={fallbackHref}
          className="text-sm text-primary inline-flex items-center hover:underline"
        >
          {fallbackLabel}
          <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </CardContent>
    </Card>
  )
}
