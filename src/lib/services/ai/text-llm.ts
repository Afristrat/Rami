// ============================================================
// Appel LLM texte unifié (multi-provider) — module serveur partagé
// ============================================================
// Centralise l'appel d'un modèle texte selon le provider de la config
// (cf. getPromptConfig). Le provider "openai" route vers le proxy
// OpenAI-compatible (OPENAI_BASE_URL → LiteLLM). "anthropic" garde l'API native.
// Extrait de workflow.actions pour réutilisation (US-028 scoring leads, etc.).

import Anthropic from "@anthropic-ai/sdk"
import type { PromptProvider } from "@/lib/services/ai/prompt-config"

export interface CallTextLLMOptions {
  provider: PromptProvider
  model: string
  apiKey: string | undefined
  systemPrompt: string
  userPrompt: string
  maxTokens: number
  temperature: number
}

/** Appelle un modèle texte et renvoie le contenu brut (string, jamais null). */
export async function callTextLLM(opts: CallTextLLMOptions): Promise<string> {
  const { provider, model, apiKey, systemPrompt, userPrompt, maxTokens, temperature } = opts

  if (provider === "anthropic") {
    const anthropic = new Anthropic({ apiKey })
    const response = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: userPrompt }],
      system: systemPrompt,
    })
    return response.content[0].type === "text" ? response.content[0].text : ""
  }

  if (provider === "google") {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { maxOutputTokens: maxTokens, temperature },
        }),
        signal: AbortSignal.timeout(30_000),
      }
    )
    if (!res.ok) throw new Error(`Google Gemini API ${res.status}`)
    const json = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    }
    return json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? ""
  }

  // openai (proxy), openrouter, perplexity, moonshot — tous OpenAI-compatible
  const baseUrl =
    provider === "moonshot"
      ? "https://api.moonshot.ai/v1"
      : provider === "openrouter"
        ? "https://openrouter.ai/api/v1"
        : provider === "perplexity"
          ? "https://api.perplexity.ai"
          : process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: maxTokens,
      temperature,
    }),
    signal: AbortSignal.timeout(30_000),
  })
  if (!res.ok) throw new Error(`${provider} API ${res.status}`)
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> }
  return json.choices?.[0]?.message?.content?.trim() ?? ""
}
