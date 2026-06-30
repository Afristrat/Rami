import { publishToYouTube } from "@/lib/services/publishing/youtube"
import { publishToTikTok } from "@/lib/services/publishing/tiktok"
import type { PublisherInput } from "@/lib/services/publishing/types"

const base: PublisherInput = {
  accessToken: "tok",
  content: "Titre de la vidéo\nDescription longue du post.",
  mediaUrls: ["https://s3-rami.example/video.mp4"],
}

afterEach(() => jest.restoreAllMocks())

describe("publishToYouTube", () => {
  it("échoue proprement sans vidéo", async () => {
    const res = await publishToYouTube({ ...base, mediaUrls: [] })
    expect(res.status).toBe("failed")
    expect(res.error).toMatch(/vidéo est obligatoire/)
  })

  it("happy path : download → session résumable → PUT → published", async () => {
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(
        new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { "content-type": "video/mp4" } })
      )
      .mockResolvedValueOnce(
        new Response(null, { status: 200, headers: { location: "https://upload.example/sess" } })
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "vid123" }), { status: 200 }))

    const res = await publishToYouTube(base)
    expect(res.status).toBe("published")
    expect(res.postId).toBe("vid123")
    expect(res.postUrl).toBe("https://www.youtube.com/watch?v=vid123")

    // La session porte les métadonnées (titre dérivé de la 1ʳᵉ ligne) + privacy défaut public.
    const sessionBody = JSON.parse(fetchMock.mock.calls[1][1]?.body as string)
    expect(sessionBody.snippet.title).toBe("Titre de la vidéo")
    expect(sessionBody.status.privacyStatus).toBe("public")
  })

  it("respecte la visibilité configurée", async () => {
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(new Response(new Uint8Array([1]), { status: 200, headers: { "content-type": "video/mp4" } }))
      .mockResolvedValueOnce(new Response(null, { status: 200, headers: { location: "https://upload.example/s" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "v" }), { status: 200 }))

    await publishToYouTube({ ...base, videoOptions: { privacyStatus: "unlisted", title: "Custom" } })
    const sessionBody = JSON.parse(fetchMock.mock.calls[1][1]?.body as string)
    expect(sessionBody.status.privacyStatus).toBe("unlisted")
    expect(sessionBody.snippet.title).toBe("Custom")
  })

  it("remonte l'erreur de session YouTube", async () => {
    jest
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(new Response(new Uint8Array([1]), { status: 200, headers: { "content-type": "video/mp4" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { message: "quota" } }), { status: 403 }))

    const res = await publishToYouTube(base)
    expect(res.status).toBe("failed")
    expect(res.error).toMatch(/quota/)
  })
})

describe("publishToTikTok", () => {
  it("échoue proprement sans vidéo", async () => {
    const res = await publishToTikTok({ ...base, mediaUrls: [] })
    expect(res.status).toBe("failed")
    expect(res.error).toMatch(/vidéo est obligatoire/)
  })

  it("Direct Post (défaut) : init video → published avec publish_id", async () => {
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { publish_id: "pub1" }, error: { code: "ok" } }), { status: 200 }))

    const res = await publishToTikTok(base)
    expect(res.status).toBe("published")
    expect(res.postId).toBe("pub1")

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe("https://open.tiktokapis.com/v2/post/publish/video/init/")
    const body = JSON.parse(init?.body as string)
    expect(body.post_info.privacy_level).toBe("PUBLIC_TO_EVERYONE")
    expect(body.source_info).toEqual({ source: "PULL_FROM_URL", video_url: base.mediaUrls?.[0] })
  })

  it("mode brouillon : cible l'endpoint inbox, sans post_info", async () => {
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { publish_id: "draft1" }, error: { code: "ok" } }), { status: 200 }))

    const res = await publishToTikTok({ ...base, videoOptions: { tiktokMode: "draft" } })
    expect(res.status).toBe("published")

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe("https://open.tiktokapis.com/v2/post/publish/inbox/video/init/")
    const body = JSON.parse(init?.body as string)
    expect(body.post_info).toBeUndefined()
    expect(body.source_info.source).toBe("PULL_FROM_URL")
  })

  it("remonte une erreur TikTok (error.code != ok)", async () => {
    jest
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { code: "invalid_params", message: "url non vérifiée" } }), { status: 200 }))

    const res = await publishToTikTok(base)
    expect(res.status).toBe("failed")
    expect(res.error).toMatch(/url non vérifiée/)
  })
})
