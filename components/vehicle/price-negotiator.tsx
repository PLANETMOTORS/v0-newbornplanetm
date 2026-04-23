"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Send, Bot, User, Sparkles, Mail, Phone, CheckCircle, Loader2 } from "lucide-react"
import { PHONE_LOCAL, PHONE_LOCAL_TEL } from "@/lib/constants/dealership"

interface Message {
  role: "user" | "assistant"
  content: string
  counterOffer?: number
  status?: "negotiating" | "accepted" | "declined" | "escalate"
}

interface PriceNegotiatorProps {
  vehicleId: string
  vehiclePrice: number
  vehicleName: string
  daysListed?: number
  viewsLastWeek?: number
}

export function PriceNegotiator({
  vehicleId,
  vehiclePrice,
  vehicleName,
  daysListed = 30,
  viewsLastWeek = 25,
}: PriceNegotiatorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<"contact" | "verify" | "negotiate">("contact")
  const [contactInfo, setContactInfo] = useState({ name: "", email: "", phone: "" })
  const [verificationCode, setVerificationCode] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [verifyMethod, setVerifyMethod] = useState<"email" | "phone">("email")
  const [messages, setMessages] = useState<Message[]>([])
  const [offer, setOffer] = useState("")
  const [customMessage, setCustomMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [currentOffer, setCurrentOffer] = useState<number | null>(null)

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const isValidPhone = (phone: string) => phone.replace(/\D/g, "").length >= 10
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 10)
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }

  const sendVerificationCode = async () => {
    setIsSendingCode(true)
    
    try {
      await fetch("/api/verify/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: verifyMethod,
          destination: verifyMethod === "email" ? contactInfo.email : contactInfo.phone,
          purpose: "price_negotiation",
          vehicleName,
        }),
      })
    } catch {
      // Continue anyway — server generates and stores the code
    }
    setStep("verify")
    setIsSendingCode(false)
  }

  const verifyCode = async () => {
    setIsVerifying(true)
    try {
      const destination = verifyMethod === "email" ? contactInfo.email : contactInfo.phone
      const response = await fetch("/api/verify/check-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination, code: verificationCode }),
      })
      const result = await response.json()
      if (result.verified) {
        setStep("negotiate")
        setMessages([{
          role: "assistant",
          content: `Hi ${contactInfo.name}! I'm the Planet Motors AI negotiator. I see you're interested in the ${vehicleName} listed at $${vehiclePrice.toLocaleString()}. What offer would you like to make?`,
        }])
      }
    } catch {
      // Verification failed — user can retry
    } finally {
      setIsVerifying(false)
    }
  }

  const handleSubmitOffer = async () => {
    const offerAmount = parseFloat(offer.replace(/[^0-9.]/g, ""))
    if (isNaN(offerAmount) || offerAmount <= 0) return

    setCurrentOffer(offerAmount)
    const userMessage = customMessage || `I'd like to offer $${offerAmount.toLocaleString()} for this vehicle.`

    setMessages((prev) => [...prev, { role: "user", content: userMessage }])
    setIsLoading(true)
    setOffer("")
    setCustomMessage("")

    try {
      const response = await fetch("/api/negotiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId,
          vehiclePrice,
          customerOffer: offerAmount,
          customerMessage: userMessage,
          customerName: contactInfo.name,
          customerEmail: contactInfo.email,
          customerPhone: contactInfo.phone,
          vehicleInfo: { name: vehicleName, daysListed, viewsLastWeek },
        }),
      })

      if (!response.ok) throw new Error("Failed")

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullContent = ""

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split("\n")
        for (const line of lines) {
          if (line.startsWith("data:")) {
            const data = line.slice(5).trim()
            if (data === "[DONE]") continue
            try {
              const parsed = JSON.parse(data)
              if (parsed.type === "text-delta" && parsed.delta) fullContent += parsed.delta
            } catch { /* ignore parse errors for streaming chunks */ }
          }
        }
      }

      try {
        const result = JSON.parse(fullContent)
        setMessages((prev) => [...prev, { role: "assistant", content: result.response, counterOffer: result.counterOffer, status: result.status }])
      } catch {
        setMessages((prev) => [...prev, { role: "assistant", content: fullContent || "I'd be happy to discuss pricing. What price did you have in mind?", status: "negotiating" }])
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: `I'm having trouble processing. Please try again or call ${PHONE_LOCAL}.`, status: "escalate" }])
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} variant="outline" className="w-full gap-2 border-primary text-primary hover:bg-primary hover:text-white">
        <Sparkles className="w-4 h-4" />
        Make an Offer (AI Negotiator)
      </Button>
    )
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bot className="w-5 h-5 text-primary" />
          AI Price Negotiator
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {step === "contact" ? "Verify your identity to start negotiating" : step === "verify" ? "Enter verification code" : "Negotiate directly with our AI"}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Step 1: Contact */}
        {step === "contact" && (
          <div className="space-y-4">
            <div className="space-y-3">
              <div>
                <Label htmlFor="neg-name">Name</Label>
                <Input id="neg-name" placeholder="Your name" value={contactInfo.name} onChange={(e) => setContactInfo({ ...contactInfo, name: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="neg-email">Email</Label>
                <Input id="neg-email" type="email" placeholder="your@email.com" value={contactInfo.email} onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="neg-phone">Phone</Label>
                <Input id="neg-phone" type="tel" placeholder="(416) 555-1234" value={contactInfo.phone} onChange={(e) => setContactInfo({ ...contactInfo, phone: formatPhone(e.target.value) })} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { setVerifyMethod("email"); sendVerificationCode(); }} disabled={!contactInfo.name || !isValidEmail(contactInfo.email) || isSendingCode}>
                <Mail className="w-4 h-4 mr-2" />{isSendingCode ? "Sending..." : "Verify via Email"}
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => { setVerifyMethod("phone"); sendVerificationCode(); }} disabled={!contactInfo.name || !isValidPhone(contactInfo.phone) || isSendingCode}>
                <Phone className="w-4 h-4 mr-2" />{isSendingCode ? "Sending..." : "Verify via SMS"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Verify */}
        {step === "verify" && (
          <div className="space-y-4">
            <div className="text-center">
              <CheckCircle className="w-12 h-12 mx-auto text-primary mb-2" />
              <p className="text-sm text-muted-foreground">We sent a 6-digit code to your {verifyMethod}.</p>
              <p className="text-xs text-muted-foreground">{verifyMethod === "email" ? contactInfo.email : contactInfo.phone}</p>
            </div>
            <div>
              <Label htmlFor="verify-code">Verification Code</Label>
              <Input id="verify-code" placeholder="123456" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))} className="text-center text-lg tracking-widest" maxLength={6} />
            </div>
            <Button className="w-full" onClick={verifyCode} disabled={verificationCode.length !== 6 || isVerifying}>
              {isVerifying && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isVerifying ? "Verifying..." : "Verify & Continue"}
            </Button>
            <Button variant="ghost" size="sm" className="w-full" onClick={() => setStep("contact")}>Back</Button>
          </div>
        )}

        {/* Step 3: Negotiate */}
        {step === "negotiate" && (
          <>
            <div className="max-h-64 overflow-y-auto space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${msg.role === "user" ? "bg-primary text-white" : "bg-muted"}`}>
                    <p>{msg.content}</p>
                    {msg.counterOffer && <p className="mt-2 font-semibold text-primary">Counter: ${msg.counterOffer.toLocaleString()}</p>}
                    {msg.status === "accepted" && <p className="mt-2 text-green-600 font-semibold">Offer Accepted!</p>}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-primary animate-pulse" />
                  </div>
                  <div className="bg-muted rounded-lg px-3 py-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce [animation-delay:0.1s]" />
                      <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce [animation-delay:0.2s]" />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input type="text" placeholder="Enter your offer" value={offer} onChange={(e) => setOffer(e.target.value)} className="pl-7" disabled={isLoading} />
                </div>
                <Button onClick={handleSubmitOffer} disabled={isLoading || !offer} size="icon">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <Input placeholder="Add a message (optional)" value={customMessage} onChange={(e) => setCustomMessage(e.target.value)} disabled={isLoading} />
            </div>
            <div className="text-xs text-muted-foreground text-center">
              List Price: <span className="font-semibold">${vehiclePrice.toLocaleString()}</span>
              {currentOffer && <> | Your Offer: <span className="font-semibold">${currentOffer.toLocaleString()}</span></>}
            </div>
          </>
        )}

        <Button variant="ghost" size="sm" className="w-full" onClick={() => setIsOpen(false)}>Close</Button>
      </CardContent>
    </Card>
  )
}
