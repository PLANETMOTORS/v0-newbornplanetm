import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Accessibility Statement | Planet Motors",
  description: "Planet Motors is committed to digital accessibility. Learn about our WCAG 2.1 AA compliance and how to contact us for accessibility support.",
}

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye, Ear, Hand, Brain, Phone, Mail } from "lucide-react"

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main id="main-content" tabIndex={-1} className="pt-32 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-serif font-bold text-foreground mb-6">
              Accessibility Statement
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Planet Motors is committed to ensuring digital accessibility for people with disabilities.
              We are continually improving the user experience for everyone and applying the relevant
              accessibility standards.
            </p>

            {/* Commitment */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Our Commitment</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
                <p>
                  We strive to ensure that our website and digital services are accessible to all users,
                  including those with visual, auditory, motor, and cognitive disabilities. Our goal is
                  to provide an inclusive experience that allows everyone to browse our inventory, apply
                  for financing, and complete purchases with ease.
                </p>
              </CardContent>
            </Card>

            {/* Accessibility Features */}
            <h2 className="text-2xl font-serif font-bold mb-6">Accessibility Features</h2>
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              <Card>
                <CardHeader>
                  <Eye className="w-8 h-8 text-primary mb-2" />
                  <CardTitle>Visual Accessibility</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>High contrast color schemes</li>
                    <li>Resizable text up to 200%</li>
                    <li>Alt text for all images</li>
                    <li>Screen reader compatible</li>
                    <li>Clear visual focus indicators</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Ear className="w-8 h-8 text-primary mb-2" />
                  <CardTitle>Auditory Accessibility</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>Captions for video content</li>
                    <li>Transcripts for audio content</li>
                    <li>Visual alerts and notifications</li>
                    <li>No audio-only controls</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Hand className="w-8 h-8 text-primary mb-2" />
                  <CardTitle>Motor Accessibility</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>Full keyboard navigation</li>
                    <li>Skip navigation links</li>
                    <li>No time-limited actions</li>
                    <li>Large click targets</li>
                    <li>No complex gestures required</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Brain className="w-8 h-8 text-primary mb-2" />
                  <CardTitle>Cognitive Accessibility</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>Clear, simple language</li>
                    <li>Consistent navigation</li>
                    <li>Error prevention and recovery</li>
                    <li>Progress indicators</li>
                    <li>Predictable page behavior</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Standards */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Conformance Standards</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
                <p>
                  We aim to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA.
                  These guidelines explain how to make web content more accessible for people with
                  disabilities and more user-friendly for everyone.
                </p>
                <p>
                  We also comply with the Accessibility for Ontarians with Disabilities Act (AODA)
                  and follow the Ontario Human Rights Code requirements for accessible customer service.
                </p>
              </CardContent>
            </Card>

            {/* Assistive Technologies */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Assistive Technology Support</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
                <p>Our website is designed to be compatible with the following assistive technologies:</p>
                <ul>
                  <li>Screen readers (JAWS, NVDA, VoiceOver, TalkBack)</li>
                  <li>Screen magnification software</li>
                  <li>Speech recognition software</li>
                  <li>Keyboard-only navigation</li>
                  <li>Switch devices</li>
                </ul>
              </CardContent>
            </Card>

            {/* Feedback */}
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle>Feedback & Assistance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  We welcome your feedback on the accessibility of our website. If you encounter any
                  barriers or have suggestions for improvement, please contact us:
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button asChild>
                    <a href="tel:1-866-797-3332">
                      <Phone className="w-4 h-4 mr-2" />
                      1-866-797-3332
                    </a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="mailto:accessibility@planetmotors.ca">
                      <Mail className="w-4 h-4 mr-2" />
                      accessibility@planetmotors.ca
                    </a>
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  We aim to respond to accessibility feedback within 2 business days.
                </p>
              </CardContent>
            </Card>

            {/* Last Updated */}
            <p className="text-sm text-muted-foreground mt-8 text-center">
              This accessibility statement was last updated on March 1, 2026.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
