import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export const metadata = {
  title: "Terms of Service | Planet Motors",
  description: "Terms of Service for Planet Motors Inc. - Terms and conditions for using our vehicle buying and selling services.",
}

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main id="main-content" tabIndex={-1} className="pt-24 pb-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-[-0.01em] mb-2">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last updated: March 28, 2026</p>
          
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
              <p className="text-muted-foreground">
                By accessing or using the Planet Motors website (planetmotors.ca), mobile application, or any of our services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services. Planet Motors Inc. is a registered Ontario Motor Vehicle Industry Council (OMVIC) dealer.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Eligibility</h2>
              <p className="text-muted-foreground mb-4">To use our services, you must:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Be at least 18 years of age</li>
                <li>Have a valid driver&apos;s license (for vehicle purchases and test drives)</li>
                <li>Be a resident of Canada</li>
                <li>Have the legal capacity to enter into binding contracts</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. Vehicle Purchases</h2>
              
              <h3 className="text-xl font-medium mb-3">3.1 Pricing</h3>
              <p className="text-muted-foreground mb-4">
                All vehicle prices displayed on our website are in Canadian dollars and include applicable fees unless otherwise noted. Prices are subject to change without notice until a binding purchase agreement is signed. Applicable sales tax will be added at checkout.
              </p>
              
              <h3 className="text-xl font-medium mb-3">3.2 Refundable Deposit</h3>
              <p className="text-muted-foreground mb-4">
                A $250 refundable deposit is required to reserve a vehicle. This deposit is fully refundable within 48 hours of placement if you choose not to proceed with the purchase.
              </p>
              
              <h3 className="text-xl font-medium mb-3">3.3 10-Day Money-Back Guarantee</h3>
              <p className="text-muted-foreground mb-4">
                We offer a 10-day money-back guarantee on all vehicle purchases. You may return the vehicle within 10 days of delivery for a full refund, provided:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>The vehicle has been driven no more than 500 km from the delivery odometer reading</li>
                <li>The vehicle is in the same condition as delivered (no damage, modifications, or excessive wear)</li>
                <li>All included accessories and documentation are returned</li>
                <li>The return is initiated by contacting our customer service team</li>
              </ul>
              
              <h3 className="text-xl font-medium mb-3">3.4 Vehicle Condition</h3>
              <p className="text-muted-foreground">
                All vehicles undergo our comprehensive 210-point inspection. We provide detailed condition reports, Carfax Canada vehicle history reports, and EV Battery Health Certifications (for electric vehicles) for complete transparency. Photos and descriptions are accurate to the best of our knowledge, but minor variations may occur.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Financing</h2>
              <p className="text-muted-foreground mb-4">
                Financing is provided through our network of trusted lending partners including major banks, credit unions, and specialized auto finance companies. Approval is subject to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Credit approval by the lender</li>
                <li>Verification of employment and income</li>
                <li>Proof of Canadian residency</li>
                <li>Valid driver&apos;s license and insurance</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                Rates starting from 6.29% APR are available to qualified buyers. Your actual rate will depend on your credit profile and the lender&apos;s assessment.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Trade-In and Selling Your Vehicle</h2>
              <p className="text-muted-foreground mb-4">
                When trading in or selling your vehicle to Planet Motors:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Our offer is based on accurate information provided about your vehicle&apos;s condition</li>
                <li>The final offer may be adjusted after physical inspection if the vehicle differs materially from your description</li>
                <li>You must provide clear title and all required documentation</li>
                <li>If your vehicle has an outstanding lien, we will pay off the balance directly</li>
                <li>Offers are valid for 7 days from the date of appraisal</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Nationwide Delivery</h2>
              <p className="text-muted-foreground mb-4">
                We provide delivery across Canada from our Richmond Hill location (L4C 1G7). Delivery pricing is based on distance:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong>0-300 km:</strong> FREE delivery</li>
                <li><strong>301-499 km:</strong> $0.70 per km</li>
                <li><strong>500-999 km:</strong> $0.75 per km</li>
                <li><strong>1,000-2,000 km:</strong> $0.80 per km</li>
                <li><strong>2,001+ km:</strong> $0.65 per km</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                Estimated delivery times are provided but are not guaranteed. You are responsible for being present to accept delivery and inspect the vehicle. Risk of loss transfers to you upon delivery acceptance.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Warranties</h2>
              <p className="text-muted-foreground mb-4">
                All vehicles come with:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Balance of manufacturer&apos;s warranty (if applicable)</li>
                <li>30-day/1,500 km basic powertrain warranty</li>
                <li>Option to purchase extended warranty coverage</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                Electric vehicles include our exclusive EV Battery Health Certification with specific battery health guarantees.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. User Accounts</h2>
              <p className="text-muted-foreground">
                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Prohibited Conduct</h2>
              <p className="text-muted-foreground mb-4">You agree not to:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Provide false or misleading information</li>
                <li>Use our services for any unlawful purpose</li>
                <li>Attempt to circumvent any security features</li>
                <li>Interfere with the proper operation of our website</li>
                <li>Scrape, data mine, or otherwise extract data from our platform</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">10. Limitation of Liability</h2>
              <p className="text-muted-foreground">
                To the maximum extent permitted by law, Planet Motors Inc. shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our services. Our total liability shall not exceed the amount paid by you for the specific transaction giving rise to the claim.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">11. Dispute Resolution</h2>
              <p className="text-muted-foreground">
                Any disputes arising from these terms or your use of our services shall be resolved through binding arbitration in accordance with the Arbitration Act (Ontario), unless you are entitled to bring a claim before the Ontario Motor Vehicle Industry Council (OMVIC). The arbitration shall take place in Toronto, Ontario, and shall be conducted in English.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">12. Governing Law</h2>
              <p className="text-muted-foreground">
                These Terms of Service shall be governed by and construed in accordance with the laws of the Province of Ontario and the federal laws of Canada applicable therein, without regard to conflict of law principles.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">13. Contact Information</h2>
              <p className="text-muted-foreground mb-4">
                For questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-muted/50 p-6 rounded-lg">
                <p className="font-semibold">Planet Motors Inc.</p>
                <p className="text-muted-foreground">OMVIC Registered Dealer</p>
                <p className="text-muted-foreground">30 Major Mackenzie Dr E</p>
                <p className="text-muted-foreground">Richmond Hill, ON L4C 1G7</p>
                <p className="text-muted-foreground mt-2">Email: legal@planetmotors.ca</p>
                <p className="text-muted-foreground">Toll-Free: 1-866-797-3332</p>
                <p className="text-muted-foreground">Local: 416-985-2277</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">14. Changes to Terms</h2>
              <p className="text-muted-foreground">
                We reserve the right to modify these Terms of Service at any time. Material changes will be communicated via email or prominent notice on our website. Your continued use of our services after such changes constitutes acceptance of the updated terms.
              </p>
            </section>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
