# ev.planetmotors.ca — Launch Checklist Execution Guide

## Purpose
This companion document explains **how to execute** `docs/10-LAUNCH-CHECKLIST.md` and how to package evidence for engineering, QA, and product sign-off.

## Inputs
- Primary checklist: `docs/10-LAUNCH-CHECKLIST.md`
- Deployment target: `ev.planetmotors.ca`
- Environment under test: Staging and/or Production (explicitly mark in report)

## Required Roles
- **QA Lead** — owns execution completeness.
- **Web Engineer** — owns technical verification and defect fixes.
- **Product Owner** — owns business go/no-go confirmation.

## Execution Rules
1. Every row must be marked **✅ Pass / ❌ Fail / — N/A**.
2. Every ❌ Fail requires a defect ticket ID and owner.
3. No launch with unresolved P0 items.
4. Evidence links are mandatory for payment, checkout, and calculator flows.
5. Re-test all fixed failures and update status with timestamp.

## Minimum Evidence Package
Attach the following artifacts before sign-off:

1. Desktop happy-path video (inventory → VDP → checkout → success).
2. Mobile happy-path video (iOS/Android).
3. Decline/retry payment video.
4. Stripe reconciliation sheet (UI total vs Stripe total vs DB total).
5. Finance calculator validation sheet (formula samples).
6. Delivery calculator validation sheet (postal code matrix).
7. Open defects list with severity, owner, ETA, and launch impact.
8. Final sign-off snapshot from Engineering + QA + Product.

## Defect Severity Policy
- **P0 (Critical)**: Payment integrity, security breach risk, impossible checkout, data corruption.
- **P1 (High)**: Major flow blocked, wrong pricing logic, unusable mobile checkout.
- **P2 (Medium)**: Non-blocking but significant UX/performance/edge-case issues.
- **P3 (Low)**: Cosmetic or minor informational defects.

## Sign-off Exit Criteria
Launch can proceed only when:

- All P0 are resolved and re-tested.
- Stripe/payment/webhook integrity checks pass.
- Finance and delivery calculator outputs are approved.
- Human click matrix is fully executed with evidence.
- Monitoring + rollback readiness confirmed.


## Download Options
If reviewers cannot download Markdown files from the PR UI, use `docs/12-LAUNCH-CHECKLIST-DOWNLOAD.md` for direct steps and a ZIP packaging command.

## Deliverable Format
Use this naming format for final package:

`ev-planetmotors-prelaunch-report-YYYY-MM-DD.zip`

Contents:
- `checklist-completed.pdf`
- `defect-register.xlsx`
- `evidence/` (videos/screenshots/logs)
- `reconciliation/stripe-reconciliation.xlsx`
- `signoff.md`

---

**Owner:** Engineering + QA  
**Applies to:** `ev.planetmotors.ca` production launch  
**Last Updated:** April 17, 2026
