'use client'

import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'
import { Button, type buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { VariantProps } from 'class-variance-authority'

interface SubmitButtonProps
  extends Omit<React.ComponentProps<'button'>, 'type'>,
    VariantProps<typeof buttonVariants> {
  /** Text shown while the form action is pending */
  pendingText?: string
  /** Icon shown alongside pendingText (defaults to Loader2 spinner) */
  pendingIcon?: React.ReactNode
}

/**
 * Drop-in submit button that reads pending state from the nearest `<form>`.
 *
 * Uses React 19's `useFormStatus` — no props needed for loading state.
 * Tailwind v4 `aria-busy:` variant handles visual feedback via CSS,
 * so the spinner appears instantly without a JS re-render.
 *
 * @example
 * <form action={myServerAction}>
 *   <SubmitButton>Save</SubmitButton>
 * </form>
 */
export function SubmitButton({
  children,
  className,
  pendingText,
  pendingIcon,
  disabled,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      disabled={pending || disabled}
      aria-busy={pending}
      className={cn(
        // Tailwind v4: aria-busy variant for instant CSS-level feedback
        'aria-busy:opacity-80 aria-busy:cursor-wait',
        className,
      )}
      {...props}
    >
      {/* Spinner: hidden by default, shown via aria-busy */}
      <Loader2
        className={cn(
          'h-4 w-4 animate-spin transition-[width,opacity]',
          pending ? 'opacity-100 w-4' : 'opacity-0 w-0',
        )}
        aria-hidden="true"
      />
      {pending ? (pendingText ?? children) : children}
    </Button>
  )
}
