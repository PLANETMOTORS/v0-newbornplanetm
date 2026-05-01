import { Metadata } from "next"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Keyboard,
  Mic,
  Focus,
  Smartphone,
  Ban,
  MousePointerClick,
  FileText,
  CircleSlash,
  Mail,
  Phone,
  CheckCircle2,
  Shield,
  ArrowRight,
} from "lucide-react"
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
      'If you have set your device to reduce motion, our site respects that preference. All transitions and animations are turned off completely. No sliding overlays, no spinning loaders, no unnecessary movement. You see the same content as everyone else, just without the animation.',
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
    icon: Mail,
    title: "Communication",
    body: "We communicate with people with disabilities in ways that work for them. If you need information in a different format such as larger text, plain language, or another accommodation, just let us know and we will make it happen.",
  },
  {
    icon: Shield,
    title: "Assistive Devices",
    body: "You are welcome to use your personal assistive devices when visiting our premises or accessing our services. If a specific device presents a safety concern in our facility, we will work with you to find an alternative that ensures you can still access what you need.",
  },
  {
    icon: CheckCircle2,
    title: "Service Animals & Support Persons",
    body: "Service animals and support persons are welcome at all Planet Motors locations. If you are accompanied by a support person, they will never be prevented from being with you on our premises.",
  },
  {
    icon: FileText,
    title: "Staff Training",
    body: "Every team member at Planet Motors receives training on the AODA and its Customer Service Standards, including how to interact respectfully with people who have disabilities, how to work with assistive devices, and what to do if someone needs help accessing our services. This training is provided during onboarding and updated whenever our policies change.",
  },
  {
    icon: ArrowRight,
    title: "Ongoing Improvement",
    body: "Accessibility is not a checkbox. It is a continuous practice. We regularly review our website and services to identify barriers and remove them. As web standards evolve, we evolve with them. Our current target is WCAG 2.2 Level AA, and we will adopt newer standards as they become available.",
  },
] as const

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ACCESSIBILITY_SCHEMA) }}
      />

      <main id="main-content" tabIndex={-1}>
        {/* ═══════════ HERO ═══════════ */}
        <section className="relative overflow-hidden bg-primary py-20 text-primary-foreground lg:py-28">
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
            <div className="absolute -bottom-32 -left-32 h-[500px] w-[500px] rounded-full bg-white/[0.03] blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-4xl px-6 text-center lg:px-8">
            <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-xs uppercase tracking-wider shadow-lg">
              WCAG 2.2 Level AA
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              Accessibility Statement
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-primary-foreground/70 md:text-xl">
              At Planet Motors, accessibility is not something we added later. It has been part of
              every component, every page, and every interaction since the very beginning.
            </p>
          </div>
        </section>

        {/* ═══════════ COMMITMENT ═══════════ */}
        <section className="py-16 lg:py-20">
          <div className="mx-auto max-w-4xl px-6 lg:px-8">
            <Card className="shadow-lg">
              <CardContent className="p-8 md:p-10">
                <h2 className="mb-4 text-2xl font-bold md:text-3xl">Our Commitment</h2>
                <p className="text-base leading-relaxed text-muted-foreground">
                  We believe that buying a car should be straightforward and stress-free for everyone.
                  Whether you navigate our site with a mouse, a keyboard, a screen reader, or voice
                  control, you deserve the same smooth experience. Planet Motors is designed and
                  engineered to meet the Web Content Accessibility Guidelines (WCAG) 2.2 at Level AA,
                  which goes beyond the WCAG 2.0 Level AA standard referenced by Ontario&apos;s
                  Accessibility for Ontarians with Disabilities Act (
                  <a
                    href="https://www.aoda.ca"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-primary underline underline-offset-2 hover:text-primary/80"
                  >
                    AODA
                  </a>
                  ).
                </p>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                  This page walks you through what we have built, the standards we follow, and how to
                  reach us if something on our site is not working the way it should.
                </p>
                <Separator className="my-6" />
                <div className="text-sm text-muted-foreground">
                  <strong className="block text-foreground">Planet Motors Inc.</strong>
                  <a
                    href="https://www.omvic.on.ca"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
                  >
                    OMVIC
                  </a>
                  {" "}Licensed Dealer #5482807 · 30 Major Mackenzie Dr E, Richmond Hill, ON
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ═══════════ WHAT WE HAVE BUILT ═══════════ */}
        <section className="border-t border-border bg-muted/50 py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mb-14 text-center">
              <Badge variant="outline" className="mb-4 text-xs">Live in Production</Badge>
              <h2 className="text-3xl font-bold md:text-4xl">What We Have Built</h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
                These are not planned improvements. They are live features running in production today.
                Every item below has been engineered directly into our codebase.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {FEATURES.map((f) => (
                <Card
                  key={f.title}
                  className="group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <CardContent className="p-7">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/15">
                        <f.icon className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="text-base font-bold">{f.title}</h3>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">{f.description}</p>
                    <Badge variant="secondary" className="mt-4 text-[0.7rem] font-semibold tracking-wide">
                      {f.wcag}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ STANDARDS WE MEET ═══════════ */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-4xl px-6 lg:px-8">
            <div className="mb-14 text-center">
              <Badge variant="outline" className="mb-4 text-xs">Compliance</Badge>
              <h2 className="text-3xl font-bold md:text-4xl">Standards We Meet</h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
                We build to WCAG 2.2 Level AA, which is a higher standard than the WCAG 2.0 Level AA
                referenced by Ontario&apos;s AODA. Below is a summary of the specific criteria our site
                addresses today.
              </p>
            </div>

            <Card className="overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-sm" role="table">
                  <thead>
                    <tr className="bg-muted">
                      <th
                        scope="col"
                        className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-foreground"
                      >
                        Criterion
                      </th>
                      <th
                        scope="col"
                        className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-foreground"
                      >
                        Description
                      </th>
                      <th
                        scope="col"
                        className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-foreground"
                      >
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {STANDARDS.map((s) => (
                      <tr key={s.criterion} className="border-b border-border/50 last:border-b-0">
                        <td className="px-5 py-3.5 font-medium text-foreground">{s.criterion}</td>
                        <td className="px-5 py-3.5 leading-snug text-muted-foreground">{s.description}</td>
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
            </Card>
          </div>
        </section>

        {/* ═══════════ AODA COMMITMENT ═══════════ */}
        <section className="border-t border-border bg-muted/50 py-16 lg:py-24">
          <div className="mx-auto max-w-4xl px-6 lg:px-8">
            <div className="mb-14 text-center">
              <Badge variant="outline" className="mb-4 text-xs">Ontario Law</Badge>
              <h2 className="text-3xl font-bold md:text-4xl">Our Commitment Under AODA</h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
                Planet Motors is committed to complying with the{" "}
                <a
                  href="https://www.aoda.ca"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-primary underline underline-offset-2 hover:text-primary/80"
                >
                  Accessibility for Ontarians with Disabilities Act (AODA)
                </a>
                {" "}and its Customer Service Standards. We treat every customer
                with dignity, respect, and equal opportunity regardless of ability.
              </p>
            </div>

            <div className="grid gap-6">
              {POLICY_BLOCKS.map((p) => (
                <Card key={p.title} className="transition-all duration-200 hover:shadow-md">
                  <CardContent className="flex gap-5 p-7">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <p.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="mb-2 text-base font-bold">{p.title}</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">{p.body}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ CONTACT ═══════════ */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-3xl px-6 lg:px-8">
            <Card className="overflow-hidden shadow-xl">
              <div className="bg-primary p-10 text-center text-primary-foreground md:p-14">
                <h2 className="mb-3 text-2xl font-bold md:text-3xl">
                  Something Not Working for You?
                </h2>
                <p className="mx-auto mb-8 max-w-xl text-sm leading-relaxed text-primary-foreground/80 md:text-base">
                  If you run into any barrier on our website or at our dealership, or if you have a
                  suggestion for how we can do better, we genuinely want to hear from you. Every piece
                  of feedback is reviewed and acted on. Our technical team will provide a manual
                  accommodation within 48 hours.
                </p>
                <Button size="lg" variant="secondary" className="h-12 px-8 text-base font-semibold shadow-lg" asChild>
                  <a href={`mailto:${EMAIL_INFO}`}>
                    <Mail className="mr-2 h-4 w-4" />
                    Email Us
                  </a>
                </Button>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-primary-foreground/70">
                  <a
                    href={`mailto:${EMAIL_INFO}`}
                    className="flex items-center gap-1.5 transition-colors hover:text-primary-foreground"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    {EMAIL_INFO}
                  </a>
                  <span className="hidden sm:inline" aria-hidden="true">·</span>
                  <a
                    href={`tel:${PHONE_TOLL_FREE_TEL}`}
                    className="flex items-center gap-1.5 transition-colors hover:text-primary-foreground"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {PHONE_TOLL_FREE}
                  </a>
                  <span className="hidden sm:inline" aria-hidden="true">·</span>
                  <a
                    href={`tel:${PHONE_LOCAL_TEL}`}
                    className="flex items-center gap-1.5 transition-colors hover:text-primary-foreground"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {PHONE_LOCAL}
                  </a>
                </div>
                <p className="mt-4 text-xs text-primary-foreground/50">
                  Available in alternative formats upon request
                </p>
              </div>
            </Card>
          </div>
        </section>

        {/* ═══════════ FOOTER NOTE ═══════════ */}
        <div className="border-t border-border py-12 text-center text-xs text-muted-foreground">
          <p>
            Accessibility Statement v2.0 · Effective May 2026 · Last reviewed May 2026
          </p>
          <p className="mt-1">
            © 2026 Planet Motors Inc. · OMVIC #5482807 · 30 Major Mackenzie Dr E, Richmond Hill, ON
          </p>
          <div className="mt-3 flex items-center justify-center gap-3">
            <Link href="/" className="text-primary underline underline-offset-2 hover:text-primary/80">
              Home
            </Link>
            <span aria-hidden="true">·</span>
            <Link href="/privacy" className="text-primary underline underline-offset-2 hover:text-primary/80">
              Privacy
            </Link>
            <span aria-hidden="true">·</span>
            <Link href="/terms" className="text-primary underline underline-offset-2 hover:text-primary/80">
              Terms
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
