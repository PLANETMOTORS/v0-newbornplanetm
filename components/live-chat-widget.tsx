"use client"

// Planet Motors Live Chat Widget - Anna AI Assistant
import { useState, useEffect, useRef } from "react"
import { MessageCircle, X, Send, Minimize2, Bot, Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useChat } from "@ai-sdk/react"
import { cn } from "@/lib/utils"

interface QuickAction {
  label: string
  prompt: string
  icon: string
}

export function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Quick actions from CMS (hardcoded fallback, but API uses CMS values)
  const quickActions: QuickAction[] = [
    { label: "Calculate Payment", prompt: "Help me calculate monthly payments", icon: "calculator" },
    { label: "Get Trade Value", prompt: "What's my car worth?", icon: "dollar" },
    { label: "Book Test Drive", prompt: "I want to schedule a test drive", icon: "calendar" },
    { label: "Find a Car", prompt: "Help me find my perfect car", icon: "car" },
  ]

  // AI Chat hook
  const { messages, input, setInput, handleSubmit, isLoading, append } = useChat({
    api: "/api/anna",
    initialMessages: [
      {
        id: "welcome",
        role: "assistant",
        content: "Hey! I'm Anna from Planet Motors. How can I help you today?\n\nI can help with:\n• Finding the perfect vehicle from our available inventory\n• Calculating payments and financing options\n• Getting your trade-in value\n• Booking test drives or appointments\n\nWhat are you looking for?"
      }
    ],
  })

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleQuickAction = (prompt: string) => {
    append({ role: "user", content: prompt })
  }

  // Don't render until mounted to avoid hydration mismatch
  if (!isMounted) {
    return null
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 min-h-[48px]"
      >
        <Bot className="w-5 h-5" />
        <span className="font-medium hidden sm:inline">Chat with Anna</span>
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
      </button>
    )
  }

  return (
    <div
      className={cn(
        "fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 bg-card border border-border rounded-xl shadow-2xl transition-all will-change-transform",
        isMinimized ? "w-72 h-14" : "w-[calc(100vw-2rem)] sm:w-96 max-h-[70vh] sm:max-h-[520px] flex flex-col"
      )}
      style={{ contain: 'layout style' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-xl">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
          </div>
          <div>
            <div className="font-semibold text-sm flex items-center gap-1">
              Anna
              <Sparkles className="w-3 h-3 text-yellow-300" />
            </div>
            {!isMinimized && (
              <div className="text-xs text-white/80">AI Assistant • Online</div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto min-h-[200px] max-h-[300px]">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted text-foreground rounded-2xl rounded-bl-md px-4 py-2 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Anna is typing...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions - Show only if few messages */}
          {messages.length <= 2 && (
            <div className="px-4 py-2 border-t flex gap-2 flex-wrap">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => handleQuickAction(action.prompt)}
                  disabled={isLoading}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-3 border-t flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="px-4 py-2 border-t bg-muted/30 text-center">
            <p className="text-xs text-muted-foreground">
              AI-powered • Available 24/7 • 
              <a href="tel:1-866-797-3332" className="text-primary hover:underline ml-1">
                Or call us
              </a>
            </p>
          </div>
        </>
      )}
    </div>
  )
}
