import { migrateV1ToV1_1 } from "./v1_to_v1_1"
import { migrateV1_1ToV2 } from "./v1_1_to_v2"

type AnyConfig = Record<string, unknown>

type Migrator = {
  from: string
  to: string
  run: (input: AnyConfig) => AnyConfig
}

export const migrators: Migrator[] = [
  { from: "1.0.0", to: "1.1.0", run: migrateV1ToV1_1 },
  { from: "1.1.0", to: "2.0.0", run: migrateV1_1ToV2 },
]

export function migrateToLatest(
  input: AnyConfig,
  currentVersion: string,
): AnyConfig {
  let cfg = { ...input }
  let v = currentVersion

  for (;;) {
    const step = migrators.find((m) => m.from === v)
    if (!step) break
    cfg = step.run(cfg)
    v = step.to
  }
  return cfg
}
