// ============================================================
// Whisper — service de transcription audio (US-022)
// ============================================================
// Appelle l'endpoint OpenAI-compatible `/audio/transcriptions` (modèle whisper-1).
// Clé + base URL configurables :
//   - WHISPER_API_KEY  (défaut : OPENAI_API_KEY)
//   - WHISPER_BASE_URL (défaut : https://api.openai.com/v1 ; peut pointer un proxy
//     LiteLLM compatible si celui-ci route Whisper)
// La clé est INJECTÉE par l'appelant (testable) ; dégradation propre si absente.
//
// ⚠️ L'API Whisper plafonne à 25 Mo par requête → les fichiers plus gros sont
// refusés ici (chunking = story ultérieure). Le mapping de langue est PUR.

export const WHISPER_MAX_BYTES = 25 * 1024 * 1024 // 25 Mo (limite API OpenAI)
const WHISPER_MODEL = "whisper-1"

export type TranscribeResult =
  | { success: true; text: string }
  | { success: false; reason: "no_key" | "too_large" | "not_found" | "error"; message?: string }

export interface TranscribeInput {
  buffer: Buffer
  filename: string
  mimeType: string
  /** Langue audio (UI : fr | ar | darija | en | es). */
  language?: string
}

/**
 * Convertit la langue UI vers un code ISO-639-1 accepté par Whisper.
 * « darija » (arabe marocain) → « ar » (Whisper n'a pas de code dédié). PUR.
 */
export function toWhisperLanguage(language: string | undefined): string | undefined {
  if (!language) return undefined
  const map: Record<string, string> = { fr: "fr", ar: "ar", darija: "ar", en: "en", es: "es" }
  return map[language] ?? undefined
}

function whisperBaseUrl(): string {
  return process.env.WHISPER_BASE_URL || "https://api.openai.com/v1"
}

/**
 * Transcrit un buffer audio via Whisper. `apiKey` injectée (BYOK/env).
 * Dégradation propre : no_key (clé absente/invalide), too_large (> 25 Mo),
 * not_found (texte vide), error (réseau/HTTP).
 */
export async function transcribeAudio(
  input: TranscribeInput,
  apiKey: string | undefined
): Promise<TranscribeResult> {
  if (!apiKey) return { success: false, reason: "no_key" }
  if (input.buffer.length > WHISPER_MAX_BYTES) {
    return {
      success: false,
      reason: "too_large",
      message: `Fichier trop volumineux pour la transcription (max ${Math.floor(WHISPER_MAX_BYTES / (1024 * 1024))} Mo par requête).`,
    }
  }

  const form = new FormData()
  // Uint8Array depuis le Buffer pour un Blob valide côté runtime Node.
  const bytes = new Uint8Array(input.buffer)
  form.append("file", new Blob([bytes], { type: input.mimeType || "application/octet-stream" }), input.filename)
  form.append("model", WHISPER_MODEL)
  const lang = toWhisperLanguage(input.language)
  if (lang) form.append("language", lang)

  try {
    const res = await fetch(`${whisperBaseUrl()}/audio/transcriptions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
      signal: AbortSignal.timeout(120_000),
    })

    if (res.status === 401 || res.status === 403) {
      return { success: false, reason: "no_key", message: "Clé Whisper invalide." }
    }
    if (!res.ok) {
      return { success: false, reason: "error", message: `Whisper HTTP ${res.status}` }
    }

    const json = (await res.json()) as { text?: string }
    const text = (json.text ?? "").trim()
    if (!text) return { success: false, reason: "not_found", message: "Transcription vide." }
    return { success: true, text }
  } catch (err) {
    return { success: false, reason: "error", message: err instanceof Error ? err.message : String(err) }
  }
}

/** Résout la clé Whisper : WHISPER_API_KEY puis OPENAI_API_KEY (fallback proxy). */
export function resolveWhisperKey(): string | undefined {
  return process.env.WHISPER_API_KEY || process.env.OPENAI_API_KEY || undefined
}
