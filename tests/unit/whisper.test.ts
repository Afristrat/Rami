import { transcribeAudio, toWhisperLanguage, WHISPER_MAX_BYTES } from "@/lib/services/transcription/whisper"

// ─── toWhisperLanguage (PUR) ─────────────────────────────────────────────────

describe("toWhisperLanguage", () => {
  test("mappe les langues UI vers ISO-639-1 ; darija → ar", () => {
    expect(toWhisperLanguage("fr")).toBe("fr")
    expect(toWhisperLanguage("darija")).toBe("ar")
    expect(toWhisperLanguage("en")).toBe("en")
    expect(toWhisperLanguage("es")).toBe("es")
  })
  test("inconnu / vide → undefined", () => {
    expect(toWhisperLanguage("xx")).toBeUndefined()
    expect(toWhisperLanguage(undefined)).toBeUndefined()
  })
})

// ─── transcribeAudio ─────────────────────────────────────────────────────────

describe("transcribeAudio", () => {
  const ORIGINAL_FETCH = global.fetch
  afterEach(() => { global.fetch = ORIGINAL_FETCH })

  const smallBuf = Buffer.from("fake audio bytes")

  test("sans clé → no_key (pas d'appel réseau)", async () => {
    const spy = jest.fn()
    global.fetch = spy as unknown as typeof fetch
    const r = await transcribeAudio({ buffer: smallBuf, filename: "a.mp3", mimeType: "audio/mpeg", language: "fr" }, undefined)
    expect(r).toEqual({ success: false, reason: "no_key" })
    expect(spy).not.toHaveBeenCalled()
  })

  test("fichier > 25 Mo → too_large (sans réseau)", async () => {
    const spy = jest.fn()
    global.fetch = spy as unknown as typeof fetch
    // Objet avec length au-delà de la limite (le check de taille précède l'usage des octets).
    const huge = { length: WHISPER_MAX_BYTES + 1 } as unknown as Buffer
    const r = await transcribeAudio({ buffer: huge, filename: "a.mp3", mimeType: "audio/mpeg" }, "k")
    expect(r.success).toBe(false)
    if (!r.success) expect(r.reason).toBe("too_large")
    expect(spy).not.toHaveBeenCalled()
  })

  test("succès (mock) → texte + Authorization Bearer", async () => {
    let auth = ""
    global.fetch = (async (_url: string, init: RequestInit) => {
      auth = (init.headers as Record<string, string>).Authorization
      return new Response(JSON.stringify({ text: "  Bonjour le monde  " }), { status: 200 })
    }) as unknown as typeof fetch
    const r = await transcribeAudio({ buffer: smallBuf, filename: "a.mp3", mimeType: "audio/mpeg", language: "fr" }, "secret")
    expect(r.success).toBe(true)
    if (r.success) expect(r.text).toBe("Bonjour le monde")
    expect(auth).toBe("Bearer secret")
  })

  test("HTTP 401 → no_key ; 500 → error ; texte vide → not_found", async () => {
    global.fetch = (async () => new Response("", { status: 401 })) as unknown as typeof fetch
    const r1 = await transcribeAudio({ buffer: smallBuf, filename: "a.mp3", mimeType: "audio/mpeg" }, "k")
    expect(r1.success).toBe(false); if (!r1.success) expect(r1.reason).toBe("no_key")

    global.fetch = (async () => new Response("", { status: 500 })) as unknown as typeof fetch
    const r2 = await transcribeAudio({ buffer: smallBuf, filename: "a.mp3", mimeType: "audio/mpeg" }, "k")
    expect(r2.success).toBe(false); if (!r2.success) expect(r2.reason).toBe("error")

    global.fetch = (async () => new Response(JSON.stringify({ text: "   " }), { status: 200 })) as unknown as typeof fetch
    const r3 = await transcribeAudio({ buffer: smallBuf, filename: "a.mp3", mimeType: "audio/mpeg" }, "k")
    expect(r3.success).toBe(false); if (!r3.success) expect(r3.reason).toBe("not_found")
  })
})
