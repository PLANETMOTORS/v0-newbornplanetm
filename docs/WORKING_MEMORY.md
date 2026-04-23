# Working Memory

## Tooling discussed

- CodeRabbit is the default review workflow in this repo.
- Use CLI commands:
  - pnpm review
  - pnpm review:all
  - pnpm review:ui
- If needed: coderabbit auth login
- VS Code tasks were added for:
  - CodeRabbit: Review Uncommitted
  - CodeRabbit: Review All
  - CodeRabbit: Review Interactive

## Action plan discussed

- Run CodeRabbit on uncommitted changes first.
- Prioritize payment and webhook findings by severity.
- Fix high-risk payment integrity issues first:
  - Replay-safe webhook processing
  - Idempotent event handling
  - Fail-closed handling when event metadata cannot map to domain entities
  - Server-side amount/currency verification before state transitions
- Re-run validation after fixes:
  - pnpm lint
  - pnpm build
- Re-run CodeRabbit and iterate until critical findings are cleared.

## Current payment hardening status

- Added distributed lock helpers for replay-safe event processing.
- Hardened Stripe webhook reservation transitions with amount/currency checks.
- Added fail-closed checks for missing mapping metadata on critical Stripe event types.
- Build currently passes.
