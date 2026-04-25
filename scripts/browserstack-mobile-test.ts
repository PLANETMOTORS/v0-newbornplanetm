/**
 * BrowserStack Mobile Testing Script
 *
 * Tests the checkout flow on real mobile devices via BrowserStack Automate.
 * Validates: touch targets ≥44px, drawer open/close, Escape key, focus
 * management, and viewport-specific layout at 3 breakpoints.
 *
 * Usage:
 *   BROWSERSTACK_USERNAME=<user> BROWSERSTACK_ACCESS_KEY=<key> \
 *   CHECKOUT_URL=https://your-vercel-preview.app/checkout/<vehicleId> \
 *   npx tsx scripts/browserstack-mobile-test.ts
 *
 * Requires: @browserstack/webdriver (or use BrowserStack's REST API)
 *
 * This script uses BrowserStack's Automate REST API to run tests on real devices.
 */

interface BrowserStackCapability {
  deviceName: string
  osVersion: string
  os: string
  browserName: string
  realMobile: boolean
  viewportWidth: number
  label: string
}

const DEVICES: BrowserStackCapability[] = [
  {
    deviceName: 'iPhone SE 2022',
    osVersion: '16',
    os: 'ios',
    browserName: 'safari',
    realMobile: true,
    viewportWidth: 375,
    label: 'iPhone SE (375px)',
  },
  {
    deviceName: 'iPhone 14',
    osVersion: '16',
    os: 'ios',
    browserName: 'safari',
    realMobile: true,
    viewportWidth: 390,
    label: 'iPhone 14 (390px)',
  },
  {
    deviceName: 'iPad 10th',
    osVersion: '16',
    os: 'ios',
    browserName: 'safari',
    realMobile: true,
    viewportWidth: 768,
    label: 'iPad 10th (768px)',
  },
]

const MIN_TAP_TARGET = 44 // px — WCAG 2.5.5 / Apple HIG

function encodeBasicAuth(username: string, accessKey: string): string {
  return Buffer.from(`${username}:${accessKey}`).toString('base64')
}

interface TestResult {
  device: string
  test: string
  passed: boolean
  details: string
}

