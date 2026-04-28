"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Share2, Check } from "lucide-react"
import { FacebookIcon, TwitterIcon, LinkedinIcon } from "@/components/ui/brand-icons"

interface BlogShareButtonsProps {
  title: string
  url: string
}

export function BlogShareButtons({ title, url }: Readonly<BlogShareButtonsProps>) {
  const [copied, setCopied] = useState(false)

  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // S1874 — document.execCommand is deprecated; we no longer try to fall
      // back to it. Modern browsers all expose navigator.clipboard, and on
      // the rare permission denial the user can still long-press the URL.
    }
  }

  const openShare = (shareUrl: string) => {
    globalThis.open(shareUrl, "_blank", "width=600,height=400,noopener,noreferrer")
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <span className="font-semibold">Share this article:</span>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          aria-label="Share on Facebook"
          onClick={() => openShare(shareLinks.facebook)}
        >
          <FacebookIcon className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="Share on X (Twitter)"
          onClick={() => openShare(shareLinks.twitter)}
        >
          <TwitterIcon className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="Share on LinkedIn"
          onClick={() => openShare(shareLinks.linkedin)}
        >
          <LinkedinIcon className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label={copied ? "Link copied!" : "Copy link"}
          onClick={handleCopyLink}
          className={copied ? "text-green-600 border-green-600" : ""}
        >
          {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  )
}
