/**
 * Publisher Pinterest — API v5
 * POST /v5/pins
 * Note : Pinterest exige une image ou une URL de destination.
 */

import type { PublisherInput, PublishResult } from "./types"

const PINTEREST_API_BASE = "https://api.pinterest.com/v5"
const MAX_DESCRIPTION = 500

export async function publishToPinterest(input: PublisherInput): Promise<PublishResult> {
  const { accessToken, content, mediaUrls, accountId } = input

  // Pinterest : soit une image, soit un lien — sinon refus
  const imageUrl = mediaUrls?.[0]
  if (!imageUrl && !accountId) {
    return {
      platform: "pinterest",
      status: "failed",
      error:
        "Pinterest : une image ou un Board ID est requis pour créer un Pin.",
    }
  }

  // Board ID — si accountId contient "board:" on l'utilise directement, sinon on construit
  const boardId = accountId?.startsWith("board:")
    ? accountId
    : accountId

  if (!boardId) {
    return {
      platform: "pinterest",
      status: "failed",
      error: "Pinterest : Board ID manquant.",
    }
  }

  const description =
    content.length > MAX_DESCRIPTION
      ? content.slice(0, MAX_DESCRIPTION - 1) + "…"
      : content

  const pinPayload: Record<string, unknown> = {
    board_id: boardId,
    title: description.split("\n")[0].slice(0, 100), // Première ligne = titre
    description,
  }

  if (imageUrl) {
    pinPayload.media_source = {
      source_type: "image_url",
      url: imageUrl,
    }
  }

  try {
    const res = await fetch(`${PINTEREST_API_BASE}/pins`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pinPayload),
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json()

    if (!res.ok || data?.code) {
      const detail = data?.message || `HTTP ${res.status}`
      return {
        platform: "pinterest",
        status: "failed",
        error: `Pinterest : ${detail}`,
      }
    }

    const pinId: string = data?.id ?? ""

    return {
      platform: "pinterest",
      status: "published",
      postId: pinId,
      postUrl: pinId ? `https://www.pinterest.com/pin/${pinId}/` : undefined,
    }
  } catch (err) {
    return {
      platform: "pinterest",
      status: "failed",
      error: `Pinterest : ${err instanceof Error ? err.message : "Erreur réseau"}`,
    }
  }
}
