DEVELOPER WARNING!

FIRM COMMAND: $225K USD Asset Protection & Final Handoff
"We are now at the final stage of this $225,000 USD enterprise build. At this investment level, I am not accepting any 'Kia' parts in this Ferrari. The architecture must be Pristine, Intact, and Scalable.
Execute the following fixes to clean the 'any' types and legacy bottlenecks:
1. Zod Security Filter: Implement Zod schemas for reservation.ts, stripe.ts, and upload-license.ts. Every entry point to our database must be strictly filtered. No raw data hits the DB.
2. Kill 'any' Types: Focus on finance-application.ts and typesense.ts. We are scaling to 10,000+ vehicles; we cannot have 'unknown' data shapes. Everything must be strictly typed.
3. React 19 Purity: Refactor the remaining 10 isSubmitting instances and the 5 customer-facing fetch calls. Move them to Server Actions and useFormStatus. Delete the boilerplate.
4. GitHub Placement: Save CODE_OF_CONDUCT.md and VERCEL_FEATURES.md in the Root Directory of the GitHub repository. Update the README.md with a 'Technical Standards' section linking to both. They must be visible on the main landing page.
5. Clean Bill of Health: Once you have a 0 Error / 0 Warning / 0 'any' build, merge fix/seo-audit-p0-p1 into main.
This is the Law of the Land for our $225K asset. Confirm when the merge is live."



The $225K "Ferrari" Developer Code of Conduct
To be saved as CODE_OF_CONDUCT.md in the root.
* Type Safety: any is strictly forbidden. 10,000 vehicles require explicit interfaces to prevent runtime crashes.
* Data Integrity: All incoming data must pass through Zod schemas before database entry.
* React 19 Native: Use useActionState and useFormStatus. Legacy useState for loading is deprecated.
* Server-First: All internal logic lives in Server Actions, never client-side fetch calls.
* Resilient Side-Effects: CRM/Email tasks must be wrapped in try/catch so external failures never block a user’s success response.



Post-Launch Maintenance Schedule (The Owner's Manual)
To prevent Data Drift and Performance Decay at 10K scale.
1. Daily "Vitals" (Automated): Check HomenetIOL Sync logs (Success must be 100%) and Typesense Latency (Target <50ms).
2. Weekly "Performance" (Manual): Run Lighthouse on 5 random VDPs. LCP must remain < 1.2s. Check Vercel Blob cache hits (Target >85%).
3. Monthly "Integrity" (Senior Lead): Perform a "Reconciliation Count" (Homenet CSV vs. DB vs. Typesense). Variance must be 0. Audit DB indexes for bloat.
4. Quarterly "Scalability" (Architect): Simulate a 15,000-vehicle sync. Verify memory stays < 256MB. Run the full Playwright E2E suite after all dependency updates.



The Final Verdict
By placing these files in the GitHub root and enforcing the $225K purity standard, you are not just launching a site—you are commissioning an Enterprise Data Platform.
Your site is now architecturally Unbreakable.
Maintain a One-Click Vitals Dashboard template as part of the team's operational "Control Room" tooling for post-merge monitoring.


Citations:
"Check the Sentry logs to ensure no sensitive data... is accidentally being logged in plain text." [2]
