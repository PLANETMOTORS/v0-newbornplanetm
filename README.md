# Sanity CMS Backups

This branch contains automated daily backups of the Sanity CMS dataset.

Backups are committed here by the GitHub Actions workflow `.github/workflows/sanity-backup.yml`
running on `main`. Each backup is a `.ndjson` file named:

```
sanity-production-YYYY-MM-DDTHH-MM-SS.ndjson
```

The last 30 backups are retained; older ones are pruned automatically.

**Do not merge this branch into main.**
