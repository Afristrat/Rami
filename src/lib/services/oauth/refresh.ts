/**
 * Service de rafraîchissement de tokens OAuth.
 * Appelé avant chaque publication pour garantir un token valide.
 * Conforme à SOP-004 — étape 3 (vérifier expires_at → refresh si nécessaire).
 */

import { createClient } from "@/lib/supabase/server"
import { encryptToken, decryptToken } from "./state"
import { getOAuthConfig, type OAuthPlatform } from "./config"

const REFRESH_THRESHOLD_MS = 5 * 60 * 1000 // 5 minutes avant expiration

export interface TokenResult {
  accessToken: string
  expiresAt: string | null
}

/**
 * Retourne un access token valide pour la connexion donnée.
 * Rafraîchit automatiquement si expires_at < now() + 5min.
 */
export async function getValidToken(connectionId: string): Promise<TokenResult> {
  const supabase = await createClient()

  const { data: conn, error } = await supabase
    .from("oauth_connections")
    .select(
      "id, platform, access_token_encrypted, refresh_token_encrypted, expires_at, is_active"
    )
    .eq("id", connectionId)
    .single()

  if (error || !conn) {
    throw new Error("Connexion OAuth introuvable.")
  }

  if (!conn.is_active) {
    throw new Error("Connexion OAuth inactive — le compte a été déconnecté.")
  }

  const expiresAt = conn.expires_at ? new Date(conn.expires_at as string) : null
  const needsRefresh =
    expiresAt !== null &&
    expiresAt.getTime() - Date.now() < REFRESH_THRESHOLD_MS

  if (!needsRefresh) {
    return {
      accessToken: decryptToken(conn.access_token_encrypted as string),
      expiresAt: conn.expires_at as string | null,
    }
  }

  // Token expiré ou proche de l'expiration — rafraîchissement
  if (!conn.refresh_token_encrypted) {
    // Plateforme sans refresh token (ex: Twitter sans offline.access)
    // Marquer comme expired pour forcer la reconnexion
    await supabase
      .from("oauth_connections")
      .update({ is_active: false })
      .eq("id", connectionId)
    throw new Error(
      "Token expiré et aucun refresh token disponible. Reconnectez le compte."
    )
  }

  const refreshToken = decryptToken(conn.refresh_token_encrypted as string)
  const config = getOAuthConfig(conn.platform as OAuthPlatform)
  const clientId = process.env[config.clientIdEnv]
  const clientSecret = process.env[config.clientSecretEnv]

  if (!clientId || !clientSecret) {
    throw new Error(`Credentials manquants pour ${conn.platform}.`)
  }

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
    // Refresh échoué → désactiver la connexion et notifier
    await supabase
      .from("oauth_connections")
      .update({ is_active: false })
      .eq("id", connectionId)
    throw new Error(
      `Refresh token invalide pour ${conn.platform}. Reconnectez le compte.`
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tokenData: any = await res.json()
  const newAccessToken: string = tokenData.access_token
  const newRefreshToken: string | undefined = tokenData.refresh_token
  const expiresIn: number | undefined = tokenData.expires_in

  const newExpiresAt = expiresIn
    ? new Date(Date.now() + expiresIn * 1000).toISOString()
    : null

  // Mise à jour en DB avec nouveaux tokens chiffrés
  await supabase
    .from("oauth_connections")
    .update({
      access_token_encrypted: encryptToken(newAccessToken),
      ...(newRefreshToken && {
        refresh_token_encrypted: encryptToken(newRefreshToken),
      }),
      expires_at: newExpiresAt,
      is_active: true,
    })
    .eq("id", connectionId)

  return { accessToken: newAccessToken, expiresAt: newExpiresAt }
}
