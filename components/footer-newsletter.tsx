"use client"

export function FooterNewsletter() {
  return (
    <div>
      <p className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-2.5">Get deals in your inbox</p>
      <form className="flex max-w-xs" onSubmit={(e) => e.preventDefault()}>
        <input
          type="email"
          placeholder="your@email.com"
          className="flex-1 px-3.5 py-2.5 bg-white/5 border border-white/10 border-r-0 rounded-l-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#1e3a8a] transition-colors"
        />
        <button
          type="submit"
          className="px-4 py-2.5 bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-sm font-semibold rounded-r-lg transition-colors"
        >
          Subscribe
        </button>
      </form>
    </div>
  )
}
