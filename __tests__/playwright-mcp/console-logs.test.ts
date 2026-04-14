import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

// The 25 console log files added in this PR
const PR_LOG_FILES = [
  'console-2026-04-14T06-48-08-164Z.log',
  'console-2026-04-14T06-48-33-024Z.log',
  'console-2026-04-14T07-04-44-012Z.log',
  'console-2026-04-14T07-08-28-814Z.log',
  'console-2026-04-14T07-17-34-416Z.log',
  'console-2026-04-14T07-26-24-344Z.log',
  'console-2026-04-14T07-38-01-704Z.log',
  'console-2026-04-14T07-40-05-997Z.log',
  'console-2026-04-14T07-40-41-616Z.log',
  'console-2026-04-14T07-44-14-408Z.log',
  'console-2026-04-14T07-46-24-083Z.log',
  'console-2026-04-14T07-48-47-619Z.log',
  'console-2026-04-14T07-49-57-272Z.log',
  'console-2026-04-14T07-51-32-235Z.log',
  'console-2026-04-14T12-50-30-167Z.log',
  'console-2026-04-14T12-50-50-275Z.log',
  'console-2026-04-14T12-50-59-861Z.log',
  'console-2026-04-14T12-51-19-759Z.log',
  'console-2026-04-14T12-54-52-695Z.log',
  'console-2026-04-14T12-55-15-532Z.log',
  'console-2026-04-14T13-00-08-189Z.log',
  'console-2026-04-14T13-02-41-753Z.log',
  'console-2026-04-14T13-05-40-857Z.log',
  'console-2026-04-14T13-06-00-554Z.log',
  'console-2026-04-14T13-07-19-485Z.log',
]

const LOGS_DIR = path.resolve(__dirname, '../../.playwright-mcp')

// Valid log levels produced by Playwright's console interception
const VALID_LOG_LEVELS = new Set(['LOG', 'ERROR', 'WARNING', 'INFO'])

// Matches a primary log entry line: [  <ms>ms] [LEVEL] <message>
const LOG_LINE_REGEX = /^\[\s*(\d+)ms\] \[(LOG|ERROR|WARNING|INFO)\] /

// Matches the file name format: console-<ISO-date-with-dashes>Z.log
const LOG_FILENAME_REGEX =
  /^console-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.log$/

/**
 * Parse a log file into an array of primary log entries (lines beginning with a timestamp).
 * Continuation lines (e.g. stack trace lines) are attached to the preceding entry.
 */
function parseLogFile(content: string): Array<{
  timestampMs: number
  level: string
  rawLine: string
}> {
  const entries: Array<{ timestampMs: number; level: string; rawLine: string }> =
    []

  for (const line of content.split('\n')) {
    const match = LOG_LINE_REGEX.exec(line)
    if (match) {
      entries.push({
        timestampMs: parseInt(match[1], 10),
        level: match[2],
        rawLine: line,
      })
    }
    // non-matching lines are continuation lines (stack traces, etc.) — ignored here
  }

  return entries
}

