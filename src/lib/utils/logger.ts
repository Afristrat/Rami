import * as Sentry from "@sentry/nextjs"

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
 * En production : erreurs/critiques envoyées à Sentry.
 * En développement : console structurée.
 */
export function log(entry: LogEntry): void {
  if (process.env.NODE_ENV === "production") {
    if (entry.level === "error" || entry.level === "critical") {
      Sentry.captureMessage(entry.message ?? `[${entry.module}] ${entry.action ?? "error"}`, {
        level: entry.level === "critical" ? "fatal" : "error",
        tags: { module: entry.module, action: entry.action ?? "" },
        user: entry.user_id ? { id: entry.user_id } : undefined,
        extra: {
          tenant_id: entry.tenant_id,
          duration_ms: entry.duration_ms,
          ...entry.metadata,
        },
      })
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
