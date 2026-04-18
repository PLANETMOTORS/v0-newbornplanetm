# Overlay Config Package

Production-ready configuration system for the 360° vehicle viewer studio background.

## Structure

```
config/overlay/
  current.json          # Active config — the ONLY file read by runtime
  versions/             # Versioned snapshots
  schemas/              # JSON Schema exports (for cross-language validation)
  migrations/           # Version migration scripts
  validators/           # Zod schema + parse utility
  loader/               # Runtime loader with migration + fallback
  overlay-types.ts      # TypeScript type definitions
  changelog.md          # Change history
```

## Profiles

| Profile | Description |
|---------|-------------|
| `warm_white_backwall` | Warm white wall + gray floor (default, Carvana-like) |
| `pure_white_cyclorama` | Clean white cyclorama studio look |
| `neutral_gray_premium` | Neutral gray, premium automotive feel |
| `cool_ev_tech` | Cool blue-gray tones for EV/tech vehicles |

## Usage

```tsx
import { overlayConfig } from "@/config/overlay/loader/loadOverlayConfig"
import { useOverlayRenderer } from "@/hooks/use-overlay-renderer"

const { canvasRef, draw } = useOverlayRenderer(overlayConfig)
```

## Changing the active profile

Edit `current.json` → set `"activeProfile"` to one of the profile keys.

## Versioning

- **PATCH** (1.1.1): Value tuning only
- **MINOR** (1.2.0): Backward-compatible fields added
- **MAJOR** (2.0.0): Structure/required field changes

## Validation

```ts
import { parseOverlayConfig } from "@/config/overlay/validators/validate"
const config = parseOverlayConfig(rawJson) // throws on invalid
```
