"use client"

import { useEffect, useState } from "react"
import { Share2, Copy, Check, Facebook, Twitter } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

interface ShareButtonProps {
  title?: string
  text?: string
  variant?: "outline" | "ghost" | "default"
  size?: "sm" | "default" | "lg" | "icon"
  className?: string
}

export function ShareButton({
  title = "Planet Motors - The Smarter Way to Buy or Sell Your Car",
  text = "Check out Planet Motors — Ontario's trusted destination for premium pre-owned vehicles.",
  variant = "outline",
  size = "sm",
  className,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false)
  const [isShareSupported, setIsShareSupported] = useState(false)

  useEffect(() => {
    setIsShareSupported(typeof navigator !== "undefined" && !!navigator.share)
  }, [])

  const getUrl = () => typeof window !== "undefined" ? window.location.href : ""

  async function handleNativeShare() {
    try {
      await navigator.share({ title, text, url: getUrl() })
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        toast.error("Sharing failed")
      }
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(getUrl())
      setCopied(true)
      toast.success("Link copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Failed to copy link")
    }
  }

  function handleFacebook() {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getUrl())}`,
      "_blank",
      "noopener,noreferrer,width=600,height=400"
    )
  }

  function handleTwitter() {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(getUrl())}`,
      "_blank",
      "noopener,noreferrer,width=600,height=400"
    )
  }

  // Use native share on supported devices (mainly mobile)
  if (isShareSupported) {
    return (
      <Button variant={variant} size={size} className={className} onClick={handleNativeShare}>
        <Share2 className="w-4 h-4 mr-1.5" />
        Share
      </Button>
    )
  }

  // Dropdown fallback for desktop
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Share2 className="w-4 h-4 mr-1.5" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleCopyLink}>
          {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
          {copied ? "Copied!" : "Copy Link"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleFacebook}>
          <Facebook className="w-4 h-4 mr-2" />
          Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleTwitter}>
          <Twitter className="w-4 h-4 mr-2" />
          X (Twitter)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
