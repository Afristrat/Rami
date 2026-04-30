"use server"

import { createClient } from "@/lib/supabase/server"
import { testPublishingConnection } from "@/lib/services/publishing/connection-tester"
import type { ConnectionTestResult } from "@/lib/services/publishing/connection-tester"
import { decryptToken } from "@/lib/services/oauth/state"
import { log } from "@/lib/utils/logger"

export type ConnectionStatus = "connected" | "disconnected" | "error"

export interface OAuthConnection {
  id: string
  platformId: string
  accountName: string
  accountAvatar: string | null
  connectedAt: string
  isActive: boolean
  status: ConnectionStatus
}

/**
 * Charge toutes les connexions OAuth du tenant courant.
 * Filtrée par RLS — chaque tenant ne voit que ses propres connexions.
 */
export async function getConnectionsAction(): Promise<{
  data: OAuthConnection[]
  error?: string
}> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { data: [], error: "Non authentifié." }
  }

  const { data, error } = await supabase
    .from("oauth_connections")
    .select("id, platform, account_name, account_avatar, created_at, is_active, expires_at")
    .order("created_at", { ascending: false })

  if (error) {
    // Table non encore créée en dev — fallback gracieux
    if (error.code === "42P01") {
      return { data: [] }
    }
    return { data: [], error: "Impossible de charger les connexions." }
  }

  const connections: OAuthConnection[] = (data ?? []).map((row) => {
    let status: ConnectionStatus = "disconnected"
    if (row.is_active) {
      const expired =
        row.expires_at && new Date(row.expires_at as string) < new Date()
      status = expired ? "error" : "connected"
    }
    return {
      id: row.id as string,
      platformId: row.platform as string,
      accountName: row.account_name as string,
      accountAvatar: row.account_avatar as string | null,
      connectedAt: row.created_at as string,
      isActive: row.is_active as boolean,
      status,
    }
  })

  return { data: connections }
}

/**
 * Teste une connexion OAuth en vérifiant le token auprès de l'API de la plateforme.
 * Le token est déchiffré côté serveur — jamais exposé au client.
 */
export async function testConnectionAction(
  connectionId: string
): Promise<{ success: true; data: ConnectionTestResult } | { success: false; error: string }> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: "Non authentifié." }
  }

  // Resolve tenant_id from user for defense in depth
  const { data: userProfile } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .single()

  const tenantId = (userProfile as Record<string, unknown> | null)?.tenant_id as string | null

  const query = supabase
    .from("oauth_connections")
    .select("id, platform, access_token_encrypted")
    .eq("id", connectionId)

  if (tenantId) {
    query.eq("tenant_id", tenantId)
  }

  const { data, error } = await query.single()

  if (error || !data) {
    return { success: false, error: "Connexion introuvable." }
  }

  const row = data as Record<string, unknown>
  const platform = row.platform as string
  const encryptedToken = row.access_token_encrypted as string | null

  if (!encryptedToken) {
    return {
      success: true,
      data: { platform, status: "error", message: "Aucun token stocké" },
    }
  }

  try {
    const accessToken = decryptToken(encryptedToken)
    const result = await testPublishingConnection(platform, accessToken)

    log({
      level: result.status === "ok" ? "info" : "warn",
      module: "connections",
      action: "test_connection",
      user_id: user.id,
      metadata: { platform, status: result.status, latency_ms: result.latency_ms },
    })

    return { success: true, data: result }
  } catch (err) {
    log({
      level: "error",
      module: "connections",
      action: "test_connection_error",
      user_id: user.id,
      metadata: { platform, error: err instanceof Error ? err.message : String(err) },
    })

    return {
      success: true,
      data: {
        platform,
        status: "error",
        message: "Impossible de déchiffrer le token",
      },
    }
  }
}
