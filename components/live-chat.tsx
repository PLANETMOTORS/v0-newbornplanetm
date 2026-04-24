"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, X, Send, Phone, Minimize2 } from "lucide-react"
import { PHONE_TOLL_FREE, PHONE_TOLL_FREE_TEL } from "@/lib/constants/dealership"

interface Message {
  id: string
  text: string
  sender: "user" | "agent"
  timestamp: Date
}

export function LiveChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")

  // Initialize after mount to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true)
    setMessages([
      {
        id: "1",
        text: "Hi! Welcome to Planet Motors. How can I help you today?",
        sender: "agent",
        timestamp: new Date()
      }
    ])
  }, [])

  const sendMessage = () => {
    if (!inputValue.trim()) return
    
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: new Date()
    }
    
    setMessages([...messages, userMessage])
    setInputValue("")

    // Simulate agent response
    setTimeout(() => {
      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Thanks for reaching out! A team member will be with you shortly. In the meantime, feel free to browse our inventory or check out our FAQ section.",
        sender: "agent",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, agentMessage])
    }, 1000)
  }

  // Don't render until mounted to avoid hydration mismatch
  if (!isMounted) {
    return null
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg z-50"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
        <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-green-500">
          1
        </Badge>
      </Button>
    )
  }

  return (
    <Card className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-80 md:w-96 max-w-96 shadow-2xl z-50 transition-all duration-200 ${isMinimized ? "h-14" : "h-[450px] sm:h-[480px]"}`}>
      <CardHeader className="p-3 bg-primary text-primary-foreground rounded-t-lg flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <CardTitle className="text-sm font-semibold">Planet Motors Support</CardTitle>
        </div>
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      {!isMinimized && (
        <CardContent className="p-0 flex flex-col h-[calc(100%-56px)]">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div 
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    message.sender === "user" 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="px-4 py-2 border-t flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" className="text-xs h-7">
              Schedule Test Drive
            </Button>
            <Button variant="outline" size="sm" className="text-xs h-7">
              Get Pre-Approved
            </Button>
          </div>

          {/* Input */}
          <div className="p-3 border-t flex gap-2">
            <Input 
              placeholder="Type a message..." 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              className="flex-1"
            />
            <Button size="icon" onClick={sendMessage} aria-label="Send message">
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* Call Option */}
          <div className="p-2 border-t bg-muted/30 text-center">
            <a
              href={`tel:${PHONE_TOLL_FREE_TEL}`}
              className="text-xs text-muted-foreground hover:text-primary flex items-center justify-center gap-1"
            >
              <Phone className="h-3 w-3" />
              Prefer to call? {PHONE_TOLL_FREE}
            </a>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
