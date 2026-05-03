'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import {
  subscribeNewsletter,
  initialState,
  type NewsletterFormState,
} from '@/app/actions/newsletter'

// ── Inline submit button (footer-specific styling) ──────────────────────

function NewsletterSubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="px-4 py-2.5 bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-sm font-semibold rounded-r-lg transition-colors disabled:opacity-50 aria-busy:cursor-wait flex items-center gap-1.5"
    >
      {pending ? (
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
      ) : (
        'Subscribe'
      )}
    </button>
  )
}

// ── Main component ──────────────────────────────────────────────────────

export function FooterNewsletter() {
  const [state, formAction] = useActionState<NewsletterFormState, FormData>(
    subscribeNewsletter,
    initialState,
  )

  if (state.status === 'success') {
    return (
      <div>
        <p className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-2.5">
          Get deals in your inbox
        </p>
        <div className="flex items-center gap-2 text-green-400 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{state.message}</span>
        </div>
      </div>
    )
  }

  return (
    <div>
      <p className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-2.5">
        Get deals in your inbox
      </p>
      <form className="flex max-w-xs" action={formAction}>
        <input
          type="email"
          name="email"
          required
          placeholder="your@email.com"
          className="flex-1 px-3.5 py-2.5 bg-white/5 border border-white/10 border-r-0 rounded-l-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#1e3a8a] transition-colors disabled:opacity-50"
        />
        <NewsletterSubmitButton />
      </form>
      {state.status === 'error' && (
        <div className="flex items-center gap-1.5 mt-2 text-red-400 text-xs" role="alert">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{state.message}</span>
        </div>
      )}
    </div>
  )
}
