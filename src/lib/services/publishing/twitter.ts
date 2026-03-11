/**
 * Publisher Twitter / X — API v2
 * POST /2/tweets
 * Limite : 280 caractères (texte seul)
 */

import type { PublisherInput, PublishResult } from "./types"

const TWITTER_API_BASE = "https://api.twitter.com/2"
const MAX_CHARS = 280

export async function publishToTwitter(input: PublisherInput): Promise<PublishResult> {
  const { accessToken, content } = input

  // Tronquer si nécessaire (sécurité)
  const text = content.length > MAX_CHARS ? content.slice(0, MAX_CHARS - 1) + "…" : content

  try {
    const res = await fetch(`${TWITTER_API_BASE}/tweets`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      const detail =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (body as any)?.detail ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (body as any)?.errors?.[0]?.message ||
        `HTTP ${res.status}`

      return {
        platform: "twitter",
        status: "failed",
        error: `Twitter : ${detail}`,
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json()
    const tweetId: string = data?.data?.id

    return {
      platform: "twitter",
      status: "published",
      postId: tweetId,
      postUrl: tweetId ? `https://twitter.com/i/web/status/${tweetId}` : undefined,
    }
  } catch (err) {
    return {
      platform: "twitter",
      status: "failed",
      error: `Twitter : ${err instanceof Error ? err.message : "Erreur réseau"}`,
    }
  }
}
