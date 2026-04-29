// Typesense client configuration for Planet Motors
// Uses SDN endpoint with individual node fallbacks for HA
//
// NOTE: All process.env reads are done INSIDE functions (not at module level)
// so Vercel serverless functions always see runtime env vars, not build-time snapshots.

import { Client } from "typesense"
import type { CollectionCreateSchema } from "typesense/lib/Typesense/Collections"
import type { NodeConfiguration } from "typesense/lib/Typesense/Configuration"

const DEFAULT_NODE_HOSTS = [
  "dptb8xe3mkuc45snp-1.a2.typesense.net",
  "dptb8xe3mkuc45snp-2.a2.typesense.net",
  "dptb8xe3mkuc45snp-3.a2.typesense.net",
]

function getHost(): string | undefined {
  return process.env.TYPESENSE_HOST || process.env.NEXT_PUBLIC_TYPESENSE_HOST
}

function getAdminKey(): string | undefined {
  return process.env.TYPESENSE_API_KEY
}

function getSearchKey(): string | undefined {
  // Prefer the scoped search-only key; only fall back to the admin key on
  // the server where it is never exposed to the browser.
  if (process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_KEY) {
    return process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_KEY
  }
  if (globalThis.window === undefined) {
    return process.env.TYPESENSE_API_KEY
  }
  return undefined
}

function getNodes(): NodeConfiguration[] {
  const envNodes = process.env.TYPESENSE_NODES
  const hosts = envNodes
    ? envNodes.split(",").map((h) => h.trim()).filter(Boolean)
    : DEFAULT_NODE_HOSTS

  return hosts.map((host) => ({ host, port: 443, protocol: "https" as const }))
}

/** Whether Typesense is configured (env vars present) — reads at call time */
export function isTypesenseConfigured(): boolean {
  return !!(getHost() && (getAdminKey() || getSearchKey()))
}

/** Admin client (server-side only — uses admin API key for indexing) */
export function getAdminClient(): Client | null {
  const host = getHost()
  const apiKey = getAdminKey()
  if (!host || !apiKey) return null

  return new Client({
    nearestNode: { host, port: 443, protocol: "https" },
    nodes: getNodes(),
    apiKey,
    connectionTimeoutSeconds: 5,
    retryIntervalSeconds: 0.1,
    numRetries: 3,
  })
}

/** Search-only client (safe for client-side / API routes doing reads) */
export function getSearchClient(): Client | null {
  const host = getHost()
  const key = getSearchKey()
  if (!host || !key) return null

  return new Client({
    nearestNode: { host, port: 443, protocol: "https" },
    nodes: getNodes(),
    apiKey: key,
    connectionTimeoutSeconds: 5,
    retryIntervalSeconds: 0.1,
    numRetries: 3,
  })
}

/** Typesense collection name for vehicles */
export const VEHICLES_COLLECTION = "vehicles"

/** Vehicle collection schema definition */
export const VEHICLES_SCHEMA: CollectionCreateSchema = {
  name: VEHICLES_COLLECTION,
  fields: [
    { name: "id", type: "string" },
    { name: "stock_number", type: "string" },
    { name: "year", type: "int32", facet: true, sort: true },
    { name: "make", type: "string", facet: true },
    { name: "model", type: "string", facet: true },
    { name: "trim", type: "string", optional: true },
    { name: "body_style", type: "string", facet: true, optional: true },
    { name: "exterior_color", type: "string", optional: true },
    { name: "price", type: "int64", facet: true, sort: true },
    { name: "mileage", type: "int32", sort: true },
    { name: "drivetrain", type: "string", facet: true, optional: true },
    { name: "fuel_type", type: "string", facet: true, optional: true },
    { name: "transmission", type: "string", optional: true },
    { name: "engine", type: "string", optional: true },
    { name: "is_ev", type: "bool", facet: true },
    { name: "is_certified", type: "bool", facet: true },
    { name: "status", type: "string", facet: true },
    { name: "primary_image_url", type: "string", optional: true },
    { name: "description", type: "string", optional: true },
    { name: "vin", type: "string", optional: true },
    { name: "location", type: "string", optional: true },
    { name: "created_at", type: "int64", sort: true, optional: true },
  ],
  default_sorting_field: "created_at",
  token_separators: ["-", "/"],
}
