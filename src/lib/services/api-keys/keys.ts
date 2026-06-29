// ============================================================
// API publique v1 — primitives de clé API (US-051 LOT 0)
// Module PUR (hors dépendance DB) : génération, hash, parsing, scopes.
// La clé en clair n'est JAMAIS persistée — seul son hash SHA-256 l'est.
// ============================================================

import { createHash, randomBytes } from "node:crypto"

export const API_KEY_PREFIX = "rami_sk_"
/** Longueur du prefix affichable conservé en clair ("rami_sk_" + 4 car.). */
export const API_KEY_PREFIX_DISPLAY_LEN = 12

/** Scopes disponibles pour une clé API. */
export const API_SCOPES = [
  "posts:write",
  "content:write",
  "presentations:write",
  "visuals:write",
  "analytics:read",
] as const
export type ApiScope = (typeof API_SCOPES)[number]

export interface GeneratedApiKey {
  /** Clé en clair — à montrer UNE seule fois, jamais persistée. */
  raw: string
  /** Hash SHA-256 hex à stocker (key_hash). */
  hash: string
  /** Prefix affichable (key_prefix). */
  prefix: string
}

/** Hash SHA-256 (hex) d'une clé en clair. Déterministe. PUR. */
export function hashApiKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex")
}

/** Prefix affichable (12 premiers car.) d'une clé. PUR. */
export function keyPrefix(raw: string): string {
  return raw.slice(0, API_KEY_PREFIX_DISPLAY_LEN)
}

/**
 * Génère une nouvelle clé API : `rami_sk_<43 car base64url>`.
 * Renvoie la clé en clair (à afficher une fois) + son hash + son prefix.
 */
export function generateApiKey(): GeneratedApiKey {
  const raw = API_KEY_PREFIX + randomBytes(32).toString("base64url")
  return { raw, hash: hashApiKey(raw), prefix: keyPrefix(raw) }
}

/** Vrai si la chaîne a la forme attendue d'une clé RAMI. PUR. */
export function isApiKeyShape(raw: string): boolean {
  return raw.startsWith(API_KEY_PREFIX) && raw.length >= API_KEY_PREFIX.length + 20
}

/** Extrait le token d'un header `Authorization: Bearer <token>`. PUR. */
export function extractBearer(header: string | null | undefined): string | null {
  if (!header) return null
  const match = header.match(/^Bearer\s+(.+)$/i)
  return match ? match[1].trim() : null
}

/** Vrai si toutes les scopes requises sont présentes parmi celles accordées. PUR. */
export function hasScopes(granted: readonly string[], required: readonly ApiScope[]): boolean {
  return required.every((scope) => granted.includes(scope))
}
