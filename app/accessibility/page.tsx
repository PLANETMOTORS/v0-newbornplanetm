import { Metadata } from "next"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Keyboard, Mic, Focus, Smartphone, Ban, MousePointerClick, FileText, CircleSlash } from "lucide-react"
import { PHONE_LOCAL, PHONE_LOCAL_TEL, PHONE_TOLL_FREE, PHONE_TOLL_FREE_TEL, EMAIL_INFO } from "@/lib/constants/dealership"

export const metadata: Metadata = {
  title: "Accessibility Statement | Planet Motors",
  description:
    "Planet Motors is built for everyone. Learn how our website meets WCAG 2.2 Level AA accessibility standards, from keyboard navigation to screen reader support.",
  alternates: { canonical: "/accessibility" },
}

const ACCESSIBILITY_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Accessibility Statement",
  url: "https://www.planetmotors.ca/accessibility",
  accessibilityFeature: [
    "alternativeText",
    "highContrastDisplay",
    "largePrint",
    "structuralNavigation",
    "ARIA",
    "tableOfContents",
  ],
  accessibilityHazard: "none",
  accessibilityAPI: ["ARIA"],
  accessibilityControl: [
    "fullKeyboardControl",
    "fullMouseControl",
    "fullTouchControl",
  ],
  publisher: {
    "@type": "AutoDealer",
    name: "Planet Motors Inc.",
    url: "https://www.planetmotors.ca",
  },
} as const

