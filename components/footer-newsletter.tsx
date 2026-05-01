"use client"

import { useState, useCallback } from "react"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"

type SubmitState = "idle" | "loading" | "success" | "error"

export function FooterNewsletter() {
  const [email, setEmail] = useState("")
  const [state, setState] = useState<SubmitState>("idle")
  const [errorMsg, setErrorMsg] = useState("")

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const trimmed = email.trim()
      if (!trimmed) return

      setState("loading")
      setErrorMsg("")

      try {
        const res = await fetch("/api/v1/newsletter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: trimmed }),
        })

        const data = await res.json()

        if (!res.ok) {
          setState("error")
          setErrorMsg(data.error ?? "Something went wrong")
          return
        }

        setState("success")
        setEmail("")
      } catch {
        setState("error")
        setErrorMsg("Network error. Please try again.")
      }
    },
    [email],
  )

  if (state === "success") {
    return (
      <div>
        <p className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-2.5">
          Get deals in your inbox
        </p>
        <div className="flex items-center gap-2 text-green-400 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>You&apos;re subscribed!</span>
        </div>
      </div>
    )
  }

  return (
    <div>
      <p className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-2.5">
        Get deals in your inbox
      </p>
      <form className="flex max-w-xs" onSubmit={handleSubmit}>
        <input
          type="email"
          required
          placeholder="your@email.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (state === "error") setState("idle")
          }}
          disabled={state === "loading"}
          className="flex-1 px-3.5 py-2.5 bg-white/5 border border-white/10 border-r-0 rounded-l-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#1e3a8a] transition-colors disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className="px-4 py-2.5 bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-sm font-semibold rounded-r-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
        >
          {state === "loading" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Subscribe"
          )}
        </button>
      </form>
      {state === "error" && (
        <div className="flex items-center gap-1.5 mt-2 text-red-400 text-xs">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  )
}
