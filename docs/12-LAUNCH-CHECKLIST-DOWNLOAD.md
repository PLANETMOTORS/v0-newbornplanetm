# Download Guide — Launch Checklist Files

If you cannot download files directly from the PR UI, use one of the methods below.

## Files included

- [10-LAUNCH-CHECKLIST.md](./10-LAUNCH-CHECKLIST.md)
- [11-LAUNCH-CHECKLIST-EXECUTION-GUIDE.md](./11-LAUNCH-CHECKLIST-EXECUTION-GUIDE.md)

## Option A — Download each file from GitHub

1. Open the file in GitHub.
2. Click **Raw**.
3. Save the page (`Ctrl/Cmd + S`) as `.md`.

## Option B — Create one ZIP file locally (recommended)

From repo root, run:

```bash
bash scripts/package-launch-checklists.sh
```

This generates:

- `dist/ev-planetmotors-launch-checklists-YYYY-MM-DD.zip`

The ZIP contains all launch checklist markdown files in one download.

## Option C — Copy from terminal

```bash
cat docs/10-LAUNCH-CHECKLIST.md
cat docs/11-LAUNCH-CHECKLIST-EXECUTION-GUIDE.md
```
