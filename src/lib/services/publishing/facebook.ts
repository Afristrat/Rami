/**
 * Publisher Facebook — Graph API v21
 * POST /{page-id}/feed
 * Limite : 63 206 caractères
 */

import type { PublisherInput, PublishResult } from "./types"

const GRAPH_API_BASE = "https://graph.facebook.com/v21.0"

export async function publishToFacebook(input: PublisherInput): Promise<PublishResult> {
  const { accessToken, content, accountId } = input

  if (!accountId) {
    return {
      platform: "facebook",
      status: "failed",
      error: "Facebook : ID de la Page manquant.",
    }
  }

  try {
    const params = new URLSearchParams({
      message: content,
      access_token: accessToken,
    })

    const res = await fetch(`${GRAPH_API_BASE}/${accountId}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json()

    if (!res.ok || data?.error) {
      const detail =
        data?.error?.message ||
        data?.error?.error_user_msg ||
        `HTTP ${res.status}`
      return {
        platform: "facebook",
        status: "failed",
        error: `Facebook : ${detail}`,
      }
    }

    const postId: string = data?.id ?? ""

    return {
      platform: "facebook",
      status: "published",
      postId,
      postUrl: postId ? `https://www.facebook.com/${postId}` : undefined,
    }
  } catch (err) {
    return {
      platform: "facebook",
      status: "failed",
      error: `Facebook : ${err instanceof Error ? err.message : "Erreur réseau"}`,
    }
  }
}