describe('Playwright MCP console log files — PR additions', () => {
  describe('file presence and naming convention', () => {
    it('all 25 PR log files exist in .playwright-mcp directory', () => {
      for (const filename of PR_LOG_FILES) {
        const fullPath = path.join(LOGS_DIR, filename)
        expect(fs.existsSync(fullPath), `Expected ${filename} to exist`).toBe(
          true
        )
      }
    })

    it('every added file name matches the expected naming pattern', () => {
      for (const filename of PR_LOG_FILES) {
        expect(
          LOG_FILENAME_REGEX.test(filename),
          `${filename} does not match console-<ISO-datetime-dashed>Z.log`
        ).toBe(true)
      }
    })

    it('all 25 files are non-empty', () => {
      for (const filename of PR_LOG_FILES) {
        const fullPath = path.join(LOGS_DIR, filename)
        const stat = fs.statSync(fullPath)
        expect(stat.size, `${filename} is empty`).toBeGreaterThan(0)
      }
    })

    it('each file contains at least one log entry line', () => {
      for (const filename of PR_LOG_FILES) {
        const content = fs.readFileSync(path.join(LOGS_DIR, filename), 'utf-8')
        const entries = parseLogFile(content)
        expect(
          entries.length,
          `${filename} has no parseable log entries`
        ).toBeGreaterThan(0)
      }
    })
  })

  describe('log entry format', () => {
    it('every log entry timestamp is a non-negative integer', () => {
      for (const filename of PR_LOG_FILES) {
        const content = fs.readFileSync(path.join(LOGS_DIR, filename), 'utf-8')
        const entries = parseLogFile(content)
        for (const entry of entries) {
          expect(
            entry.timestampMs,
            `${filename}: invalid timestamp on: ${entry.rawLine}`
          ).toBeGreaterThanOrEqual(0)
          expect(
            Number.isInteger(entry.timestampMs),
            `${filename}: non-integer timestamp on: ${entry.rawLine}`
          ).toBe(true)
        }
      }
    })

    it('every log level is one of LOG, ERROR, WARNING, or INFO', () => {
      for (const filename of PR_LOG_FILES) {
        const content = fs.readFileSync(path.join(LOGS_DIR, filename), 'utf-8')
        const entries = parseLogFile(content)
        for (const entry of entries) {
          expect(
            VALID_LOG_LEVELS.has(entry.level),
            `${filename}: unknown level "${entry.level}" on: ${entry.rawLine}`
          ).toBe(true)
        }
      }
    })

    it('timestamps within each file are monotonically non-decreasing', () => {
      for (const filename of PR_LOG_FILES) {
        const content = fs.readFileSync(path.join(LOGS_DIR, filename), 'utf-8')
        const entries = parseLogFile(content)
        for (let i = 1; i < entries.length; i++) {
          expect(
            entries[i].timestampMs,
            `${filename}: timestamp decreased at entry ${i}`
          ).toBeGreaterThanOrEqual(entries[i - 1].timestampMs)
        }
      }
    })

    it('each primary log entry line starts with the bracket-timestamp pattern', () => {
      for (const filename of PR_LOG_FILES) {
        const content = fs.readFileSync(path.join(LOGS_DIR, filename), 'utf-8')
        const entries = parseLogFile(content)
        for (const entry of entries) {
          expect(
            entry.rawLine,
            `${filename}: entry does not start with [<ms>ms]`
          ).toMatch(/^\[\s*\d+ms\]/)
        }
      }
    })
  })

  describe('log level distribution', () => {
    it('all four log levels appear across the full set of added log files', () => {
      const seenLevels = new Set<string>()
      for (const filename of PR_LOG_FILES) {
        const content = fs.readFileSync(path.join(LOGS_DIR, filename), 'utf-8')
        for (const entry of parseLogFile(content)) {
          seenLevels.add(entry.level)
        }
      }
      expect(seenLevels.has('LOG')).toBe(true)
      expect(seenLevels.has('ERROR')).toBe(true)
      expect(seenLevels.has('WARNING')).toBe(true)
      expect(seenLevels.has('INFO')).toBe(true)
    })

    it('error-level entries exist in the PR log set (expected from dev-server 500s and auth errors)', () => {
      let errorCount = 0
      for (const filename of PR_LOG_FILES) {
        const content = fs.readFileSync(path.join(LOGS_DIR, filename), 'utf-8')
        errorCount += parseLogFile(content).filter(
          (e) => e.level === 'ERROR'
        ).length
      }
      expect(errorCount).toBeGreaterThan(0)
    })
  })

  describe('specific known content from PR diff', () => {
    it('console-2026-04-14T06-48-08-164Z.log contains the clutch.ca production log entry', () => {
      const content = fs.readFileSync(
        path.join(LOGS_DIR, 'console-2026-04-14T06-48-08-164Z.log'),
        'utf-8'
      )
      expect(content).toContain('clutch_production@13.0.259')
    })

    it('console-2026-04-14T06-48-08-164Z.log contains a 502 API error', () => {
      const content = fs.readFileSync(
        path.join(LOGS_DIR, 'console-2026-04-14T06-48-08-164Z.log'),
        'utf-8'
      )
      expect(content).toContain('502')
      expect(content).toContain('[ERROR]')
    })

    it('console-2026-04-14T06-48-33-024Z.log contains a GSI FedCM error', () => {
      const content = fs.readFileSync(
        path.join(LOGS_DIR, 'console-2026-04-14T06-48-33-024Z.log'),
        'utf-8'
      )
      expect(content).toContain('GSI_LOGGER')
      expect(content).toContain('FedCM')
    })

    it('Next.js dev-server logs contain NEXT_PUBLIC_SUPABASE_URL error', () => {
      // Multiple files captured this error during dev session
      const filesWithSupabaseError = [
        'console-2026-04-14T07-04-44-012Z.log',
        'console-2026-04-14T07-08-28-814Z.log',
        'console-2026-04-14T07-17-34-416Z.log',
      ]
      for (const filename of filesWithSupabaseError) {
        const content = fs.readFileSync(
          path.join(LOGS_DIR, filename),
          'utf-8'
        )
        expect(
          content,
          `${filename} should contain SUPABASE_URL error`
        ).toContain('NEXT_PUBLIC_SUPABASE_URL')
      }
    })

    it('console-2026-04-14T07-17-34-416Z.log contains auth client initialization failure', () => {
      const content = fs.readFileSync(
        path.join(LOGS_DIR, 'console-2026-04-14T07-17-34-416Z.log'),
        'utf-8'
      )
      expect(content).toContain('Failed to initialize auth client')
      expect(content).toContain('Missing Supabase anon key')
    })

    it('console-2026-04-14T07-38-01-704Z.log contains Stripe initialization error', () => {
      const content = fs.readFileSync(
        path.join(LOGS_DIR, 'console-2026-04-14T07-38-01-704Z.log'),
        'utf-8'
      )
      expect(content).toContain('IntegrationError')
      expect(content).toContain('Stripe()')
      expect(content).toContain('publishable key')
    })

    it('console-2026-04-14T07-38-01-704Z.log contains async Client Component React error for Footer', () => {
      const content = fs.readFileSync(
        path.join(LOGS_DIR, 'console-2026-04-14T07-38-01-704Z.log'),
        'utf-8'
      )
      expect(content).toContain('async Client Component')
      expect(content).toContain('<Footer>')
    })

    it('console-2026-04-14T07-38-01-704Z.log contains uncached promise React errors', () => {
      const content = fs.readFileSync(
        path.join(LOGS_DIR, 'console-2026-04-14T07-38-01-704Z.log'),
        'utf-8'
      )
      expect(content).toContain('uncached promise')
    })

    it('console-2026-04-14T07-49-57-272Z.log contains navigation to /inventory', () => {
      const content = fs.readFileSync(
        path.join(LOGS_DIR, 'console-2026-04-14T07-49-57-272Z.log'),
        'utf-8'
      )
      expect(content).toContain('/inventory')
    })

    it('console-2026-04-14T07-49-57-272Z.log contains navigation to /financing', () => {
      const content = fs.readFileSync(
        path.join(LOGS_DIR, 'console-2026-04-14T07-49-57-272Z.log'),
        'utf-8'
      )
      expect(content).toContain('/financing')
    })

    it('console-2026-04-14T07-49-57-272Z.log contains unauthenticated checkout redirect to /auth/login', () => {
      const content = fs.readFileSync(
        path.join(LOGS_DIR, 'console-2026-04-14T07-49-57-272Z.log'),
        'utf-8'
      )
      expect(content).toContain('/checkout/test-id')
      expect(content).toContain('/auth/login')
      expect(content).toContain('redirectTo')
    })

    it('Vercel Analytics and Speed Insights debug logs appear in multiple PR files', () => {
      const filesExpectingVercelLogs = [
        'console-2026-04-14T07-17-34-416Z.log',
        'console-2026-04-14T07-26-24-344Z.log',
        'console-2026-04-14T07-38-01-704Z.log',
        'console-2026-04-14T07-40-05-997Z.log',
        'console-2026-04-14T07-40-41-616Z.log',
        'console-2026-04-14T07-44-14-408Z.log',
      ]
      for (const filename of filesExpectingVercelLogs) {
        const content = fs.readFileSync(
          path.join(LOGS_DIR, filename),
          'utf-8'
        )
        expect(content, `${filename} should contain Vercel Analytics log`).toContain(
          'Vercel Web Analytics'
        )
      }
    })

    it('HMR connected messages appear in dev-session log files', () => {
      const devFiles = [
        'console-2026-04-14T07-04-44-012Z.log',
        'console-2026-04-14T07-08-28-814Z.log',
        'console-2026-04-14T07-17-34-416Z.log',
      ]
      for (const filename of devFiles) {
        const content = fs.readFileSync(
          path.join(LOGS_DIR, filename),
          'utf-8'
        )
        expect(content, `${filename} should contain HMR connected`).toContain(
          '[HMR] connected'
        )
      }
    })

    it('Fast Refresh rebuild/done pairs appear in log files that captured code changes', () => {
      // Fast Refresh logs follow the format: rebuilding ... done in Xms
      const filesWithFastRefresh = [
        'console-2026-04-14T07-17-34-416Z.log',
        'console-2026-04-14T07-38-01-704Z.log',
        'console-2026-04-14T07-40-41-616Z.log',
      ]
      for (const filename of filesWithFastRefresh) {
        const content = fs.readFileSync(
          path.join(LOGS_DIR, filename),
          'utf-8'
        )
        expect(content, `${filename} missing [Fast Refresh] rebuilding`).toContain(
          '[Fast Refresh] rebuilding'
        )
        expect(content, `${filename} missing [Fast Refresh] done`).toContain(
          '[Fast Refresh] done in'
        )
      }
    })
  })

  describe('boundary and negative cases', () => {
    it('no log file in the PR set contains lines with an unrecognized bracket-level pattern', () => {
      // Validates no typo levels like [WARN] or [VERBOSE] slipped in
      const badLevelRegex = /^\[\s*\d+ms\] \[(?!LOG|ERROR|WARNING|INFO)[A-Z]+\]/
      for (const filename of PR_LOG_FILES) {
        const content = fs.readFileSync(path.join(LOGS_DIR, filename), 'utf-8')
        for (const line of content.split('\n')) {
          expect(
            badLevelRegex.test(line),
            `${filename}: unexpected log level in: ${line}`
          ).toBe(false)
        }
      }
    })

    it('the smallest log file (3-line carvana session) still has valid entries', () => {
      // console-2026-04-14T06-48-33-024Z.log has only 3 lines
      const filename = 'console-2026-04-14T06-48-33-024Z.log'
      const content = fs.readFileSync(path.join(LOGS_DIR, filename), 'utf-8')
      const entries = parseLogFile(content)
      expect(entries.length).toBe(3)
      expect(entries[0].level).toBe('WARNING')
      expect(entries[1].level).toBe('ERROR')
      expect(entries[2].level).toBe('ERROR')
    })

    it('the largest log in the PR set (07-49-57 with 235 lines) parses without error', () => {
      const filename = 'console-2026-04-14T07-49-57-272Z.log'
      const content = fs.readFileSync(path.join(LOGS_DIR, filename), 'utf-8')
      const entries = parseLogFile(content)
      // Should have many parseable entries (actual log lines, not stack traces)
      expect(entries.length).toBeGreaterThan(30)
    })

    it('log files do not contain binary/null bytes (are valid UTF-8 text)', () => {
      for (const filename of PR_LOG_FILES) {
        const content = fs.readFileSync(path.join(LOGS_DIR, filename), 'utf-8')
        expect(content.includes('\0'), `${filename} contains null bytes`).toBe(
          false
        )
      }
    })

    it('no PR log file has a future timestamp beyond the session duration (sanity upper bound of 1 hour)', () => {
      const ONE_HOUR_MS = 3_600_000
      for (const filename of PR_LOG_FILES) {
        const content = fs.readFileSync(path.join(LOGS_DIR, filename), 'utf-8')
        for (const entry of parseLogFile(content)) {
          expect(
            entry.timestampMs,
            `${filename}: implausibly large timestamp ${entry.timestampMs}ms`
          ).toBeLessThanOrEqual(ONE_HOUR_MS)
        }
      }
    })
  })
})