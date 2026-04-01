"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Send, Bot, User, Sparkles } from "lucide-react"

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
  const [messages, setMessages] = useState<Message[]>([])
  const [offer, setOffer] = useState("")
  const [customMessage, setCustomMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [currentOffer, setCurrentOffer] = useState<number | null>(null)

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
          vehicleInfo: {
            name: vehicleName,
            daysListed,
            viewsLastWeek,
          },
        }),
      })

      if (!response.ok) throw new Error("Failed to negotiate")

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
              if (parsed.type === "text-delta" && parsed.delta) {
                fullContent += parsed.delta
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      // Parse the final response
      try {
        const result = JSON.parse(fullContent)
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: result.response,
            counterOffer: result.counterOffer,
            status: result.status,
          },
        ])
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: fullContent || "I'd be happy to discuss pricing with you. What price did you have in mind?",
            status: "negotiating",
          },
        ])
      }
    } catch (error) {
      console.error("Negotiation error:", error)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I apologize, but I'm having trouble processing your offer. Please try again or call us at 416-985-2277.",
          status: "escalate",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="w-full gap-2 border-primary text-primary hover:bg-primary hover:text-white"
      >
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
          Negotiate directly with our AI. Fair offers may be accepted instantly!
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Messages */}
        <div className="max-h-64 overflow-y-auto space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-4 text-muted-foreground text-sm">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              Enter your offer below to start negotiating
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-white"
                    : "bg-muted"
                }`}
              >
                <p>{msg.content}</p>
                {msg.counterOffer && (
                  <p className="mt-2 font-semibold text-primary">
                    Counter Offer: ${msg.counterOffer.toLocaleString()}
                  </p>
                )}
                {msg.status === "accepted" && (
                  <p className="mt-2 text-green-600 font-medium">Offer Accepted!</p>
                )}
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

        {/* Input */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                type="text"
                placeholder="Enter your offer"
                value={offer}
                onChange={(e) => setOffer(e.target.value)}
                className="pl-7"
                disabled={isLoading}
              />
            </div>
            <Button onClick={handleSubmitOffer} disabled={isLoading || !offer} size="icon">
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <Input
            placeholder="Add a message (optional)"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="text-xs text-muted-foreground text-center">
          List Price: <span className="font-semibold">${vehiclePrice.toLocaleString()}</span>
          {currentOffer && (
            <>
              {" "}• Your Offer: <span className="font-semibold">${currentOffer.toLocaleString()}</span>
            </>
          )}
        </div>

        <Button variant="ghost" size="sm" className="w-full" onClick={() => setIsOpen(false)}>
          Close Negotiator
        </Button>
      </CardContent>
    </Card>
  )
}
