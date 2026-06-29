/**
 * Récupération des informations de compte après OAuth.
 * Chaque plateforme a son propre endpoint "me".
 * Utilisé dans le callback pour stocker account_name et account_avatar.
 */

import type { OAuthPlatform } from "./config"

export interface AccountInfo {
  accountId: string
  accountName: string
  accountAvatar: string | null
}

export async function fetchAccountInfo(
  platform: OAuthPlatform,
  accessToken: string
): Promise<AccountInfo> {
  switch (platform) {
    case "twitter":
      return fetchTwitterAccount(accessToken)
    case "linkedin":
      return fetchLinkedInAccount(accessToken)
    case "instagram":
      return fetchInstagramAccount(accessToken)
    case "facebook":
      return fetchFacebookAccount(accessToken)
    case "pinterest":
      return fetchPinterestAccount(accessToken)
    case "youtube":
      return fetchYouTubeAccount(accessToken)
    case "tiktok":
      return fetchTikTokAccount(accessToken)
  }
}

// ─── Twitter / X ─────────────────────────────────────────────────────────────

async function fetchTwitterAccount(token: string): Promise<AccountInfo> {
  const res = await fetch(
    "https://api.twitter.com/2/users/me?user.fields=profile_image_url,name,username",
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) throw new Error("Twitter /users/me échoué")
  const json = await res.json()
  const user = json.data
  return {
    accountId: user.id as string,
    accountName: `@${user.username as string}`,
    accountAvatar: (user.profile_image_url as string | null) ?? null,
  }
}

// ─── LinkedIn ─────────────────────────────────────────────────────────────────

async function fetchLinkedInAccount(token: string): Promise<AccountInfo> {
  // OpenID Connect : /userinfo renvoie sub (= member id), name, given_name,
  // family_name, picture. L'ancien /v2/me (r_liteprofile) n'est plus accessible.
  const res = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("LinkedIn /userinfo échoué")

  const profile = await res.json()
  const name = [profile.given_name, profile.family_name].filter(Boolean).join(" ")

  return {
    accountId: profile.sub as string,
    accountName: name || "Compte LinkedIn",
    accountAvatar: (profile.picture as string | undefined) ?? null,
  }
}

// ─── Instagram (via Graph API) ────────────────────────────────────────────────

async function fetchInstagramAccount(token: string): Promise<AccountInfo> {
  // Récupère d'abord les pages Facebook, puis les comptes Instagram associés
  const pagesRes = await fetch(
    `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,instagram_business_account&access_token=${token}`
  )
  if (!pagesRes.ok) throw new Error("Meta /me/accounts échoué")
  const pagesData = await pagesRes.json()

  // Prend le premier compte Instagram trouvé
  const page = (pagesData.data as Array<{
    id: string
    name: string
    instagram_business_account?: { id: string }
  }>).find((p) => p.instagram_business_account)

  if (!page?.instagram_business_account) {
    // Fallback : retourner le nom de la page Facebook
    const fallback = pagesData.data?.[0]
    return {
      accountId: fallback?.id ?? "unknown",
      accountName: fallback?.name ?? "Compte Instagram",
      accountAvatar: null,
    }
  }

  const igId = page.instagram_business_account.id
  const igRes = await fetch(
    `https://graph.facebook.com/v21.0/${igId}?fields=id,username,profile_picture_url&access_token=${token}`
  )
  if (!igRes.ok) throw new Error("Instagram account info échoué")
  const ig = await igRes.json()

  return {
    accountId: igId,
    accountName: `@${ig.username as string}`,
    accountAvatar: (ig.profile_picture_url as string | null) ?? null,
  }
}

// ─── Facebook ─────────────────────────────────────────────────────────────────

async function fetchFacebookAccount(token: string): Promise<AccountInfo> {
  const res = await fetch(
    `https://graph.facebook.com/v21.0/me?fields=id,name,picture.type(large)&access_token=${token}`
  )
  if (!res.ok) throw new Error("Facebook /me échoué")
  const user = await res.json()

  return {
    accountId: user.id as string,
    accountName: user.name as string,
    accountAvatar:
      (user.picture?.data?.url as string | undefined) ?? null,
  }
}

// ─── Pinterest ────────────────────────────────────────────────────────────────

async function fetchPinterestAccount(token: string): Promise<AccountInfo> {
  const res = await fetch("https://api.pinterest.com/v5/user_account", {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Pinterest /user_account échoué")
  const user = await res.json()

  return {
    accountId: user.username as string,
    accountName: [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username as string,
    accountAvatar: (user.profile_image as string | null) ?? null,
  }
}

// ─── YouTube (Google / YouTube Data API v3) ───────────────────────────────────

async function fetchYouTubeAccount(token: string): Promise<AccountInfo> {
  const res = await fetch(
    "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) throw new Error("YouTube /channels échoué")
  const json = await res.json()
  const channel = json.items?.[0]
  if (!channel) {
    return { accountId: "unknown", accountName: "Chaîne YouTube", accountAvatar: null }
  }
  return {
    accountId: channel.id as string,
    accountName: (channel.snippet?.title as string | undefined) ?? "Chaîne YouTube",
    accountAvatar: (channel.snippet?.thumbnails?.default?.url as string | undefined) ?? null,
  }
}

// ─── TikTok (Content Posting API) ─────────────────────────────────────────────

async function fetchTikTokAccount(token: string): Promise<AccountInfo> {
  const res = await fetch(
    "https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url",
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) throw new Error("TikTok /user/info échoué")
  const json = await res.json()
  const user = json.data?.user
  if (!user) {
    return { accountId: "unknown", accountName: "Compte TikTok", accountAvatar: null }
  }
  return {
    accountId: user.open_id as string,
    accountName: (user.display_name as string | undefined) ?? "Compte TikTok",
    accountAvatar: (user.avatar_url as string | undefined) ?? null,
  }
}