const FEATURES = [
  {
    icon: Keyboard,
    title: "Full Keyboard Navigation",
    description:
      "Every feature on our site can be completed entirely without a mouse. That includes searching our inventory, applying for financing, and everything in between. Arrow keys move through search suggestions. Enter selects. Escape closes. Tab reaches every interactive element on the page. Our search bar follows the WAI-ARIA combobox pattern, which means keyboard users and screen reader users get the exact same experience as everyone else.",
    wcag: "WCAG 2.1.1 · 2.1.2",
  },
  {
    icon: Mic,
    title: "Screen Reader Friendly",
    description:
      'Every element on our site is properly labelled with ARIA roles and attributes. When you search our inventory, the page announces results out loud as they appear. You will hear things like "6 results found" or "No vehicles matching your search" through a live region that screen readers pick up right away. Decorative elements are hidden from assistive technology so your screen reader only communicates what actually matters.',
    wcag: "WCAG 4.1.2 · 4.1.3",
  },
  {
    icon: Focus,
    title: "Visible Focus Indicators",
    description:
      "When you navigate with a keyboard, every button, link, and input field shows a clear, high-contrast focus ring. You will always know exactly where you are on the page. We never hide these focus outlines. They are part of the design itself, not something we added as an afterthought.",
    wcag: "WCAG 2.4.7",
  },
  {
    icon: MousePointerClick,
    title: "Generous Touch Targets",
    description:
      "Every button and interactive element on our site meets a minimum 44 by 44 pixel touch area. Whether you are tapping on a phone screen or using a stylus, you will not have to struggle to hit the right spot. This is especially important for shoppers browsing our inventory on mobile, which accounts for the majority of our visitors.",
    wcag: "WCAG 2.5.8",
  },
  {
    icon: CircleSlash,
    title: "Respects Reduced Motion",
    description:
      "If you have set your device to reduce motion, our site respects that preference. All transitions and animations are turned off completely. No sliding overlays, no spinning loaders, no unnecessary movement. You see the same content as everyone else, just without the animation.",
    wcag: "WCAG 2.3.3",
  },
  {
    icon: Smartphone,
    title: "Mobile-First Accessibility",
    description:
      "Our mobile search opens as a full-screen experience instead of a tiny dropdown that the keyboard covers up. Focus stays trapped inside the search panel so the Tab key cannot wander behind it. The page behind it stops scrolling so nothing shifts underneath you. A clear close button is always visible and easy to reach. These features work the same way whether you are on an iPhone, an Android tablet, or a desktop computer with assistive technology.",
    wcag: "WCAG 2.1.2 · 1.4.13",
  },
  {
    icon: Ban,
    title: "No Hover-Only Content",
    description:
      "Nothing on our site requires you to hover a mouse to access it. Hover effects are purely visual, like a subtle shadow or a gentle border glow, and they exist only to help sighted mouse users see that something is clickable. Every real feature is triggered by a click, a tap, or keyboard focus. This ensures full compatibility with touch screens, voice controls, and all assistive devices.",
    wcag: "WCAG 1.4.13",
  },
  {
    icon: FileText,
    title: "Meaningful Page Structure",
    description:
      "Our pages use proper heading levels, landmark regions, and semantic HTML so that assistive technology can build a clear and accurate picture of the content. Vehicle detail pages include structured data that helps both search engines and assistive tools understand what is on the page. Every image includes descriptive alt text. Vehicle photos describe the make, model, colour, and camera angle so you know exactly what you are looking at.",
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
    body: "We communicate with people with disabilities in ways that work for them. If you need information in a different format such as larger text, plain language, or another accommodation, just let us know and we will make it happen.",
  },
  {
    title: "Assistive Devices",
    body: "You are welcome to use your personal assistive devices when visiting our premises or accessing our services. If a specific device presents a safety concern in our facility, we will work with you to find an alternative that ensures you can still access what you need.",
  },
  {
    title: "Service Animals & Support Persons",
    body: "Service animals and support persons are welcome at all Planet Motors locations. If you are accompanied by a support person, they will never be prevented from being with you on our premises.",
  },
  {
    title: "Staff Training",
    body: "Every team member at Planet Motors receives training on the AODA and its Customer Service Standards, including how to interact respectfully with people who have disabilities, how to work with assistive devices, and what to do if someone needs help accessing our services. This training is provided during onboarding and updated whenever our policies change.",
  },
  {
    title: "Ongoing Improvement",
    body: "Accessibility is not a checkbox. It is a continuous practice. We regularly review our website and services to identify barriers and remove them. As web standards evolve, we evolve with them. Our current target is WCAG 2.2 Level AA, and we will adopt newer standards as they become available.",
  },
] as const

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <Header />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ACCESSIBILITY_SCHEMA) }}
      />

      <main id="main-content" tabIndex={-1}>
        {/* Hero Header */}
        <header className="border-b border-white/10 bg-[#0f172a] px-6 pt-20 pb-16 text-center md:pt-28 md:pb-20">
          <h1 className="text-3xl font-extrabold leading-tight text-white md:text-5xl">
            Built for <span className="text-[#c9a84c]">Everyone</span>
          </h1>
          <p className="mx-auto mt-4 max-w-[560px] text-[1.05rem] leading-relaxed text-white/70">
            At Planet Motors, accessibility is not something we added later. It has been part of
            every component, every page, and every interaction since the very beginning.
          </p>
        </header>

        <div className="mx-auto max-w-[780px] px-6">
          {/* Commitment Block */}
          <div className="relative z-10 mt-10 rounded-xl border border-[#e2e8f0] bg-white p-8 md:p-10 mb-12">
            <p className="text-[1.05rem] font-bold leading-[1.8] text-[#0f172a]">
              We believe that buying a car should be straightforward and stress-free for everyone.
              Whether you navigate our site with a mouse, a keyboard, a screen reader, or voice
              control, you deserve the same smooth experience. Planet Motors is designed and
              engineered to meet the Web Content Accessibility Guidelines (WCAG) 2.2 at Level AA,
              which goes beyond the WCAG 2.0 Level AA standard referenced by Ontario&apos;s
              Accessibility for Ontarians with Disabilities Act (AODA).
            </p>
            <p className="mt-4 text-[1.05rem] font-bold leading-[1.8] text-[#0f172a]">
              This page walks you through what we have built, the standards we follow, and how to
              reach us if something on our site is not working the way it should.
            </p>
            <div className="mt-7 border-t border-[#e2e8f0] pt-5 text-sm text-[#64748b]">
              <strong className="block text-[0.95rem] text-[#0f172a]">Planet Motors Inc.</strong>
              <a
                href="https://www.omvic.on.ca"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#c9a84c] underline underline-offset-2"
              >
                OMVIC
              </a>
              {" "}Licensed Dealer #5482807 · 30 Major Mackenzie Dr E, Richmond Hill, ON
            </div>
          </div>

          {/* What We've Built */}
          <section className="mb-14">
            <h2 className="text-[1.55rem] font-extrabold leading-tight text-[#0f172a] mb-2">
              What We Have Built
            </h2>
            <p className="text-[0.95rem] font-bold text-[#0f172a] leading-relaxed mb-7">
              These are not planned improvements. They are live features running in production today.
              Every item below has been engineered directly into our codebase.
            </p>

            <div className="grid gap-4">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="rounded-xl border border-[#e2e8f0] bg-white p-7 transition-colors hover:border-[#c9a84c]"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[rgba(201,168,76,0.12)]">
                      <f.icon className="h-5 w-5 text-[#c9a84c]" />
                    </div>
                    <h3 className="text-base font-bold text-[#0f172a]">{f.title}</h3>
                  </div>
                  <p className="text-[0.92rem] font-bold leading-relaxed text-[#0f172a]">{f.description}</p>
                  <span className="mt-2.5 inline-block rounded-md bg-[rgba(201,168,76,0.12)] px-2.5 py-0.5 text-[0.78rem] font-semibold tracking-wide text-[#c9a84c]">
                    {f.wcag}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Standards We Meet */}
          <section className="mb-14">
            <h2 className="text-[1.55rem] font-extrabold leading-tight text-[#0f172a] mb-2">
              Standards We Meet
            </h2>
            <p className="text-[0.95rem] font-bold text-[#0f172a] leading-relaxed mb-7">
              We build to WCAG 2.2 Level AA, which is a higher standard than the WCAG 2.0 Level AA
              referenced by Ontario&apos;s AODA. Below is a summary of the specific criteria our site
              addresses today.
            </p>

            <div className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white">
              <table className="w-full text-[0.9rem]" role="table">
                <thead className="bg-[#e2e8f0] text-[#0f172a]">
                  <tr>
                    <th scope="col" className="px-5 py-3.5 text-left text-[0.82rem] font-bold uppercase tracking-wider">
                      Criterion
                    </th>
                    <th scope="col" className="px-5 py-3.5 text-left text-[0.82rem] font-bold uppercase tracking-wider">
                      Description
                    </th>
                    <th scope="col" className="px-5 py-3.5 text-left text-[0.82rem] font-bold uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {STANDARDS.map((s) => (
                    <tr key={s.criterion} className="border-b border-[#f1f5f9] last:border-b-0">
                      <td className="px-5 py-3.5 text-[#0f172a]">{s.criterion}</td>
                      <td className="px-5 py-3.5 text-[#0f172a] leading-snug">{s.description}</td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-[0.82rem] font-semibold text-[#16803c]">
                          <span className="inline-block h-2 w-2 rounded-full bg-[#16803c]" aria-hidden="true" />
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
            <h2 className="text-[1.55rem] font-extrabold leading-tight text-[#0f172a] mb-2">
              Our Commitment Under AODA
            </h2>
            <p className="text-[0.95rem] font-bold text-[#0f172a] leading-relaxed mb-7">
              Planet Motors is committed to complying with the{" "}
              <a
                href="https://www.aoda.ca"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#c9a84c] underline underline-offset-2 font-bold"
              >
                Accessibility for Ontarians with Disabilities Act (AODA)
              </a>
              {" "}and its Customer Service Standards. We treat every customer
              with dignity, respect, and equal opportunity regardless of ability.
            </p>

            <div className="grid gap-4">
              {POLICY_BLOCKS.map((p) => (
                <div
                  key={p.title}
                  className="rounded-xl border border-[#e2e8f0] bg-white p-7"
                >
                  <h3 className="mb-2 text-base font-bold text-[#0f172a]">{p.title}</h3>
                  <p className="text-[0.92rem] font-bold leading-relaxed text-[#0f172a]">{p.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Contact Block */}
          <section className="mb-16">
            <div className="rounded-xl border border-[#e2e8f0] bg-[#f1f5f9] p-10 text-center">
              <h2 className="text-2xl font-extrabold text-[#0f172a] mb-3">
                Something Not Working for You?
              </h2>
              <p className="mx-auto mb-6 max-w-[520px] text-[0.95rem] font-bold leading-relaxed text-[#0f172a]">
                If you run into any barrier on our website or at our dealership, or if you have a
                suggestion for how we can do better, we genuinely want to hear from you. Every piece
                of feedback is reviewed and acted on.
              </p>
              <a
                href={`mailto:${EMAIL_INFO}`}
                className="inline-block rounded-lg bg-[#c9a84c] px-8 py-3.5 text-[0.9rem] font-bold text-[#0f172a] transition-colors hover:bg-[#e8c96d] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#c9a84c]"
              >
                Email Us
              </a>
              <div className="mt-5 text-[0.85rem] text-[#94a3b8]">
                <a href={`mailto:${EMAIL_INFO}`} className="text-[#c9a84c] no-underline">
                  {EMAIL_INFO}
                </a>
                {" · "}
                <a href={`tel:${PHONE_TOLL_FREE_TEL}`} className="text-[#c9a84c] no-underline">
                  {PHONE_TOLL_FREE}
                </a>
                {" · "}
                <a href={`tel:${PHONE_LOCAL_TEL}`} className="text-[#c9a84c] no-underline">
                  {PHONE_LOCAL}
                </a>
                {" · "}
                Available in alternative formats upon request
              </div>
            </div>
          </section>
        </div>

        {/* Footer Note */}
        <div className="pb-12 pt-8 text-center text-[0.82rem] leading-relaxed text-[#94a3b8]">
          <p>
            Accessibility Statement v1.0, Effective May 2026, Last reviewed May 2026.
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
