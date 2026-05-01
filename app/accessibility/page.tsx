import { Metadata } from "next"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Keyboard, Mic, Focus, Smartphone, Ban, MousePointerClick, FileText, CircleSlash } from "lucide-react"

export const metadata: Metadata = {
  title: "Accessibility | Planet Motors – Certified Used EVs & PHEVs",
  description:
    "Planet Motors is built for everyone. Learn how our website meets WCAG 2.2 Level AA accessibility standards — from keyboard navigation to screen reader support.",
  alternates: { canonical: "/accessibility" },
}

const FEATURES = [
  {
    icon: Keyboard,
    title: "Full Keyboard Navigation",
    description:
      "Every feature on our site — from searching inventory to applying for financing — can be completed without a mouse. Arrow keys move through search suggestions, Enter selects, Escape closes, and Tab reaches every interactive element. Our search bar uses the WAI-ARIA combobox pattern so keyboard and screen reader users get the same experience as everyone else.",
    wcag: "WCAG 2.1.1 · 2.1.2",
  },
  {
    icon: Mic,
    title: "Screen Reader Friendly",
    description:
      'Every element is labelled with proper ARIA roles and attributes. Our inventory search announces results as they load — "6 results found" or "No vehicles matching your search" — through a live region that screen readers pick up instantly. Decorative elements are hidden from assistive technology so your screen reader only hears what matters.',
    wcag: "WCAG 4.1.2 · 4.1.3",
  },
  {
    icon: Focus,
    title: "Visible Focus Indicators",
    description:
      "When you navigate with a keyboard, every button, link, and input shows a clear, high-contrast focus ring so you always know where you are on the page. We never hide focus outlines — they're part of the design, not an afterthought.",
    wcag: "WCAG 2.4.7",
  },
  {
    icon: MousePointerClick,
    title: "Generous Touch Targets",
    description:
      "Every button and interactive element meets a minimum 44×44 pixel touch area. Whether you're tapping on a phone screen or using a stylus, you won't struggle to hit the right target. This matters especially for shoppers browsing inventory on mobile — which is most of our visitors.",
    wcag: "WCAG 2.5.8",
  },
  {
    icon: CircleSlash,
    title: "Respects Reduced Motion",
    description:
      "If you've set your device to reduce motion, our site listens. All transitions and animations collapse to zero — no sliding overlays, no spinning loaders, no distractions. You see the same content, just without the movement.",
    wcag: "WCAG 2.3.3",
  },
  {
    icon: Smartphone,
    title: "Mobile-First Accessibility",
    description:
      "Our mobile search opens as a full-screen modal — not a tiny dropdown that the keyboard covers up. Focus is trapped inside the modal so Tab can't escape behind it, body scroll locks to prevent background movement, and a clear close button is always within reach. The same features work identically whether you're on an iPhone, an Android tablet, or a desktop with assistive technology.",
    wcag: "WCAG 2.1.2 · 1.4.13",
  },
  {
    icon: Ban,
    title: "No Hover-Only Content",
    description:
      "Nothing on our site requires a mouse hover to access. Hover effects are purely visual — a subtle shadow, a border glow — and exist only to help sighted mouse users see that an element is interactive. Every feature is triggered by click, tap, or keyboard focus, ensuring full compatibility with touch screens and assistive devices.",
    wcag: "WCAG 1.4.13",
  },
  {
    icon: FileText,
    title: "Meaningful Page Structure",
    description:
      "Pages use proper heading hierarchy, landmark regions, and semantic HTML so assistive technology can build an accurate picture of the content. Vehicle detail pages include JSON-LD structured data for search engines and assistive tools alike. Every image has descriptive alt text — vehicle photos describe the make, model, colour, and angle.",
    wcag: "WCAG 1.3.1 · 2.4.6",
  },
] as const

const STANDARDS = [
  { criterion: "2.1.1", description: "All functionality available from a keyboard" },
  { criterion: "2.1.2", description: "No keyboard traps" },
  { criterion: "1.3.1", description: "Information and relationships conveyed through structure" },
  { criterion: "1.4.3", description: "Minimum contrast ratio of 4.5:1 for text" },
  { criterion: "1.4.13", description: "Content on hover or focus is dismissible, hoverable, persistent" },
  { criterion: "2.3.3", description: "Motion animation can be disabled" },
  { criterion: "2.4.6", description: "Headings and labels describe topic or purpose" },
  { criterion: "2.4.7", description: "Keyboard focus is visible" },
  { criterion: "2.5.8", description: "Touch target minimum 44×44 pixels" },
  { criterion: "4.1.2", description: "Name, role, value for all UI components" },
  { criterion: "4.1.3", description: "Status messages communicated to assistive technology" },
] as const

