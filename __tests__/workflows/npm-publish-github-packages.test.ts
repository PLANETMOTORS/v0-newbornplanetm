import { describe, it, expect, beforeAll } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

/**
 * Tests for .github/workflows/npm-publish-github-packages.yml
 *
 * Validates the structure, configuration, and security properties of the
 * GitHub Actions workflow that publishes the package to GitHub Packages.
 *
 * Because the project has no YAML parsing library, these tests read the raw
 * file content and validate it via string/regex checks.  This is intentional
 * and sufficient for a declarative configuration file.
 */

const WORKFLOW_PATH = path.resolve(
  __dirname,
  '../../.github/workflows/npm-publish-github-packages.yml'
)

describe('npm-publish-github-packages.yml – file existence', () => {
  it('exists at the expected path', () => {
    expect(fs.existsSync(WORKFLOW_PATH)).toBe(true)
  })

  it('is not empty', () => {
    const content = fs.readFileSync(WORKFLOW_PATH, 'utf-8')
    expect(content.trim().length).toBeGreaterThan(0)
  })
})

describe('npm-publish-github-packages.yml – workflow metadata', () => {
  let content: string

  beforeAll(() => {
    content = fs.readFileSync(WORKFLOW_PATH, 'utf-8')
  })

  it('declares the workflow name', () => {
    expect(content).toMatch(/^name:\s*.+/m)
  })

  it('sets the workflow name to "Node.js Package"', () => {
    expect(content).toMatch(/^name:\s*Node\.js Package\s*$/m)
  })
})

describe('npm-publish-github-packages.yml – trigger (on)', () => {
  let content: string

  beforeAll(() => {
    content = fs.readFileSync(WORKFLOW_PATH, 'utf-8')
  })

  it('is triggered on the "release" event', () => {
    expect(content).toMatch(/^\s*release:/m)
  })

  it('triggers only when a release is "created"', () => {
    expect(content).toMatch(/types:\s*\[created\]/)
  })

  it('does not trigger on push or pull_request events', () => {
    expect(content).not.toMatch(/^\s*push:/m)
    expect(content).not.toMatch(/^\s*pull_request:/m)
  })
})

describe('npm-publish-github-packages.yml – build job', () => {
  let content: string

  beforeAll(() => {
    content = fs.readFileSync(WORKFLOW_PATH, 'utf-8')
  })

  it('defines a "build" job', () => {
    expect(content).toMatch(/^\s*build:/m)
  })

  it('runs the build job on ubuntu-latest', () => {
    // Capture the block under "build:" and verify its runner
    const buildBlock = content.slice(content.indexOf('  build:'))
    const nextJobIdx = buildBlock.indexOf('\n  ', 1)
    const segment = nextJobIdx > -1 ? buildBlock.slice(0, nextJobIdx) : buildBlock
    expect(segment).toMatch(/runs-on:\s*ubuntu-latest/)
  })

  it('checks out the repository in the build job', () => {
    expect(content).toMatch(/uses:\s*actions\/checkout@v4/)
  })

  it('sets up Node.js in the build job', () => {
    expect(content).toMatch(/uses:\s*actions\/setup-node@v4/)
  })

  it('specifies Node.js version 20', () => {
    expect(content).toMatch(/node-version:\s*20/)
  })

  it('runs "npm ci" to install dependencies', () => {
    expect(content).toMatch(/run:\s*npm ci/)
  })

  it('runs the test suite via "npm test"', () => {
    expect(content).toMatch(/run:\s*npm test/)
  })
})

