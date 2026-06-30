/**
 * Publisher TikTok — Content Posting API v2.
 * Deux modes (cf. VideoPublishOptions.tiktokMode) :
 *  - `direct` : Direct Post → /v2/post/publish/video/init/ (app auditée en prod).
 *  - `draft`  : dépôt en brouillon → /v2/post/publish/inbox/video/init/.
 * La vidéo est tirée par TikTok depuis son URL (PULL_FROM_URL) — le domaine de
 * l'URL doit être vérifié dans l'app TikTok (URL ownership). Une vidéo est
 * obligatoire. Publication asynchrone côté TikTok → on retourne le publish_id.
 */

import type { PublisherInput, PublishResult } from "./types"

const DIRECT_POST_URL = "https://open.tiktokapis.com/v2/post/publish/video/init/"
const DRAFT_URL = "https://open.tiktokapis.com/v2/post/publish/inbox/video/init/"
const MAX_TITLE = 2200

export async function publishToTikTok(input: PublisherInput): Promise<PublishResult> {
  const { accessToken, content, mediaUrls, videoOptions } = input

  const videoUrl = mediaUrls?.[0]
  if (!videoUrl) {
    return {
      platform: "tiktok",
      status: "failed",
      error: "TikTok : une vidéo est obligatoire pour publier. Générez ou ajoutez une vidéo au post.",
    }
  }

  const mode = videoOptions?.tiktokMode ?? "direct"
  const title = (videoOptions?.title ?? content).slice(0, MAX_TITLE)
  const isDraft = mode === "draft"

  // Le mode brouillon (inbox) ne porte pas de post_info : l'utilisateur finalise
  // la légende et la confidentialité dans l'app TikTok.
  const body = isDraft
    ? { source_info: { source: "PULL_FROM_URL", video_url: videoUrl } }
    : {
        post_info: {
          title,
          privacy_level: videoOptions?.tiktokPrivacyLevel ?? "PUBLIC_TO_EVERYONE",
          disable_comment: false,
          disable_duet: false,
          disable_stitch: false,
        },
        source_info: { source: "PULL_FROM_URL", video_url: videoUrl },
      }

  try {
    const res = await fetch(isDraft ? DRAFT_URL : DIRECT_POST_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify(body),
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json().catch(() => ({}))

    // TikTok renvoie toujours un objet `error` ; `error.code === "ok"` = succès.
    const errorCode: string | undefined = data?.error?.code
    if (!res.ok || (errorCode && errorCode !== "ok")) {
      const detail = data?.error?.message || errorCode || `HTTP ${res.status}`
      return { platform: "tiktok", status: "failed", error: `TikTok : ${detail}` }
    }

    const publishId: string | undefined = data?.data?.publish_id
    return {
      platform: "tiktok",
      status: "published",
      postId: publishId,
    }
  } catch (err) {
    return {
      platform: "tiktok",
      status: "failed",
      error: `TikTok : ${err instanceof Error ? err.message : "Erreur réseau"}`,
    }
  }
}
