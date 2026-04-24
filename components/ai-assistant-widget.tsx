"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Bot, X, MessageSquare, DollarSign, Video, Bell, 
  Car, ChevronRight, Sparkles 
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

export function AIAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false)


  const features = [
    {
      id: "negotiate",
      icon: DollarSign,
      title: "AI Price Negotiator",
      description: "Chat with our AI to negotiate the best price",
      color: "bg-green-500",
      href: "/inventory?ai=negotiate"
    },
    {
      id: "video",
      icon: Video,
      title: "Live Video Tour",
      description: "Schedule a live video walkthrough",
      color: "bg-teal-500",
      href: "/inventory?ai=video"
    },
    {
      id: "trade",
      icon: Car,
      title: "Instant Cash Offer",
      description: "Get an AI-powered trade-in quote",
      color: "bg-purple-500",
      href: "/trade-in"
    },
    {
      id: "alerts",
      icon: Bell,
      title: "Price Drop Alerts",
      description: "Get notified when prices drop",
      color: "bg-orange-500",
      href: "/inventory?ai=alerts"
    }
  ]

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-[9999]">
        {!isOpen && (
          <Button
            onClick={() => setIsOpen(true)}
            size="lg"
            className="rounded-full w-16 h-16 shadow-2xl bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 animate-pulse hover:animate-none"
          >
            <Bot className="w-7 h-7" />
          </Button>
        )}
      </div>

      {/* Floating Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-[9999] w-80 sm:w-96">
          <Card className="shadow-2xl border-2 overflow-hidden">
            {/* Header */}
            <CardHeader className="bg-linear-to-r from-blue-600 to-purple-600 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">AI Assistant</CardTitle>
                    <p className="text-xs text-white/90">Powered by Planet Motors</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/20"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-semibold">AI-Powered Features</span>
                <Badge variant="secondary" className="text-xs">NEW</Badge>
              </div>

              {features.map((feature) => (
                <Link 
                  key={feature.id} 
                  href={feature.href}
                  onClick={() => setIsOpen(false)}
                >
                  <div 
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer",
                      "hover:border-primary hover:bg-primary/5 hover:shadow-sm"
                    )}
                  >
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white", feature.color)}>
                      <feature.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{feature.title}</h4>
                      <p className="text-xs text-muted-foreground">{feature.description}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}

              {/* Quick Chat Option */}
              <div className="pt-2 border-t">
                <Link href="/contact" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" className="w-full" size="sm">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Chat with Sales Team
                  </Button>
                </Link>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Available 24/7 for your convenience
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
