/**
 * lib/monitoring/betterstack-sync.ts
 *
 * Pure, dependency-injected logic for the Better Stack monitor provisioner.
 *
 * The CLI entrypoint at `scripts/setup-betterstack-monitors.ts` is a thin
 * shim that wires `process.env` and the global `fetch` into `runCli()` here.
 * Keeping the logic in `lib/` gives us full unit-test coverage and lets us
 * reuse the same sync from a future cron / Inngest job without duplicating
 * the API contract.
 *
 * Idempotency contract:
 *   - Match key:  pronounceable_name + url   (we never change a name)
 *   - Action:     create when missing, PATCH when present
 *   - Never deletes — operators do that by hand in the dashboard.
 */

const API_BASE = "https://uptime.betterstack.com/api/v2"
const DEFAULT_BASE_URL = "https://www.planetmotors.ca"

export interface MonitorSpec {
  /** Stable identifier used to match against existing monitors. */
  pronounceable_name: string
  url: string
  /** Better Stack monitor type. */
  monitor_type: "status" | "expected_status_code" | "keyword" | "ping"
  /** Polling cadence in seconds. */
  check_frequency: number
  /** When `monitor_type === "expected_status_code"`. */
  expected_status_codes?: number[]
  /** When `monitor_type === "keyword"`. */
  required_keyword?: string
  /** Number of failed checks before the monitor is marked down. */
  confirmation_period?: number
  /** Send notifications when down. */
  email?: boolean
  sms?: boolean
}

export interface MonitorRecord {
  id: string
  attributes: { pronounceable_name?: string; url: string }
}

export interface ListResponse {
  data: MonitorRecord[]
  pagination?: { next?: string | null }
}

export type SyncAction = "created" | "updated"

export interface SyncResult {
  monitor: string
  action: SyncAction
  id: string
}

export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>

export interface SyncDeps {
  fetch: FetchLike
  token: string
  dryRun: boolean
}

/**
 * Normalises an arbitrary base URL down to its origin (scheme + host + port),
 * stripping any trailing slash or path. This is the single guard that makes
 * the idempotency match key (name + url) reliable: passing both
 * `https://x.com` and `https://x.com/` would otherwise produce duplicate
 * monitor URLs that never match each other.
 */
export function normaliseBaseUrl(input: string): string {
  try {
    return new URL(input).origin
  } catch {
    return input.replace(/\/+$/u, "")
  }
}

export function buildMonitors(rawBaseUrl: string): MonitorSpec[] {
  const baseUrl = normaliseBaseUrl(rawBaseUrl)
  return [
    {
      pronounceable_name: "Homepage",
      url: `${baseUrl}/`,
      monitor_type: "keyword",
      required_keyword: "Battery-Health Certified",
      check_frequency: 60,
      confirmation_period: 120,
      email: true,
      sms: true,
    },
    {
      pronounceable_name: "Inventory",
      url: `${baseUrl}/inventory`,
      monitor_type: "expected_status_code",
      expected_status_codes: [200],
      check_frequency: 60,
      confirmation_period: 120,
      email: true,
      sms: false,
    },
    {
      pronounceable_name: "API health probe",
      url: `${baseUrl}/api/health`,
      monitor_type: "keyword",
      required_keyword: '"ok":true',
      check_frequency: 30,
      confirmation_period: 30,
      email: true,
      sms: true,
    },
    {
      pronounceable_name: "Stripe webhook route",
      url: `${baseUrl}/api/webhooks/stripe`,
      monitor_type: "expected_status_code",
      expected_status_codes: [405],
      check_frequency: 300,
      confirmation_period: 600,
      email: true,
      sms: true,
    },
    {
      pronounceable_name: "Financing application",
      url: `${baseUrl}/financing/application`,
      monitor_type: "expected_status_code",
      expected_status_codes: [200],
      check_frequency: 300,
      confirmation_period: 600,
      email: true,
      sms: false,
    },
    {
      pronounceable_name: "Checkout entry",
      url: `${baseUrl}/checkout`,
      monitor_type: "expected_status_code",
      expected_status_codes: [200, 302],
      check_frequency: 300,
      confirmation_period: 600,
      email: true,
      sms: false,
    },
  ]
}

function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  }
}

