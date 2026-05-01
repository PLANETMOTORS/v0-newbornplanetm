import { Metadata } from "next"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { PHONE_LOCAL, PHONE_LOCAL_TEL, PHONE_TOLL_FREE, PHONE_TOLL_FREE_TEL, EMAIL_INFO } from "@/lib/constants/dealership"

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
    title: "Keyboard Navigation",
    description:
      "Every feature, from inventory search to financing, is fully operable via keyboard. We follow the WAI-ARIA combobox pattern for our predictive search.",
    wcag: "WCAG 2.1.1",
  },
  {
    title: "Screen Reader Support",
    description:
      "Semantic HTML and live regions ensure assistive technologies communicate real-time updates, such as inventory count and search results.",
    wcag: "WCAG 4.1.2",
  },
  {
    title: "Contrast & Clarity",
    description:
      "We maintain a strict contrast ratio of at least 4.5:1. All interactive elements feature generous 44px touch targets for mobile and stylus users.",
    wcag: "WCAG 1.4.3",
  },
  {
    title: "Reduced Motion",
    description:
      'Our site respects system-level "Reduced Motion" preferences, disabling all non-essential animations and transitions automatically.',
    wcag: "WCAG 2.3.3",
  },
] as const

const STANDARDS = [
  { requirement: "Information & Communications", standard: "WCAG 2.2 AA" },
  { requirement: "Customer Service", standard: "AODA Part IV.2" },
  { requirement: "Employment Standards", standard: "AODA Part III" },
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
          <div className="mb-5 inline-block border border-[#c9a84c] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[2px] text-[#c9a84c]">
            WCAG 2.2 AA Compliant
          </div>
          <h1 className="mb-6 text-[clamp(2.5rem,6vw,3.5rem)] font-extrabold leading-[1.1] text-[#0f172a]">
            Built for Everyone.
          </h1>
          <p className="max-w-[600px] text-[1.15rem] text-[#64748b]">
            At Planet Motors, accessibility is engineered into every component, ensuring a dignified
            experience for all.
          </p>
        </header>

        {/* Commitment */}
        <div className="border-t border-[#e2e8f0] pb-10 pt-10">
          <p className="text-[1.1rem] leading-[1.6] text-[#1e293b]">
            We believe buying a vehicle should be transparent and accessible. Our platform is
            engineered to meet{" "}
            <strong className="text-[#0f172a]">WCAG 2.2 Level AA</strong> standards, exceeding the
            WCAG 2.0 requirements mandated by Ontario&apos;s{" "}
            <a
              href="https://www.aoda.ca"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#c9a84c] underline decoration-[#c9a84c] decoration-1 underline-offset-[3px] transition-colors hover:text-[#0f172a]"
            >
              AODA
            </a>
            .
          </p>
        </div>

        {/* Core Accessibility Features */}
        <section className="border-t border-[#e2e8f0] py-[60px]">
          <h2 className="mb-[30px] text-2xl font-extrabold text-[#0f172a]">
            Core Accessibility Features
          </h2>
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
            {FEATURES.map((f) => (
              <div key={f.title}>
                <h3 className="mb-3 text-[1.1rem] font-bold text-[#0f172a]">{f.title}</h3>
                <p className="text-[0.95rem] leading-[1.6] text-[#64748b]">{f.description}</p>
                <span className="mt-2 block text-xs font-bold text-[#c9a84c]">{f.wcag}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Ontario Standards */}
        <section className="border-t border-[#e2e8f0] py-[60px]">
          <h2 className="mb-[30px] text-2xl font-extrabold text-[#0f172a]">Ontario Standards</h2>
          <div className="overflow-hidden">
            <table className="w-full text-[0.9rem]" role="table">
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="border-b-2 border-[#0f172a] px-3 py-3 text-left text-xs font-bold uppercase tracking-[1px] text-[#0f172a]"
                  >
                    Requirement
                  </th>
                  <th
                    scope="col"
                    className="border-b-2 border-[#0f172a] px-3 py-3 text-left text-xs font-bold uppercase tracking-[1px] text-[#0f172a]"
                  >
                    Standard
                  </th>
                  <th
                    scope="col"
                    className="border-b-2 border-[#0f172a] px-3 py-3 text-left text-xs font-bold uppercase tracking-[1px] text-[#0f172a]"
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {STANDARDS.map((s) => (
                  <tr key={s.requirement} className="border-b border-[#e2e8f0] last:border-b-0">
                    <td className="px-3 py-3 text-[#1e293b]">{s.requirement}</td>
                    <td className="px-3 py-3 text-[#1e293b]">{s.standard}</td>
                    <td className="px-3 py-3 font-bold text-[#16803c]">MET</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Contact */}
        <section className="border-t border-[#e2e8f0] py-[60px]">
          <h2 className="mb-3 text-2xl font-extrabold text-[#0f172a]">Need Assistance?</h2>
          <p className="mb-6 max-w-[520px] text-[0.95rem] leading-[1.6] text-[#64748b]">
            If you encounter any barriers on our site, our technical team will provide a manual
            accommodation within 48 hours.
          </p>
          <a
            href={`mailto:${EMAIL_INFO}`}
            className="inline-block bg-[#c9a84c] px-10 py-4 text-[0.9rem] font-extrabold text-[#0f172a] transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#c9a84c]"
          >
            EMAIL US
          </a>
          <div className="mt-5 text-[0.85rem] text-[#64748b]">
            <a href={`mailto:${EMAIL_INFO}`} className="text-[#c9a84c] no-underline hover:underline">
              {EMAIL_INFO}
            </a>
            {" · "}
            <a href={`tel:${PHONE_TOLL_FREE_TEL}`} className="text-[#c9a84c] no-underline hover:underline">
              {PHONE_TOLL_FREE}
            </a>
            {" · "}
            <a href={`tel:${PHONE_LOCAL_TEL}`} className="text-[#c9a84c] no-underline hover:underline">
              {PHONE_LOCAL}
            </a>
          </div>
        </section>

        {/* Version / Footer Note */}
        <div className="border-t border-[#e2e8f0] py-[60px] text-center text-xs uppercase tracking-[1px] text-[#64748b]">
          <p>
            Accessibility Statement v1.0, Effective May 2026, Last reviewed May 2026.
          </p>
          <p className="mt-2">
            © 2026 Planet Motors Inc. ·{" "}
            <Link href="/" className="text-[#c9a84c] no-underline hover:underline">
              Home
            </Link>
            {" · "}
            <Link href="/privacy" className="text-[#c9a84c] no-underline hover:underline">
              Privacy
            </Link>
            {" · "}
            <Link href="/terms" className="text-[#c9a84c] no-underline hover:underline">
              Terms
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}
