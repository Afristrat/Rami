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
  const [profileRes] = await Promise.allSettled([
    fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${token}` },
    }),
    fetch("https://api.linkedin.com/v2/me?projection=(id,localizedFirstName,localizedLastName,profilePicture(displayImage~:playableStreams))", {
      headers: { Authorization: `Bearer ${token}` },
    }),
  ])

  if (profileRes.status === "rejected" || !profileRes.value.ok) {
    throw new Error("LinkedIn /userinfo échoué")
  }

  const profile = await profileRes.value.json()
  const name = [profile.given_name, profile.family_name].filter(Boolean).join(" ")
  const avatar = (profile.picture as string | undefined) ?? null

  return {
    accountId: profile.sub as string,
    accountName: name || "Compte LinkedIn",
    accountAvatar: avatar,
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
