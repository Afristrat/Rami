/**
 * Publisher LinkedIn — REST API v2
 * UGC Posts : POST /v2/ugcPosts
 * Limite : 3 000 caractères
 */

import type { PublisherInput, PublishResult } from "./types"

const LINKEDIN_API_BASE = "https://api.linkedin.com/v2"
const MAX_CHARS = 3000

export async function publishToLinkedIn(input: PublisherInput): Promise<PublishResult> {
  const { accessToken, content, accountId } = input

  if (!accountId) {
    return {
      platform: "linkedin",
      status: "failed",
      error: "LinkedIn : ID du compte manquant (author URN requis).",
    }
  }

  const text = content.length > MAX_CHARS ? content.slice(0, MAX_CHARS - 1) + "…" : content

  // L'author URN peut être sous la forme "urn:li:person:XXX" ou juste "XXX"
  const authorUrn = accountId.startsWith("urn:li:")
    ? accountId
    : `urn:li:person:${accountId}`

  const body = {
    author: authorUrn,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text },
        shareMediaCategory: "NONE",
      },
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
    },
  }

  try {
    const res = await fetch(`${LINKEDIN_API_BASE}/ugcPosts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detail = (errorBody as any)?.message || `HTTP ${res.status}`
      return {
        platform: "linkedin",
        status: "failed",
        error: `LinkedIn : ${detail}`,
      }
    }

    // L'ID est dans le header X-RestLi-Id
    const postUrn = res.headers.get("x-restli-id") ?? ""
    const postId = postUrn.split(":").pop() ?? postUrn

    return {
      platform: "linkedin",
      status: "published",
      postId: postUrn,
      postUrl: postId ? `https://www.linkedin.com/feed/update/${postUrn}` : undefined,
    }
  } catch (err) {
    return {
      platform: "linkedin",
      status: "failed",
      error: `LinkedIn : ${err instanceof Error ? err.message : "Erreur réseau"}`,
    }
  }
}
