type LogLevel = "debug" | "info" | "warn" | "error" | "critical"

interface LogEntry {
  level: LogLevel
  message?: string
  module: string
  action?: string
  tenant_id?: string
  user_id?: string
  metadata?: Record<string, unknown>
  duration_ms?: number
}

/**
 * Logger structuré pour RAMI.
 * En production : silencieux sauf erreurs critiques (Sentry à brancher).
 * En développement : console structurée.
 */
export function log(entry: LogEntry): void {
  if (process.env.NODE_ENV === "production") {
    // En production, ne logger que les erreurs/critiques
    if (entry.level === "error" || entry.level === "critical") {
      // TODO: Sentry.captureMessage(...)
      console.error(JSON.stringify({ ...entry, timestamp: new Date().toISOString() }))
    }
    return
  }

  const prefix = {
    debug: "🔍",
    info: "ℹ️",
    warn: "⚠️",
    error: "❌",
    critical: "🚨",
  }[entry.level]

  console.log(
    `${prefix} [${entry.module}${entry.action ? `:${entry.action}` : ""}]`,
    entry.message ?? "",
    entry.metadata ?? "",
    entry.tenant_id ? `(tenant: ${entry.tenant_id.slice(0, 8)}…)` : ""
  )
}