describe('npm-publish-github-packages.yml – publish-gpr job', () => {
  let content: string

  beforeAll(() => {
    content = fs.readFileSync(WORKFLOW_PATH, 'utf-8')
  })

  it('defines a "publish-gpr" job', () => {
    expect(content).toMatch(/^\s*publish-gpr:/m)
  })

  it('requires the "build" job to succeed before publishing', () => {
    // needs: build must appear somewhere after the publish-gpr label
    const publishIdx = content.indexOf('  publish-gpr:')
    expect(publishIdx).toBeGreaterThan(-1)
    const publishBlock = content.slice(publishIdx)
    expect(publishBlock).toMatch(/needs:\s*build/)
  })

  it('runs the publish job on ubuntu-latest', () => {
    const publishIdx = content.indexOf('  publish-gpr:')
    const publishBlock = content.slice(publishIdx)
    expect(publishBlock).toMatch(/runs-on:\s*ubuntu-latest/)
  })

  it('grants "contents: read" permission', () => {
    const publishIdx = content.indexOf('  publish-gpr:')
    const publishBlock = content.slice(publishIdx)
    expect(publishBlock).toMatch(/contents:\s*read/)
  })

  it('grants "packages: write" permission', () => {
    const publishIdx = content.indexOf('  publish-gpr:')
    const publishBlock = content.slice(publishIdx)
    expect(publishBlock).toMatch(/packages:\s*write/)
  })

  it('does not grant write access to repository contents', () => {
    // Regression guard: contents permission must stay "read", not "write"
    const publishIdx = content.indexOf('  publish-gpr:')
    const publishBlock = content.slice(publishIdx)
    expect(publishBlock).not.toMatch(/contents:\s*write/)
  })

  it('checks out the repository', () => {
    const publishIdx = content.indexOf('  publish-gpr:')
    const publishBlock = content.slice(publishIdx)
    expect(publishBlock).toMatch(/uses:\s*actions\/checkout@v4/)
  })

  it('sets up Node.js', () => {
    const publishIdx = content.indexOf('  publish-gpr:')
    const publishBlock = content.slice(publishIdx)
    expect(publishBlock).toMatch(/uses:\s*actions\/setup-node@v4/)
  })

  it('configures the GitHub Packages npm registry URL', () => {
    expect(content).toMatch(/registry-url:\s*https:\/\/npm\.pkg\.github\.com\//)
  })

  it('runs "npm ci" before publishing', () => {
    const publishIdx = content.indexOf('  publish-gpr:')
    const publishBlock = content.slice(publishIdx)
    expect(publishBlock).toMatch(/run:\s*npm ci/)
  })

  it('publishes the package with "npm publish"', () => {
    const publishIdx = content.indexOf('  publish-gpr:')
    const publishBlock = content.slice(publishIdx)
    expect(publishBlock).toMatch(/run:\s*npm publish/)
  })

  it('sets NODE_AUTH_TOKEN from GITHUB_TOKEN secret', () => {
    expect(content).toMatch(/NODE_AUTH_TOKEN:\s*\$\{\{.*secrets\.GITHUB_TOKEN.*\}\}/)
  })

  it('does not hard-code any tokens or credentials', () => {
    // Boundary / security check: no literal token strings should appear
    expect(content).not.toMatch(/NODE_AUTH_TOKEN:\s*['"a-zA-Z0-9_-]{20,}/)
  })
})

describe('npm-publish-github-packages.yml – overall structure', () => {
  let content: string

  beforeAll(() => {
    content = fs.readFileSync(WORKFLOW_PATH, 'utf-8')
  })

  it('defines exactly two top-level jobs', () => {
    // Match job keys at exactly two-space indentation under "jobs:"
    const jobsIdx = content.indexOf('\njobs:')
    expect(jobsIdx).toBeGreaterThan(-1)
    const jobsBlock = content.slice(jobsIdx + 1) // skip leading newline
    const topLevelJobMatches = jobsBlock.match(/^  [a-z][a-z0-9_-]*:/gm) ?? []
    expect(topLevelJobMatches).toHaveLength(2)
  })

  it('uses pinned action versions (vN) rather than floating tags', () => {
    const actionUses = content.match(/uses:\s*\S+/g) ?? []
    expect(actionUses.length).toBeGreaterThan(0)
    for (const use of actionUses) {
      // Each action reference should include @vN or @vN.N or @sha
      expect(use).toMatch(/@v\d|@[0-9a-f]{40}/)
    }
  })

  it('uses actions/checkout at version 4', () => {
    const checkoutRefs = content.match(/actions\/checkout@[^\s]*/g) ?? []
    expect(checkoutRefs.length).toBeGreaterThan(0)
    for (const ref of checkoutRefs) {
      expect(ref).toBe('actions/checkout@v4')
    }
  })

  it('uses actions/setup-node at version 4', () => {
    const setupNodeRefs = content.match(/actions\/setup-node@[^\s]*/g) ?? []
    expect(setupNodeRefs.length).toBeGreaterThan(0)
    for (const ref of setupNodeRefs) {
      expect(ref).toBe('actions/setup-node@v4')
    }
  })

  it('consistently uses Node.js 20 across both jobs', () => {
    const nodeVersionMatches = content.match(/node-version:\s*\d+/g) ?? []
    expect(nodeVersionMatches.length).toBeGreaterThan(0)
    for (const match of nodeVersionMatches) {
      expect(match).toMatch(/node-version:\s*20/)
    }
  })
})