const POLICY_BLOCKS = [
  {
    title: "Communication",
    body: "We communicate with people with disabilities in ways that work for them. If you need information in a different format — larger text, plain language, or another accommodation — let us know and we'll make it happen.",
  },
  {
    title: "Assistive Devices",
    body: "You're welcome to use your personal assistive devices when visiting our premises or accessing our services. If a specific device presents a safety concern in our facility, we'll work with you to find an alternative that ensures you can still access what you need.",
  },
  {
    title: "Service Animals & Support Persons",
    body: "Service animals and support persons are welcome at all Planet Motors locations. If you're accompanied by a support person, they will never be prevented from being with you on our premises.",
  },
  {
    title: "Staff Training",
    body: "Every team member at Planet Motors receives training on the AODA and its Customer Service Standards, including how to interact respectfully with people who have disabilities, how to work with assistive devices, and what to do if someone needs help accessing our services. This training is provided during onboarding and updated whenever our policies change.",
  },
  {
    title: "Ongoing Improvement",
    body: "Accessibility isn't a checkbox — it's a practice. We continuously review our website and services to identify barriers and remove them. As web standards evolve, we evolve with them. Our current target is WCAG 2.2 Level AA, and we'll adopt newer standards as they become available.",
  },
] as const

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main id="main-content" tabIndex={-1}>
        {/* Hero Header */}
        <header className="bg-[#0f1e3d] px-6 pt-20 pb-16 text-center md:pt-28 md:pb-20">
          <span className="inline-block rounded-full border border-[rgba(201,168,76,0.25)] bg-[rgba(201,168,76,0.12)] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[2.5px] text-[#c9a84c] mb-6">
            WCAG 2.2 Level AA
          </span>
          <h1 className="font-serif text-3xl font-normal leading-tight text-white md:text-5xl">
            Built for <span className="text-[#c9a84c]">Everyone</span>
          </h1>
          <p className="mx-auto mt-4 max-w-[560px] text-[1.05rem] leading-relaxed text-white/65">
            At Planet Motors, accessibility isn&apos;t a policy we wrote after launch. It&apos;s
            built into every component, every page, and every interaction — from day one.
          </p>
        </header>

        <div className="mx-auto max-w-[780px] px-6">
          {/* Commitment Block */}
          <div className="relative z-10 -mt-8 rounded-xl border border-gray-200 bg-white p-8 shadow-sm md:p-10 mb-12">
            <p className="text-[1.05rem] leading-relaxed text-gray-800">
              We believe that buying a car should be straightforward and stress-free for everyone —
              whether you navigate our site with a mouse, a keyboard, a screen reader, or voice
              control. Planet Motors is designed and engineered to meet the Web Content Accessibility
              Guidelines (WCAG) 2.2 at Level AA, exceeding the WCAG 2.0 Level AA standard referenced
              by Ontario&apos;s Accessibility for Ontarians with Disabilities Act (AODA).
            </p>
            <p className="mt-4 text-[1.05rem] leading-relaxed text-gray-800">
              This page explains what we&apos;ve built, the standards we follow, and how to reach us
              if anything on our site isn&apos;t working for you.
            </p>
            <div className="mt-7 border-t border-gray-200 pt-5 text-sm text-gray-500">
              <strong className="block text-[0.95rem] text-[#0f1e3d]">Planet Motors Inc.</strong>
              OMVIC Licensed Dealer #5482807 · 30 Major Mackenzie Dr E, Richmond Hill, ON
            </div>
          </div>

          {/* What We've Built */}
          <section className="mb-14">
            <h2 className="font-serif text-2xl text-[#0f1e3d] mb-2">What We&apos;ve Built</h2>
            <p className="text-[0.95rem] text-gray-500 leading-relaxed mb-7">
              These aren&apos;t planned improvements — they&apos;re features shipping in production
              today. Every item below has been engineered into our codebase.
            </p>

            <div className="grid gap-4">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="rounded-xl border border-gray-200 bg-white p-7 transition-colors hover:border-[#c9a84c]"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[rgba(201,168,76,0.12)]">
                      <f.icon className="h-5 w-5 text-[#c9a84c]" />
                    </div>
                    <h3 className="text-base font-semibold text-[#0f1e3d]">{f.title}</h3>
                  </div>
                  <p className="text-[0.92rem] leading-relaxed text-gray-500">{f.description}</p>
                  <span className="mt-2.5 inline-block rounded-md bg-[rgba(201,168,76,0.12)] px-2.5 py-0.5 text-xs font-semibold tracking-wide text-[#c9a84c]">
                    {f.wcag}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Standards We Meet */}
          <section className="mb-14">
            <h2 className="font-serif text-2xl text-[#0f1e3d] mb-2">Standards We Meet</h2>
            <p className="text-[0.95rem] text-gray-500 leading-relaxed mb-7">
              We target WCAG 2.2 Level AA — a higher standard than the WCAG 2.0 Level AA referenced
              by Ontario&apos;s AODA. Here&apos;s a summary of the specific criteria our site
              addresses.
            </p>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <table className="w-full text-[0.9rem]" role="table">
                <thead className="bg-[#0f1e3d] text-white">
                  <tr>
                    <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">
                      Criterion
                    </th>
                    <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">
                      Description
                    </th>
                    <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {STANDARDS.map((s) => (
                    <tr key={s.criterion} className="border-b border-gray-100 last:border-b-0">
                      <td className="px-5 py-3.5 text-gray-800">{s.criterion}</td>
                      <td className="px-5 py-3.5 text-gray-800 leading-snug">{s.description}</td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700">
                          <span className="inline-block h-2 w-2 rounded-full bg-green-700" aria-hidden="true" />
                          Met
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Our Commitment Under AODA */}
          <section className="mb-14">
            <h2 className="font-serif text-2xl text-[#0f1e3d] mb-2">Our Commitment Under AODA</h2>
            <p className="text-[0.95rem] text-gray-500 leading-relaxed mb-7">
              Planet Motors is committed to complying with the Accessibility for Ontarians with
              Disabilities Act (AODA) and its Customer Service Standards. We treat every customer —
              regardless of ability — with dignity, respect, and equal opportunity.
            </p>

            <div className="grid gap-4">
              {POLICY_BLOCKS.map((p) => (
                <div
                  key={p.title}
                  className="rounded-xl border border-gray-200 bg-white p-7"
                >
                  <h3 className="mb-2 text-base font-semibold text-[#0f1e3d]">{p.title}</h3>
                  <p className="text-[0.92rem] leading-relaxed text-gray-500">{p.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Contact Block */}
          <section className="mb-16">
            <div className="rounded-xl bg-[#0f1e3d] p-10 text-center">
              <h2 className="font-serif text-2xl text-white mb-3">
                Something Not Working for You?
              </h2>
              <p className="mx-auto mb-6 max-w-[520px] text-[0.95rem] leading-relaxed text-white/65">
                If you encounter any barrier on our website or at our dealership — or if you have a
                suggestion for how we can improve — we want to hear from you. Every piece of feedback
                is reviewed and acted on.
              </p>
              <a
                href="mailto:accessibility@planetmotors.ca"
                className="inline-block rounded-lg bg-[#c9a84c] px-8 py-3.5 text-[0.9rem] font-bold text-[#0f1e3d] transition-colors hover:bg-[#e8c96d] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Email Our Accessibility Team
              </a>
              <div className="mt-5 text-[0.85rem] text-white/50">
                <a href="mailto:accessibility@planetmotors.ca" className="text-[#c9a84c] no-underline">
                  accessibility@planetmotors.ca
                </a>
                {" · "}
                <a href="tel:+18667973332" className="text-[#c9a84c] no-underline">
                  1-866-797-3332
                </a>
                {" · "}
                Available in alternative formats upon request
              </div>
            </div>
          </section>
        </div>

        {/* Footer Note */}
        <div className="pb-12 pt-8 text-center text-[0.82rem] text-gray-400 leading-relaxed">
          <p>
            This page was last updated May 2026.
            <br />
            Planet Motors Inc. · OMVIC #5482807 · 30 Major Mackenzie Dr E, Richmond Hill, ON
            <br />
            <Link href="/" className="text-[#c9a84c] no-underline">
              Return to homepage
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}
