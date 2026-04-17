import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export const metadata = {
  title: "Privacy Policy | Planet Motors",
  description: "Privacy Policy for Planet Motors Inc. - How we collect, use, and protect your personal information.",
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-8 pb-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h1 className="font-serif text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: March 28, 2026</p>
          
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
              <p className="text-muted-foreground mb-4">
                Planet Motors Inc. (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website planetmotors.ca, use our mobile application, or engage with our services.
              </p>
              <p className="text-muted-foreground">
                We comply with the Personal Information Protection and Electronic Documents Act (PIPEDA) and applicable Ontario privacy laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
              <h3 className="text-xl font-medium mb-3">Personal Information</h3>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li>Name, email address, phone number, and mailing address</li>
                <li>Driver&apos;s license information for test drives and purchases</li>
                <li>Financial information for financing applications (processed securely through our lending partners)</li>
                <li>Vehicle trade-in information including VIN, registration details</li>
                <li>Payment information (credit card, bank account details)</li>
              </ul>
              
              <h3 className="text-xl font-medium mb-3">Automatically Collected Information</h3>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>IP address, browser type, device information</li>
                <li>Pages visited, time spent on pages, click patterns</li>
                <li>Referral sources and search queries</li>
                <li>Location data (with your consent)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Process vehicle purchases, trade-ins, and financing applications</li>
                <li>Provide customer support and respond to inquiries</li>
                <li>Send transactional emails (order confirmations, delivery updates)</li>
                <li>Send marketing communications (with your opt-in consent)</li>
                <li>Improve our website, services, and user experience</li>
                <li>Comply with legal obligations and OMVIC requirements</li>
                <li>Detect and prevent fraud</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Information Sharing</h2>
              <p className="text-muted-foreground mb-4">We may share your information with:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong>Financing Partners:</strong> Major banks, credit unions, and specialized auto finance lenders (for credit applications)</li>
                <li><strong>Vehicle History Providers:</strong> Carfax Canada, Canadian Black Book</li>
                <li><strong>Delivery Partners:</strong> Licensed auto transport companies</li>
                <li><strong>Service Providers:</strong> Payment processors, email services, analytics providers</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                We never sell your personal information to third parties for marketing purposes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
              <p className="text-muted-foreground mb-4">
                We implement industry-standard security measures including:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>256-bit SSL/TLS encryption for all data transmission</li>
                <li>PCI DSS Level 1 compliance for payment processing</li>
                <li>Regular security audits and penetration testing</li>
                <li>Access controls and employee training</li>
                <li>Data stored in SOC 2 Type II certified data centers in Canada</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
              <p className="text-muted-foreground mb-4">Under PIPEDA, you have the right to:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Access your personal information we hold</li>
                <li>Request correction of inaccurate information</li>
                <li>Withdraw consent for marketing communications</li>
                <li>Request deletion of your data (subject to legal retention requirements)</li>
                <li>File a complaint with the Privacy Commissioner of Canada</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Cookies and Tracking</h2>
              <p className="text-muted-foreground mb-4">
                We use cookies and similar technologies to enhance your experience. You can manage cookie preferences through your browser settings. We use:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong>Essential Cookies:</strong> Required for website functionality</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how visitors use our site</li>
                <li><strong>Marketing Cookies:</strong> Enable personalized advertising (with consent)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Data Retention</h2>
              <p className="text-muted-foreground">
                We retain your personal information for as long as necessary to provide our services and comply with legal obligations. Vehicle purchase records are retained for 7 years as required by OMVIC and tax regulations. You may request deletion of marketing data at any time.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Contact Us</h2>
              <p className="text-muted-foreground mb-4">
                For privacy-related inquiries or to exercise your rights, contact our Privacy Officer:
              </p>
              <div className="bg-muted/50 p-6 rounded-lg">
                <p className="font-semibold">Planet Motors Inc.</p>
                <p className="text-muted-foreground">Privacy Officer</p>
                <p className="text-muted-foreground">30 Major Mackenzie Dr E</p>
                <p className="text-muted-foreground">Richmond Hill, ON L4C 1G7</p>
                <p className="text-muted-foreground mt-2">Email: privacy@planetmotors.ca</p>
                <p className="text-muted-foreground">Toll-Free: 1-866-797-3332</p>
                <p className="text-muted-foreground">Local: 416-985-2277</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Changes to This Policy</h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the &quot;Last updated&quot; date. We encourage you to review this policy periodically.
              </p>
            </section>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