export async function listExistingMonitors(deps: { fetch: FetchLike; token: string }): Promise<MonitorRecord[]> {
  const all: MonitorRecord[] = []
  let next: string | null = `${API_BASE}/monitors`
  while (next) {
    const res = await deps.fetch(next, { headers: authHeaders(deps.token) })
    if (!res.ok) {
      throw new Error(`Better Stack list failed: HTTP ${res.status}`)
    }
    const json = (await res.json()) as ListResponse
    all.push(...json.data)
    next = json.pagination?.next ?? null
  }
  return all
}

function specsEqual(spec: MonitorSpec, record: MonitorRecord): boolean {
  return record.attributes.pronounceable_name === spec.pronounceable_name
    && record.attributes.url === spec.url
}

async function createMonitor(spec: MonitorSpec, deps: SyncDeps): Promise<string> {
  if (deps.dryRun) return "dry-run"
  const res = await deps.fetch(`${API_BASE}/monitors`, {
    method: "POST",
    headers: authHeaders(deps.token),
    body: JSON.stringify(spec),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Better Stack create "${spec.pronounceable_name}" failed: HTTP ${res.status} — ${text}`)
  }
  const json = (await res.json()) as { data: { id: string } }
  return json.data.id
}

async function updateMonitor(id: string, spec: MonitorSpec, deps: SyncDeps): Promise<void> {
  if (deps.dryRun) return
  const res = await deps.fetch(`${API_BASE}/monitors/${id}`, {
    method: "PATCH",
    headers: authHeaders(deps.token),
    body: JSON.stringify(spec),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Better Stack update "${spec.pronounceable_name}" failed: HTTP ${res.status} — ${text}`)
  }
}

export async function syncMonitor(
  spec: MonitorSpec,
  existing: MonitorRecord[],
  deps: SyncDeps,
): Promise<SyncResult> {
  const match = existing.find((rec) => specsEqual(spec, rec))
  if (!match) {
    const id = await createMonitor(spec, deps)
    return { monitor: spec.pronounceable_name, action: "created", id }
  }
  await updateMonitor(match.id, spec, deps)
  return { monitor: spec.pronounceable_name, action: "updated", id: match.id }
}

export async function syncAllMonitors(specs: MonitorSpec[], deps: SyncDeps): Promise<SyncResult[]> {
  const existing = await listExistingMonitors({ fetch: deps.fetch, token: deps.token })
  const results: SyncResult[] = []
  for (const spec of specs) {
    results.push(await syncMonitor(spec, existing, deps))
  }
  return results
}

export function formatSummary(results: SyncResult[]): string {
  const lines = results.map(
    (r) => `  ${r.action.padEnd(7)}  ${r.monitor}  (id=${r.id})`,
  )
  const created = results.filter((r) => r.action === "created").length
  const updated = results.filter((r) => r.action === "updated").length
  return [
    "Better Stack monitor sync — summary",
    ...lines,
    `Total: ${results.length} (created=${created}, updated=${updated})`,
  ].join("\n")
}

export interface RunCliOptions {
  env: NodeJS.ProcessEnv
  fetchImpl: FetchLike
  stdout: (chunk: string) => void
  stderr: (chunk: string) => void
}

/**
 * Safely renders an unknown error value into a single-line operator-readable
 * message, never returning the unhelpful `[object Object]` that
 * `String(error)` produces for plain objects. Mirrors the discipline of
 * `lib/safe-coerce.ts` so we don't leak structured payloads to logs.
 */
export function describeError(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  if (typeof error === "number" || typeof error === "boolean") return String(error)
  return "unknown error"
}

export async function runCli(opts: RunCliOptions): Promise<number> {
  const token = opts.env.BETTER_STACK_API_TOKEN
  if (!token) {
    opts.stderr("BETTER_STACK_API_TOKEN is required\n")
    return 2
  }
  const dryRun = opts.env.DRY_RUN === "1"
  const baseUrl = opts.env.BASE_URL ?? DEFAULT_BASE_URL
  const specs = buildMonitors(baseUrl)
  try {
    const results = await syncAllMonitors(specs, { fetch: opts.fetchImpl, token, dryRun })
    opts.stdout(`${formatSummary(results)}\n`)
    return 0
  } catch (error) {
    opts.stderr(`Better Stack sync failed: ${describeError(error)}\n`)
    return 1
  }
}

export { DEFAULT_BASE_URL, API_BASE }
