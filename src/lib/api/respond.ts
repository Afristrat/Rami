// ============================================================
// API publique v1 — helpers de réponse JSON (US-051)
// ============================================================

import { NextResponse } from "next/server"

export type ApiErrorStatus = 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500

/** Réponse d'erreur normalisée `{ error, details? }`. */
export function apiError(status: ApiErrorStatus, error: string, details?: unknown): NextResponse {
  return NextResponse.json(details === undefined ? { error } : { error, details }, { status })
}

/** Réponse de succès. */
export function apiOk<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status })
}
