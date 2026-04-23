// Typesense client configuration for Planet Motors
// Uses SDN endpoint with individual node fallbacks for HA

import { Client } from "typesense"
import type { CollectionCreateSchema } from "typesense/lib/Typesense/Collections"
import type { NodeConfiguration } from "typesense/lib/Typesense/Configuration"

const TYPESENSE_HOST = process.env.TYPESENSE_HOST || process.env.NEXT_PUBLIC_TYPESENSE_HOST
const TYPESENSE_API_KEY = process.env.TYPESENSE_API_KEY
const TYPESENSE_SEARCH_KEY = process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_KEY

/**
 * Build the `nodes` array from environment or fall back to hardcoded defaults.
 *
 * Set `TYPESENSE_NODES` to a comma-separated list of hostnames, e.g.:
 *   TYPESENSE_NODES=node1.a2.typesense.net,node2.a2.typesense.net,node3.a2.typesense.net
 */
const DEFAULT_NODE_HOSTS = [
  "dptb8xe3mkuc45snp-1.a2.typesense.net",
  "dptb8xe3mkuc45snp-2.a2.typesense.net",
  "dptb8xe3mkuc45snp-3.a2.typesense.net",
]

function getNodes(): NodeConfiguration[] {
  const envNodes = process.env.TYPESENSE_NODES
  const hosts = envNodes
    ? envNodes.split(",").map((h) => h.trim()).filter(Boolean)
    : DEFAULT_NODE_HOSTS

  return hosts.map((host) => ({ host, port: 443, protocol: "https" as const }))
}

/** Whether Typesense is configured (env vars present) */
export function isTypesenseConfigured(): boolean {
  return !!(TYPESENSE_HOST && (TYPESENSE_API_KEY || TYPESENSE_SEARCH_KEY))
}

/** Admin client (server-side only — uses admin API key for indexing) */
let _adminClient: Client | null = null

export function getAdminClient(): Client | null {
  if (!TYPESENSE_HOST || !TYPESENSE_API_KEY) return null
  if (_adminClient) return _adminClient

  _adminClient = new Client({
    nearestNode: { host: TYPESENSE_HOST, port: 443, protocol: "https" },
    nodes: getNodes(),
    apiKey: TYPESENSE_API_KEY,
    connectionTimeoutSeconds: 5,
    retryIntervalSeconds: 0.1,
    numRetries: 3,
  })

  return _adminClient
}

/** Search-only client (safe for client-side / API routes doing reads) */
let _searchClient: Client | null = null

export function getSearchClient(): Client | null {
  const key = TYPESENSE_SEARCH_KEY || TYPESENSE_API_KEY
  if (!TYPESENSE_HOST || !key) return null
  if (_searchClient) return _searchClient

  _searchClient = new Client({
    nearestNode: { host: TYPESENSE_HOST, port: 443, protocol: "https" },
    nodes: getNodes(),
    apiKey: key,
    connectionTimeoutSeconds: 5,
    retryIntervalSeconds: 0.1,
    numRetries: 3,
  })

  return _searchClient
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
