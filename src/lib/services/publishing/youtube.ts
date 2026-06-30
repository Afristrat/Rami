/**
 * Publisher YouTube — Data API v3, upload résumable.
 * Flow : POST (session résumable, métadonnées) → PUT (binaire vidéo).
 * YouTube classe automatiquement en Short si la vidéo est verticale et courte ;
 * on uploade donc le fichier tel quel (tout ratio accepté).
 * Une vidéo est obligatoire — sinon erreur explicite.
 */

import type { PublisherInput, PublishResult, YouTubePrivacy } from "./types"

const RESUMABLE_URL =
  "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status"
const MAX_TITLE = 100 // limite YouTube

/** Dérive un titre lisible depuis le contenu (1ʳᵉ ligne non vide, tronquée). */
function deriveTitle(content: string): string {
  const firstLine = content.split("\n").map((l) => l.trim()).find((l) => l.length > 0) ?? "Vidéo"
  return firstLine.length > MAX_TITLE ? firstLine.slice(0, MAX_TITLE - 1) + "…" : firstLine
}

export async function publishToYouTube(input: PublisherInput): Promise<PublishResult> {
  const { accessToken, content, mediaUrls, videoOptions } = input

  const videoUrl = mediaUrls?.[0]
  if (!videoUrl) {
    return {
      platform: "youtube",
      status: "failed",
      error: "YouTube : une vidéo est obligatoire pour publier. Générez ou ajoutez une vidéo au post.",
    }
  }

  const title = videoOptions?.title ?? deriveTitle(content)
  const privacyStatus: YouTubePrivacy = videoOptions?.privacyStatus ?? "public"

  try {
    // 1. Télécharger la vidéo depuis le stockage (URL MinIO publique).
    const videoRes = await fetch(videoUrl)
    if (!videoRes.ok) {
      return {
        platform: "youtube",
        status: "failed",
        error: `YouTube : téléchargement de la vidéo source échoué (HTTP ${videoRes.status}).`,
      }
    }
    const contentType = videoRes.headers.get("content-type") ?? "video/*"
    const videoBuffer = Buffer.from(await videoRes.arrayBuffer())

    // 2. Ouvrir une session d'upload résumable avec les métadonnées.
    const sessionRes = await fetch(RESUMABLE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": contentType,
        "X-Upload-Content-Length": String(videoBuffer.length),
      },
      body: JSON.stringify({
        snippet: { title, description: content },
        status: { privacyStatus },
      }),
    })

    if (!sessionRes.ok) {
      const body = await sessionRes.text().catch(() => "")
      let detail = `HTTP ${sessionRes.status}`
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parsed: any = JSON.parse(body)
        detail = parsed?.error?.message ?? detail
      } catch {
        if (body) detail = body.slice(0, 200)
      }
      return { platform: "youtube", status: "failed", error: `YouTube (session) : ${detail}` }
    }

    const uploadUrl = sessionRes.headers.get("location")
    if (!uploadUrl) {
      return { platform: "youtube", status: "failed", error: "YouTube : URL d'upload résumable absente." }
    }

    // 3. Envoyer le binaire vidéo.
    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType, "Content-Length": String(videoBuffer.length) },
      body: videoBuffer,
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const uploadData: any = await uploadRes.json().catch(() => ({}))

    if (!uploadRes.ok || uploadData?.error) {
      const detail = uploadData?.error?.message ?? `HTTP ${uploadRes.status}`
      return { platform: "youtube", status: "failed", error: `YouTube (upload) : ${detail}` }
    }

    const videoId: string | undefined = uploadData?.id
    return {
      platform: "youtube",
      status: "published",
      postId: videoId,
      postUrl: videoId ? `https://www.youtube.com/watch?v=${videoId}` : undefined,
    }
  } catch (err) {
    return {
      platform: "youtube",
      status: "failed",
      error: `YouTube : ${err instanceof Error ? err.message : "Erreur réseau"}`,
    }
  }
}