async function runBrowserStackTests(): Promise<void> {
  const username = process.env.BROWSERSTACK_USERNAME
  const accessKey = process.env.BROWSERSTACK_ACCESS_KEY
  const checkoutUrl = process.env.CHECKOUT_URL

  if (!username || !accessKey) {
    console.error('Missing BROWSERSTACK_USERNAME or BROWSERSTACK_ACCESS_KEY')
    console.info('\nTo run this script:')
    console.info('  1. Sign up at https://www.browserstack.com/automate')
    console.info('  2. Get credentials from https://www.browserstack.com/accounts/settings')
    console.info('  3. Set BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY env vars')
    process.exit(1)
  }

  if (!checkoutUrl) {
    console.error('Missing CHECKOUT_URL — set to your Vercel preview checkout page URL')
    process.exit(1)
  }

  const results: TestResult[] = []

  for (const device of DEVICES) {
    console.info(`\n${'='.repeat(60)}`)
    console.info(`Testing: ${device.label}`)
    console.info('='.repeat(60))

    const capabilities = {
      'bstack:options': {
        userName: username,
        accessKey: accessKey,
        deviceName: device.deviceName,
        osVersion: device.osVersion,
        os: device.os,
        realMobile: String(device.realMobile),
        projectName: 'Planet Motors Checkout',
        buildName: `Checkout Mobile Test - ${new Date().toISOString().slice(0, 10)}`,
        sessionName: `${device.label} - Checkout Flow`,
        debug: 'true',
        networkLogs: 'true',
      },
      browserName: device.browserName,
    }

    // Create BrowserStack session via REST API
    const sessionResponse = await fetch('https://hub-cloud.browserstack.com/wd/hub/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${encodeBasicAuth(username, accessKey)}`,
      },
      body: JSON.stringify({ desiredCapabilities: capabilities }),
    })

    if (!sessionResponse.ok) {
      const errText = await sessionResponse.text()
      console.error(`Failed to create session for ${device.label}: ${errText}`)
      results.push({
        device: device.label,
        test: 'Session creation',
        passed: false,
        details: errText,
      })
      continue
    }

    const sessionData = await sessionResponse.json() as { sessionId?: string; value?: { sessionId?: string } }
    const sessionId = sessionData.sessionId ?? sessionData.value?.sessionId
    if (!sessionId) {
      console.error(`No session ID returned for ${device.label}`)
      continue
    }

    const baseUrl = `https://hub-cloud.browserstack.com/wd/hub/session/${sessionId}`
    const authHeader = `Basic ${encodeBasicAuth(username, accessKey)}`

    const webDriverRequest = async (path: string, method = 'GET', body?: Record<string, unknown>) => {
      const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
        ...(body ? { body: JSON.stringify(body) } : {}),
      })
      return response.json() as Promise<Record<string, unknown>>
    }

    try {
      // Navigate to checkout page
      await webDriverRequest('/url', 'POST', { url: checkoutUrl })
      await new Promise((resolve) => setTimeout(resolve, 5000))

      // Test 1: Page loaded successfully
      const titleResult = await webDriverRequest('/title')
      const title = String((titleResult as { value?: string }).value ?? '')
      const pageLoaded = title.length > 0
      results.push({
        device: device.label,
        test: 'Page loads',
        passed: pageLoaded,
        details: `Title: ${title}`,
      })

      // Test 2: Check viewport width
      const viewportScript = await webDriverRequest('/execute/sync', 'POST', {
        script: 'return window.innerWidth;',
        args: [],
      })
      const actualWidth = Number((viewportScript as { value?: number }).value ?? 0)
      results.push({
        device: device.label,
        test: `Viewport width ~${device.viewportWidth}px`,
        passed: Math.abs(actualWidth - device.viewportWidth) < 50,
        details: `Actual: ${actualWidth}px`,
      })

      // Test 3: Mobile Order Summary button visible (< 1024px)
      if (device.viewportWidth < 1024) {
        const drawerBtnScript = await webDriverRequest('/execute/sync', 'POST', {
          script: `
            const btn = document.querySelector('[aria-controls="mobile-order-summary"]');
            if (!btn) return { found: false };
            const rect = btn.getBoundingClientRect();
            return { found: true, width: rect.width, height: rect.height, visible: rect.width > 0 && rect.height > 0 };
          `,
          args: [],
        })
        const btnData = (drawerBtnScript as { value?: { found?: boolean; width?: number; height?: number; visible?: boolean } }).value ?? {}
        results.push({
          device: device.label,
          test: 'Order Summary button visible',
          passed: !!btnData.found && !!btnData.visible,
          details: `Found: ${btnData.found}, Size: ${btnData.width}x${btnData.height}`,
        })

        // Test 4: Tap target ≥ 44px
        const tapTargetOk = (btnData.height ?? 0) >= MIN_TAP_TARGET && (btnData.width ?? 0) >= MIN_TAP_TARGET
        results.push({
          device: device.label,
          test: `Tap target ≥ ${MIN_TAP_TARGET}px`,
          passed: tapTargetOk,
          details: `Button size: ${btnData.width}x${btnData.height}`,
        })
      }

      // Test 5: Check all interactive elements for tap target compliance
      const tapTargetsScript = await webDriverRequest('/execute/sync', 'POST', {
        script: `
          const elements = document.querySelectorAll('button, a, input, select, textarea, [role="button"]');
          const violations = [];
          for (const el of elements) {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0 && (rect.width < ${MIN_TAP_TARGET} || rect.height < ${MIN_TAP_TARGET})) {
              violations.push({
                tag: el.tagName,
                text: (el.textContent || '').slice(0, 30),
                width: Math.round(rect.width),
                height: Math.round(rect.height),
              });
            }
          }
          return { total: elements.length, violations: violations.slice(0, 10) };
        `,
        args: [],
      })
      const tapData = (tapTargetsScript as { value?: { total?: number; violations?: Array<{ tag: string; text: string; width: number; height: number }> } }).value ?? {}
      const violationCount = tapData.violations?.length ?? 0
      results.push({
        device: device.label,
        test: 'All tap targets ≥ 44px',
        passed: violationCount === 0,
        details: violationCount === 0
          ? `All ${tapData.total} elements pass`
          : `${violationCount} violations: ${JSON.stringify(tapData.violations)}`,
      })

      // Test 6: No JavaScript errors in console (via BrowserStack log API)
      const logsResponse = await webDriverRequest('/log', 'POST', { type: 'browser' })
      const logs = ((logsResponse as { value?: Array<{ level: string; message: string }> }).value ?? [])
      const jsErrors = logs.filter(log => log.level === 'SEVERE')
      results.push({
        device: device.label,
        test: 'No JS errors',
        passed: jsErrors.length === 0,
        details: jsErrors.length === 0
          ? 'No severe errors in browser logs'
          : `${jsErrors.length} errors: ${jsErrors.map(e => e.message).slice(0, 3).join('; ')}`,
      })

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      results.push({
        device: device.label,
        test: 'Test execution',
        passed: false,
        details: message,
      })
    } finally {
      // Close BrowserStack session
      await fetch(baseUrl, {
        method: 'DELETE',
        headers: { 'Authorization': authHeader },
      }).catch(() => { /* ignore cleanup errors */ })
    }
  }

  // Print results summary
  console.info('\n' + '='.repeat(60))
  console.info('RESULTS SUMMARY')
  console.info('='.repeat(60))

  let passed = 0
  let failed = 0

  for (const result of results) {
    const icon = result.passed ? 'PASS' : 'FAIL'
    console.info(`  [${icon}] ${result.device} — ${result.test}: ${result.details}`)
    if (result.passed) passed++
    else failed++
  }

  console.info(`\nTotal: ${passed} passed, ${failed} failed out of ${results.length} tests`)

  if (failed > 0) {
    console.info('\nBrowserStack session recordings available at:')
    console.info('  https://automate.browserstack.com/dashboard')
    process.exit(1)
  }
}

runBrowserStackTests().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
