"use server"

import { createClient } from "@/lib/supabase/server"

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
