import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { decryptToken } from "@/lib/services/oauth/state"
import type { OAuthPlatform } from "@/lib/services/oauth/config"

const VALID_PLATFORMS: OAuthPlatform[] = [
  "twitter",
  "linkedin",
  "instagram",
  "facebook",
  "pinterest",
]

const REDIRECT_SUCCESS = "/dashboard/settings/connections?disconnected=true"
const REDIRECT_ERROR = "/dashboard/settings/connections?error="

/**
 * Révocation du token côté plateforme + désactivation en DB.
 * Appelé par le bouton "Déconnecter" via form action.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params

  if (!VALID_PLATFORMS.includes(platform as OAuthPlatform)) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}${REDIRECT_ERROR}invalid_platform`
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/login`
    )
  }

  // Charger la connexion (RLS garantit l'appartenance au tenant)
  const { data: conn, error: fetchError } = await supabase
    .from("oauth_connections")
    .select("id, access_token_encrypted, refresh_token_encrypted")
    .eq("tenant_id", user.id)
    .eq("platform", platform)
    .eq("is_active", true)
    .single()

  if (fetchError || !conn) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}${REDIRECT_ERROR}connection_not_found`
    )
  }

  // Révocation côté plateforme (best-effort — ne bloque pas si échoue)
  try {
    const accessToken = decryptToken(conn.access_token_encrypted as string)
    await revokeToken(platform as OAuthPlatform, accessToken)
  } catch {
    // Log sans bloquer — la DB sera quand même mise à jour
    // (token révoqué côté RAMI même si révocation plateforme échoue)
  }

  // Désactivation en DB
  const { error: updateError } = await supabase
    .from("oauth_connections")
    .update({ is_active: false })
    .eq("id", conn.id)

  if (updateError) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}${REDIRECT_ERROR}db_error`
    )
  }

  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_APP_URL}${REDIRECT_SUCCESS}`
  )
}

// ─── Révocateurs par plateforme ───────────────────────────────────────────────

async function revokeToken(
  platform: OAuthPlatform,
  accessToken: string
): Promise<void> {
  switch (platform) {
    case "twitter":
      await revokeTwitter(accessToken)
      break
    case "linkedin":
      await revokeLinkedIn(accessToken)
      break
    case "facebook":
    case "instagram":
      await revokeMetaToken(accessToken)
      break
    case "pinterest":
      // Pinterest v5 ne fournit pas d'endpoint de révocation — token expire naturellement
      break
  }
}

async function revokeTwitter(token: string): Promise<void> {
  const clientId = process.env.TWITTER_CLIENT_ID
  const clientSecret = process.env.TWITTER_CLIENT_SECRET
  if (!clientId || !clientSecret) return

  await fetch("https://api.twitter.com/2/oauth2/revoke", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({ token, token_type_hint: "access_token" }),
  })
}

async function revokeLinkedIn(token: string): Promise<void> {
  const clientId = process.env.LINKEDIN_CLIENT_ID
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET
  if (!clientId || !clientSecret) return

  await fetch("https://www.linkedin.com/oauth/v2/revoke", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      token,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })
}

async function revokeMetaToken(token: string): Promise<void> {
  const appId = process.env.META_APP_ID
  const appSecret = process.env.META_APP_SECRET
  if (!appId || !appSecret) return

  await fetch(
    `https://graph.facebook.com/me/permissions?access_token=${token}&appsecret_proof=${await computeAppSecretProof(token, appSecret)}`,
    { method: "DELETE" }
  )
}

async function computeAppSecretProof(
  token: string,
  appSecret: string
): Promise<string> {
  const { createHmac } = await import("crypto")
  return createHmac("sha256", appSecret).update(token).digest("hex")
}
