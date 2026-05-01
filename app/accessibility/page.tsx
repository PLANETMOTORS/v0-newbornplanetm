import { Metadata } from "next"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import {
  PHONE_LOCAL,
  PHONE_LOCAL_TEL,
  PHONE_TOLL_FREE,
  PHONE_TOLL_FREE_TEL,
  EMAIL_INFO,
} from "@/lib/constants/dealership"

export const metadata: Metadata = {
  title: "Accessibility Standard | Planet Motors",
  description:
    "Planet Motors is built for everyone. Our platform meets WCAG 2.2 Level AA accessibility standards, ensuring a dignified experience for every Ontarian.",
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
    "captions",
  ],
  accessibilityHazard: "none",
  accessibilityAPI: ["ARIA"],
  accessibilityControl: [
    "fullKeyboardControl",
    "fullMouseControl",
    "fullTouchControl",
    "fullVoiceControl",
  ],
  publisher: {
    "@type": "AutoDealer",
    name: "Planet Motors Inc.",
    url: "https://www.planetmotors.ca",
  },
} as const

const FEATURES = [
  {
    title: "Full Keyboard Navigation",
    description:
      "Every feature on our site can be completed entirely without a mouse. That includes searching our inventory, applying for financing, and everything in between. Arrow keys move through search suggestions. Enter selects. Escape closes. Tab reaches every interactive element on the page. Our search bar follows the WAI-ARIA combobox pattern, which means keyboard users and screen reader users get the exact same experience as everyone else.",
    wcag: "WCAG 2.1.1 · 2.1.2",
  },
  {
    title: "Screen Reader Friendly",
    description:
      'Every element on our site is properly labelled with ARIA roles and attributes. When you search our inventory, the page announces results out loud as they appear. You will hear things like "6 results found" or "No vehicles matching your search" through a live region that screen readers pick up right away. Decorative elements are hidden from assistive technology so your screen reader only communicates what actually matters.',
    wcag: "WCAG 4.1.2 · 4.1.3",
  },
  {
    title: "Visible Focus Indicators",
    description:
      "When you navigate with a keyboard, every button, link, and input field shows a clear, high-contrast focus ring. You will always know exactly where you are on the page. We never hide these focus outlines. They are part of the design itself, not something we added as an afterthought.",
    wcag: "WCAG 2.4.7",
  },
  {
    title: "Generous Touch Targets",
    description:
      "Every button and interactive element on our site meets a minimum 44 by 44 pixel touch area. Whether you are tapping on a phone screen or using a stylus, you will not have to struggle to hit the right spot. This is especially important for shoppers browsing our inventory on mobile, which accounts for the majority of our visitors.",
    wcag: "WCAG 2.5.8",
  },
  {
    title: "Respects Reduced Motion",
    description:
      'If you have set your device to reduce motion, our site respects that preference. All transitions and animations are turned off completely. No sliding overlays, no spinning loaders, no unnecessary movement. You see the same content as everyone else, just without the animation.',
    wcag: "WCAG 2.3.3",
  },
  {
    title: "Mobile-First Accessibility",
    description:
      "Our mobile search opens as a full-screen experience instead of a tiny dropdown that the keyboard covers up. Focus stays trapped inside the search panel so the Tab key cannot wander behind it. The page behind it stops scrolling so nothing shifts underneath you. A clear close button is always visible and easy to reach. These features work the same way whether you are on an iPhone, an Android tablet, or a desktop computer with assistive technology.",
    wcag: "WCAG 2.1.2 · 1.4.13",
  },
  {
    title: "No Hover-Only Content",
    description:
      "Nothing on our site requires you to hover a mouse to access it. Hover effects are purely visual, like a subtle shadow or a gentle border glow, and they exist only to help sighted mouse users see that something is clickable. Every real feature is triggered by a click, a tap, or keyboard focus. This ensures full compatibility with touch screens, voice controls, and all assistive devices.",
    wcag: "WCAG 1.4.13",
  },
  {
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
  { criterion: "1.4.10", description: "Content reflows without loss of information at 320px" },
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
    <div className="min-h-screen bg-white">
      <Header />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ACCESSIBILITY_SCHEMA) }}
      />

      <main id="main-content" tabIndex={-1} className="mx-auto max-w-[800px] px-6">
        {/* Header */}
        <header className="pb-[60px] pt-[100px]">
          <div className="mb-5 inline-block border border-[#1e293b] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[2px] text-[#1e293b]">
            WCAG 2.2 AA Compliant
          </div>
          <h1 className="mb-6 text-[clamp(2.5rem,6vw,3.5rem)] font-extrabold leading-[1.1] text-[#0f172a]">
            Built for Everyone.
          </h1>
          <p className="max-w-[600px] text-[1.15rem] text-[#64748b]">
            At Planet Motors, accessibility is not something we added later. It has been part of
            every component, every page, and every interaction since the very beginning.
          </p>
        </header>

        {/* Commitment */}
        <div className="border-t border-[#e2e8f0] pb-10 pt-10">
          <p className="text-[1.05rem] leading-[1.8] text-[#1e293b]">
            We believe that buying a car should be straightforward and stress-free for everyone.
            Whether you navigate our site with a mouse, a keyboard, a screen reader, or voice
            control, you deserve the same smooth experience. Planet Motors is designed and
            engineered to meet the Web Content Accessibility Guidelines (WCAG) 2.2 at Level AA,
            which goes beyond the WCAG 2.0 Level AA standard referenced by Ontario&apos;s
            Accessibility for Ontarians with Disabilities Act ({" "}
            <a
              href="https://www.aoda.ca"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#0f172a] underline decoration-[#94a3b8] decoration-1 underline-offset-[3px] transition-colors hover:text-[#334155]"
            >
              AODA
            </a>
            ).
          </p>
          <p className="mt-4 text-[1.05rem] leading-[1.8] text-[#1e293b]">
            This page walks you through what we have built, the standards we follow, and how to
            reach us if something on our site is not working the way it should.
          </p>
          <div className="mt-7 border-t border-[#e2e8f0] pt-5 text-sm text-[#64748b]">
            <strong className="block text-[0.95rem] text-[#0f172a]">Planet Motors Inc.</strong>
            <a
              href="https://www.omvic.on.ca"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#475569] underline decoration-[#94a3b8] decoration-1 underline-offset-2"
            >
              OMVIC
            </a>
            {" "}Licensed Dealer #5482807 · 30 Major Mackenzie Dr E, Richmond Hill, ON
          </div>
        </div>

        {/* What We Have Built */}
        <section className="border-t border-[#e2e8f0] py-[60px]">
          <h2 className="mb-2 text-2xl font-extrabold text-[#0f172a]">
            What We Have Built
          </h2>
          <p className="mb-8 text-[0.95rem] leading-relaxed text-[#475569]">
            These are not planned improvements. They are live features running in production today.
            Every item below has been engineered directly into our codebase.
          </p>

          <div className="grid grid-cols-1 gap-8">
            {FEATURES.map((f) => (
              <div key={f.title} className="border-b border-[#f1f5f9] pb-8 last:border-b-0 last:pb-0">
                <h3 className="mb-3 text-[1.1rem] font-bold text-[#0f172a]">{f.title}</h3>
                <p className="text-[0.95rem] leading-[1.7] text-[#475569]">{f.description}</p>
                <span className="mt-3 inline-block text-xs font-semibold tracking-wide text-[#64748b]">
                  {f.wcag}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Standards We Meet */}
        <section className="border-t border-[#e2e8f0] py-[60px]">
          <h2 className="mb-2 text-2xl font-extrabold text-[#0f172a]">Standards We Meet</h2>
          <p className="mb-8 text-[0.95rem] leading-relaxed text-[#475569]">
            We build to WCAG 2.2 Level AA, which is a higher standard than the WCAG 2.0 Level AA
            referenced by Ontario&apos;s AODA. Below is a summary of the specific criteria our site
            addresses today.
          </p>

          <div className="overflow-hidden rounded-lg border border-[#e2e8f0]">
            <table className="w-full text-[0.9rem]" role="table">
              <thead>
                <tr className="bg-[#f8fafc]">
                  <th
                    scope="col"
                    className="border-b border-[#e2e8f0] px-4 py-3 text-left text-xs font-bold uppercase tracking-[1px] text-[#0f172a]"
                  >
                    Criterion
                  </th>
                  <th
                    scope="col"
                    className="border-b border-[#e2e8f0] px-4 py-3 text-left text-xs font-bold uppercase tracking-[1px] text-[#0f172a]"
                  >
                    Description
                  </th>
                  <th
                    scope="col"
                    className="border-b border-[#e2e8f0] px-4 py-3 text-left text-xs font-bold uppercase tracking-[1px] text-[#0f172a]"
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {STANDARDS.map((s) => (
                  <tr key={s.criterion} className="border-b border-[#f1f5f9] last:border-b-0">
                    <td className="px-4 py-3 font-medium text-[#0f172a]">{s.criterion}</td>
                    <td className="px-4 py-3 text-[#475569] leading-snug">{s.description}</td>
                    <td className="px-4 py-3">
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
        <section className="border-t border-[#e2e8f0] py-[60px]">
          <h2 className="mb-2 text-2xl font-extrabold text-[#0f172a]">
            Our Commitment Under AODA
          </h2>
          <p className="mb-8 text-[0.95rem] leading-relaxed text-[#475569]">
            Planet Motors is committed to complying with the{" "}
            <a
              href="https://www.aoda.ca"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#0f172a] underline decoration-[#94a3b8] decoration-1 underline-offset-2"
            >
              Accessibility for Ontarians with Disabilities Act (AODA)
            </a>
            {" "}and its Customer Service Standards. We treat every customer
            with dignity, respect, and equal opportunity regardless of ability.
          </p>

          <div className="grid gap-6">
            {POLICY_BLOCKS.map((p) => (
              <div
                key={p.title}
                className="border-b border-[#f1f5f9] pb-6 last:border-b-0 last:pb-0"
              >
                <h3 className="mb-2 text-base font-bold text-[#0f172a]">{p.title}</h3>
                <p className="text-[0.92rem] leading-[1.7] text-[#475569]">{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section className="border-t border-[#e2e8f0] py-[60px]">
          <h2 className="mb-3 text-2xl font-extrabold text-[#0f172a]">Something Not Working for You?</h2>
          <p className="mb-6 max-w-[600px] text-[0.95rem] leading-[1.7] text-[#475569]">
            If you run into any barrier on our website or at our dealership, or if you have a
            suggestion for how we can do better, we genuinely want to hear from you. Every piece
            of feedback is reviewed and acted on. Our technical team will provide a manual
            accommodation within 48 hours.
          </p>
          <a
            href={`mailto:${EMAIL_INFO}`}
            className="inline-block bg-[#0f172a] px-10 py-4 text-[0.9rem] font-extrabold text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#0f172a]"
          >
            EMAIL US
          </a>
          <div className="mt-5 text-[0.85rem] text-[#64748b]">
            <a
              href={`mailto:${EMAIL_INFO}`}
              className="text-[#475569] underline decoration-[#94a3b8] decoration-1 underline-offset-2 hover:text-[#0f172a]"
            >
              {EMAIL_INFO}
            </a>
            {" · "}
            <a
              href={`tel:${PHONE_TOLL_FREE_TEL}`}
              className="text-[#475569] underline decoration-[#94a3b8] decoration-1 underline-offset-2 hover:text-[#0f172a]"
            >
              {PHONE_TOLL_FREE}
            </a>
            {" · "}
            <a
              href={`tel:${PHONE_LOCAL_TEL}`}
              className="text-[#475569] underline decoration-[#94a3b8] decoration-1 underline-offset-2 hover:text-[#0f172a]"
            >
              {PHONE_LOCAL}
            </a>
            {" · "}
            Available in alternative formats upon request
          </div>
        </section>

        {/* Version / Footer Note */}
        <div className="border-t border-[#e2e8f0] py-[60px] text-center text-xs uppercase tracking-[1px] text-[#94a3b8]">
          <p>
            Accessibility Statement v2.0, Effective May 2026, Last reviewed May 2026.
          </p>
          <p className="mt-2">
            © 2026 Planet Motors Inc. · OMVIC #5482807 · 30 Major Mackenzie Dr E, Richmond Hill, ON
          </p>
          <p className="mt-2">
            <Link href="/" className="text-[#475569] underline decoration-[#94a3b8] decoration-1 underline-offset-2 hover:text-[#0f172a]">
              Home
            </Link>
            {" · "}
            <Link href="/privacy" className="text-[#475569] underline decoration-[#94a3b8] decoration-1 underline-offset-2 hover:text-[#0f172a]">
              Privacy
            </Link>
            {" · "}
            <Link href="/terms" className="text-[#475569] underline decoration-[#94a3b8] decoration-1 underline-offset-2 hover:text-[#0f172a]">
              Terms
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}
