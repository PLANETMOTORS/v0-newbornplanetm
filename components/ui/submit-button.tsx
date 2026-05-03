'use client'

import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'
import { Button, type buttonVariants } from '@/components/ui/button'
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
 * Works with both `<form action={serverAction}>` and `useActionState`.
 *
 * @example
 * <form action={myServerAction}>
 *   <SubmitButton>Save</SubmitButton>
 * </form>
 */
export function SubmitButton({
  children,
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
      {...props}
    >
      {pending ? (
        <>
          {pendingIcon ?? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {pendingText ?? children}
        </>
      ) : (
        children
      )}
    </Button>
  )
}
