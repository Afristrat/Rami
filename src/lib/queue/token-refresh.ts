/**
 * Rafraîchissement de token OAuth — partagé par les workers pg-boss
 * (publication ET collecte de metrics). Conforme SOP-004 étape 3.
 *
 * Travaille avec le service client Supabase (bypass RLS, côté serveur).
 * Retourne un access token en clair valide ; throw si le token est révoqué
 * et non rafraîchissable → l'appelant décide quoi faire (désactiver la conn,
 * marquer la collecte indisponible, etc.).
 */

import { decryptToken, encryptToken } from "@/lib/services/oauth/state"
import { getOAuthConfig, type OAuthPlatform } from "@/lib/services/oauth/config"

const REFRESH_THRESHOLD_MS = 5 * 60 * 1000 // 5 minutes avant expiration

export interface OAuthConnectionRow {
  id: string
  platform: string
  access_token_encrypted: string
  refresh_token_encrypted: string | null
  expires_at: string | null
}

export async function getValidAccessToken(
  conn: OAuthConnectionRow,
  // Service client Supabase — typé large pour rester découplé des types DB générés.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
): Promise<string> {
  const expiresAt = conn.expires_at ? new Date(conn.expires_at) : null
  const needsRefresh =
    expiresAt !== null && expiresAt.getTime() - Date.now() < REFRESH_THRESHOLD_MS

  if (!needsRefresh) {
    return decryptToken(conn.access_token_encrypted)
  }

  if (!conn.refresh_token_encrypted) {
    throw new Error("Token expiré et aucun refresh token disponible. Reconnectez le compte.")
  }

  const config = getOAuthConfig(conn.platform as OAuthPlatform)
  const clientId = process.env[config.clientIdEnv]
  const clientSecret = process.env[config.clientSecretEnv]

  if (!clientId || !clientSecret) {
    throw new Error(`Credentials OAuth manquants pour ${conn.platform}.`)
  }

  const refreshToken = decryptToken(conn.refresh_token_encrypted)

  const res = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })

  if (!res.ok) {
    throw new Error(`Refresh token révoqué. Reconnectez le compte ${conn.platform}.`)
  }

  const tokenData = (await res.json()) as {
    access_token: string
    refresh_token?: string
    expires_in?: number
  }

  const newExpiresAt = tokenData.expires_in
    ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
    : null

  await supabase
    .from("oauth_connections")
    .update({
      access_token_encrypted: encryptToken(tokenData.access_token),
      ...(tokenData.refresh_token && {
        refresh_token_encrypted: encryptToken(tokenData.refresh_token),
      }),
      expires_at: newExpiresAt,
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", conn.id)

  return tokenData.access_token
}
