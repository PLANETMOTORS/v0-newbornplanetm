# Testing VDP Pages & Carfax Integration

## Devin Secrets Needed
- `CARFAX_CLIENT_ID` — Auth0 client ID for Carfax Canada API
- `CARFAX_CLIENT_SECRET` — Auth0 client secret
- `CARFAX_ACCOUNT_NUMBER` — Carfax dealer account number
- `VERCEL_API_TOKEN` — For setting env vars and triggering deploys

## Running the App Locally

1. Install deps: `pnpm install`
2. Build: `pnpm build`
3. Start: `PORT=3000 pnpm start`
4. VDP test URL: `http://localhost:3000/vehicles/{vehicle-id}`

**Important:** After any code change, you MUST run `pnpm build` again before `pnpm start`. Next.js production server serves compiled chunks from `.next/`, not source files. A stale build will serve pre-fix code even though `git log` shows the commit.

### Detecting Stale Builds

If test results don't match expected behavior after a code fix:
1. Check build timestamp: `stat .next/BUILD_ID` or look at build output timestamps
2. Check git commit timestamp: `git log -1 --format=%ci`
3. If build predates commit → stale build. Run `pnpm build` again.
4. Verify compiled chunks contain fix: `grep -r 'yourFunctionName' .next/static/chunks/`
5. Kill old server: `fuser -k 3000/tcp`
6. Restart: `PORT=3000 pnpm start`

## Testing External Links (target="_blank")

React 19 may strip `target="_blank"` from `<a>` tags during hydration/reconciliation. The codebase uses `window.open()` as a workaround.

### Monkey-Patch Technique

To test new-tab behavior without actually opening tabs:

```js
// In browser console — set up capture
window.__testCalls = [];
window.__origOpen = window.open;
window.open = function(...args) { window.__testCalls.push(args); };

// Click the link you want to test

// Verify
console.log('CALLS:', JSON.stringify(window.__testCalls));
console.log('PAGE_URL:', location.href);

// Restore
window.open = window.__origOpen;
```

**Pass criteria:**
- `__testCalls` has exactly 1 entry
- First arg contains the expected external URL
- Second arg is `"_blank"`
- Third arg is `"noopener,noreferrer"`
- `location.href` unchanged (page didn't navigate away)

## Radix UI `Button asChild` Pitfall

Radix UI's `Slot` component (used by `Button asChild`) can swallow event handler props like `onClick`. If you need both a styled button appearance AND an onClick handler on an anchor, use a plain `<a>` tag with Tailwind classes instead of `<Button asChild><a>...</a></Button>`.

## Carfax API Testing

The Carfax Badging API v3 requires TWO auth headers:
- `Authorization: Bearer {token}`
- `Auth0CarfaxCanadaJWTBearer: {token}`

Missing either header returns 401. The token comes from Auth0 client credentials grant with a 2-hour TTL.

Test VIN with known AccidentFree badge: `5YJSA1E64NF476477` (2022 Tesla Model S Plaid)

## Badge SVG Images

`cdn.carfax.ca` must be in `next.config.mjs` `remotePatterns` for `next/image` to load badge SVGs. On local test VMs, the CDN may be unreachable — badge images will show as broken placeholders. This is a network limitation, not a code bug. Verify the `<img>` src URLs are correct instead.

## Carfax Link Locations on VDP

There are 4 Carfax link locations in `components/vdp/carfax-section.tsx`:
1. **Headline badge** — "CARFAX" pill in the Overview row specs (HISTORY column)
2. **Panel button** — "View full CARFAX Vehicle History Report" in Inspect tab
3. **Sidebar link** — "View report" next to "No reported accidents"
4. **Overview badge** — "CARFAX ✓" pill in the Overview tab

All should use `onClick={openCarfaxReport}` which calls `e.preventDefault()` + `window.open()`.
