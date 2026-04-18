"use client"

import { useState } from "react"
import {
  Shield, Globe, Mail, Bell, Database,
  ExternalLink, Info, DollarSign
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ConfigItem {
  label: string
  description: string
  envVar: string
  defaultValue?: string
  sensitive?: boolean
}

interface ConfigSection {
  title: string
  description: string
  icon: typeof Shield
  items: ConfigItem[]
}

const configSections: ConfigSection[] = [
  {
    title: "Admin Access",
    description: "Control who can access the admin panel",
    icon: Shield,
    items: [
      {
        label: "Admin Emails",
        description: "Comma-separated list of email addresses with admin access. Set via ADMIN_EMAILS environment variable.",
        envVar: "ADMIN_EMAILS",
        defaultValue: "admin@planetmotors.ca, toni@planetmotors.ca",
      },
    ],
  },
  {
    title: "Supabase",
    description: "Database and authentication configuration",
    icon: Database,
    items: [
      {
        label: "Supabase URL",
        envVar: "NEXT_PUBLIC_SUPABASE_URL",
        description: "Public Supabase project URL used for auth and data queries.",
      },
      {
        label: "Supabase Anon Key",
        envVar: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        description: "Public anonymous key for client-side Supabase operations.",
      },
      {
        label: "Service Role Key",
        envVar: "SUPABASE_SERVICE_ROLE_KEY",
        description: "Server-side service role key for admin operations. Never expose to client.",
        sensitive: true,
      },
    ],
  },
  {
    title: "Site Configuration",
    description: "General site settings",
    icon: Globe,
    items: [
      {
        label: "Site URL",
        envVar: "NEXT_PUBLIC_SITE_URL",
        description: "Public URL of the website (used for SEO, OpenGraph, sitemap).",
      },
      {
        label: "Typesense Host",
        envVar: "NEXT_PUBLIC_TYPESENSE_HOST",
        description: "Typesense search server hostname.",
      },
      {
        label: "Typesense Search Key",
        envVar: "NEXT_PUBLIC_TYPESENSE_SEARCH_ONLY_API_KEY",
        description: "Typesense search-only API key for client-side queries.",
      },
    ],
  },
  {
    title: "Integrations",
    description: "Third-party service connections",
    icon: ExternalLink,
    items: [
      {
        label: "Stripe Secret Key",
        envVar: "STRIPE_SECRET_KEY",
        description: "Stripe API secret key for payment processing.",
        sensitive: true,
      },
      {
        label: "Stripe Webhook Secret",
        envVar: "STRIPE_WEBHOOK_SECRET",
        description: "Stripe webhook endpoint signing secret.",
        sensitive: true,
      },
      {
        label: "Sanity Project ID",
        envVar: "NEXT_PUBLIC_SANITY_PROJECT_ID",
        description: "Sanity CMS project identifier.",
      },
      {
        label: "Azure Communication Services",
        envVar: "AZURE_COMMUNICATION_CONNECTION_STRING",
        description: "Azure Communication Services connection string for live video tours.",
        sensitive: true,
      },
    ],
  },
  {
    title: "Email & Notifications",
    description: "Email service configuration",
    icon: Mail,
    items: [
      {
        label: "Resend API Key",
        envVar: "RESEND_API_KEY",
        description: "Resend.com API key for transactional emails.",
        sensitive: true,
      },
      {
        label: "Email From Address",
        envVar: "EMAIL_FROM",
        description: "Default sender email address for notifications.",
      },
    ],
  },
]

/**
 * Renders the Admin Settings page showing environment variable configuration grouped into collapsible sections and a set of quick links.
 *
 * The UI includes an informational notice about configuring environment variables via the hosting dashboard, a list of configurable sections where each section can be expanded to reveal variable details (label, description, env var name, default, and a sensitive badge), and a Quick Links card with external dashboards.
 *
 * @returns The JSX element for the admin settings page.
 */
export default function AdminSettingsPage() {
  const [expandedSection, setExpandedSection] = useState<string | null>("Admin Access")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Environment configuration and integrations</p>
      </div>

      {/* Important Notice */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-blue-900">Environment Variables</p>
              <p className="text-sm text-blue-700 mt-1">
                Settings are configured via environment variables in your hosting provider
                (Netlify, Vercel, etc.). Changes require a redeploy to take effect.
                This page shows the current configuration reference — to update values,
                edit them in your hosting dashboard.
              </p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" className="text-blue-700 border-blue-300" asChild>
                  <a href="https://app.netlify.com" target="_blank" rel="noopener noreferrer">
                    Netlify Dashboard
                    <ExternalLink className="w-3.5 h-3.5 ml-1" />
                  </a>
                </Button>
                <Button size="sm" variant="outline" className="text-blue-700 border-blue-300" asChild>
                  <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer">
                    Vercel Dashboard
                    <ExternalLink className="w-3.5 h-3.5 ml-1" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Config Sections */}
      {configSections.map((section) => {
        const isExpanded = expandedSection === section.title
        const SectionIcon = section.icon

        return (
          <Card key={section.title}>
            <CardHeader
              className="cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setExpandedSection(isExpanded ? null : section.title)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <SectionIcon className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </div>
                <Badge variant="outline">{section.items.length} vars</Badge>
              </div>
            </CardHeader>
            {isExpanded && (
              <CardContent className="border-t">
                <div className="divide-y">
                  {section.items.map((item) => (
                    <div key={item.envVar} className="py-4 first:pt-2 last:pb-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">{item.label}</p>
                            {item.sensitive && (
                              <Badge className="bg-red-100 text-red-700 text-xs">sensitive</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>
                          <code className="text-xs bg-gray-100 px-2 py-0.5 rounded mt-2 inline-block text-gray-600">
                            {item.envVar}
                          </code>
                          {item.defaultValue && (
                            <p className="text-xs text-gray-400 mt-1">
                              Default: <code className="bg-gray-50 px-1 rounded">{item.defaultValue}</code>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        )
      })}

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Quick Links
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <Database className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-sm">Supabase Dashboard</p>
                <p className="text-xs text-gray-500">Database, Auth, Storage</p>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
            </a>
            <a
              href="https://dashboard.stripe.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <DollarSign className="w-5 h-5 text-purple-600" />
              <div>
                <p className="font-medium text-sm">Stripe Dashboard</p>
                <p className="text-xs text-gray-500">Payments, Subscriptions</p>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
            </a>
            <a
              href="https://www.sanity.io/manage"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <Globe className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-medium text-sm">Sanity Studio</p>
                <p className="text-xs text-gray-500">Content Management</p>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
