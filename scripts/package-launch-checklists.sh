#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${ROOT_DIR}/dist"
DATE_STAMP="$(date -u +%F)"
OUT_FILE="${OUT_DIR}/ev-planetmotors-launch-checklists-${DATE_STAMP}.zip"

mkdir -p "${OUT_DIR}"

zip -j "${OUT_FILE}" \
  "${ROOT_DIR}/docs/10-LAUNCH-CHECKLIST.md" \
  "${ROOT_DIR}/docs/11-LAUNCH-CHECKLIST-EXECUTION-GUIDE.md" \
  "${ROOT_DIR}/docs/12-LAUNCH-CHECKLIST-DOWNLOAD.md" >/dev/null

echo "Created: ${OUT_FILE}"
