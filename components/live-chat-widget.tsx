"use client"

import { useState } from "react"
import { MessageCircle, X, Send, Minimize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Message {
  id: number
  text: string
  sender: "user" | "agent"
  timestamp: Date
}

export function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hi! Welcome to Planet Motors. How can I help you today?",
      sender: "agent",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")

  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: messages.length + 1,
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages([...messages, userMessage])
    setInputValue("")

    // Simulate agent response
    setTimeout(() => {
      const agentMessage: Message = {
        id: messages.length + 2,
        text: "Thanks for reaching out! One of our representatives will be with you shortly. In the meantime, feel free to browse our inventory at planetmotors.ca",
        sender: "agent",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, agentMessage])
    }, 1000)
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-primary text-primary-foreground px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="font-medium">Chat with us</span>
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
      </button>
    )
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 bg-card border border-border rounded-xl shadow-2xl transition-all ${
        isMinimized ? "w-72 h-14" : "w-80 sm:w-96 h-[480px]"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground rounded-t-xl">
        <div className="flex items-center gap-2">
          <div className="relative">
            <MessageCircle className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full" />
          </div>
          <div>
            <div className="font-semibold text-sm">Planet Motors Support</div>
            {!isMinimized && (
              <div className="text-xs text-primary-foreground/80">Online now</div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-primary-foreground/10 rounded"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-primary-foreground/10 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto h-[340px]">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                    message.sender === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your message..."
                className="flex-1"
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              />
              <Button size="icon" onClick={handleSendMessage}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
