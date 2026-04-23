/**
 * Structured logging for Edge Functions.
 * Outputs JSON lines compatible with Supabase log drains.
 */

type LogLevel = "info" | "warn" | "error" | "debug"

interface LogEntry {
  level: LogLevel
  fn: string
  msg: string
  [key: string]: unknown
}

function emit(entry: LogEntry): void {
  const record = {
    ...entry,
    ts: new Date().toISOString(),
  }
  // Supabase collects stdout as structured logs
  console.log(JSON.stringify(record))
}

export function createLogger(fnName: string) {
  return {
    info(msg: string, data?: Record<string, unknown>) {
      emit({ level: "info", fn: fnName, msg, ...data })
    },
    warn(msg: string, data?: Record<string, unknown>) {
      emit({ level: "warn", fn: fnName, msg, ...data })
    },
    error(msg: string, data?: Record<string, unknown>) {
      emit({ level: "error", fn: fnName, msg, ...data })
    },
    debug(msg: string, data?: Record<string, unknown>) {
      emit({ level: "debug", fn: fnName, msg, ...data })
    },
  }
}
