/**
 * RAMI — Route API IA Brand DNA Assist
 * POST /api/brand-dna/ai-assist
 *
 * Actions :
 *  - generate        : Générer un texte (tagline, positioning) depuis le contexte Brand DNA
 *  - improve         : Améliorer un texte existant
 *  - prefill-section : Pré-remplir une section entière (identite | audience | style)
 *
 * Rate limit : 20 appels/heure/tenant (fail-open si table rate_limits absente)
 * Modèle     : chargé depuis ai_prompts_config (jamais hardcodé ici)
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { sanitizePromptInput } from "@/lib/utils/sanitize"
import { getPromptConfig } from "@/lib/services/ai/prompt-config"
import { resolveUserTenant } from "@/lib/services/tenant/resolve"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/* ─── Constants ─────────────────────────────────────────────────────────── */

const RATE_LIMIT_PER_HOUR = 20

/* ─── Validation schema ──────────────────────────────────────────────────── */

const ContextSchema = z.object({
  brandName: z.string().max(100).optional().default(""),
  sector: z.string().max(100).optional().default(""),
  objectifCognitif: z.string().max(50).optional(),
  voiceTone: z.string().max(50).optional(),
  primaryCulture: z.string().max(50).optional(),
  tagline: z.string().max(150).optional(),
  positioning: z.string().max(500).optional(),
  audienceDescription: z.string().max(1000).optional(),
  audienceAge: z.string().max(100).optional(),
  audienceLocation: z.string().max(200).optional(),
  audiencePainPoints: z.string().max(500).optional(),
})

const RequestSchema = z.object({
  action: z.enum(["generate", "improve", "prefill-section"]),
  field: z.enum(["positioning", "tagline"]).optional(),
  currentValue: z.string().max(500).optional(),
  section: z.enum(["identite", "audience", "style"]).optional(),
  context: ContextSchema,
})

type RequestBody = z.infer<typeof RequestSchema>

/* ─── Rate limiting (Supabase, fail-open) ────────────────────────────────── */

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

async function checkRateLimit(
  supabase: SupabaseClient,
  tenantId: string
): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const windowStart = new Date(Date.now() - 3600 * 1000).toISOString()
    const { count, error } = await supabase
      .from("rate_limits")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("action", "ai_assist_brand_dna")
      .gte("created_at", windowStart)

    if (error) return { allowed: true, remaining: RATE_LIMIT_PER_HOUR } // fail-open
    const used = count ?? 0
    return {
      allowed: used < RATE_LIMIT_PER_HOUR,
      remaining: Math.max(0, RATE_LIMIT_PER_HOUR - used),
    }
  } catch {
    return { allowed: true, remaining: RATE_LIMIT_PER_HOUR } // fail-open
  }
}

async function recordUsage(supabase: SupabaseClient, tenantId: string): Promise<void> {
  try {
    await supabase.from("rate_limits").insert({
      tenant_id: tenantId,
      action: "ai_assist_brand_dna",
    })
  } catch {
    // fail-silent si table absente
  }
}

/* ─── Mapping action+field+section → field_key ───────────────────────────── */

function resolveFieldKey(body: RequestBody): string | null {
  const { action, field, section } = body

  if (action === "generate" && field === "tagline")    return "brand_dna_generate_tagline"
  if (action === "generate" && field === "positioning") return "brand_dna_generate_positioning"
  if (action === "improve"  && field === "tagline")    return "brand_dna_improve_tagline"
  if (action === "improve"  && field === "positioning") return "brand_dna_improve_positioning"
  if (action === "prefill-section" && section === "identite") return "brand_dna_prefill_identite"
  if (action === "prefill-section" && section === "audience") return "brand_dna_prefill_audience"
  if (action === "prefill-section" && section === "style")    return "brand_dna_prefill_style"

  return null
}

/* ─── Construction du message utilisateur (données contextuelles uniquement) */

function buildUserMessage(body: RequestBody): string {
  const { action, field, currentValue, section, context: ctx } = body

  const brand   = ctx.brandName || "non précisé"
  const sector  = ctx.sector    || "non précisé"
  const objectif = ctx.objectifCognitif || "non précisé"
  const culture  = ctx.primaryCulture   || "international"

  if (action === "generate" && field === "tagline") {
    return [
      `Marque : ${brand}`,
      `Secteur : ${sector}`,
      `Objectif cognitif : ${objectif}`,
      `Culture primaire : ${culture}`,
      `Contraintes : maximum 80 caractères, en français.`,
    ].join("\n")
  }

  if (action === "generate" && field === "positioning") {
    return [
      `Marque : ${brand}`,
      `Secteur : ${sector}`,
      `Objectif cognitif : ${objectif}`,
      `Tagline actuelle : ${ctx.tagline || "non précisé"}`,
      `Culture primaire : ${culture}`,
      `Contraintes : 80 à 300 caractères, en français.`,
    ].join("\n")
  }

  if (action === "improve" && field === "tagline") {
    const safe = sanitizePromptInput(currentValue || "")
    return [
      `Tagline actuelle : "${safe}"`,
      `Marque : ${brand}`,
      `Secteur : ${sector}`,
      `Contraintes : maximum 80 caractères, même langue que l'original.`,
    ].join("\n")
  }

  if (action === "improve" && field === "positioning") {
    const safe = sanitizePromptInput(currentValue || "")
    return [
      `Positionnement actuel : "${safe}"`,
      `Marque : ${brand}`,
      `Secteur : ${sector}`,
      `Objectif cognitif : ${objectif}`,
      `Contraintes : 80 à 400 caractères, même langue que l'original.`,
    ].join("\n")
  }

  if (action === "prefill-section" && section === "identite") {
    return [
      `Marque : ${brand}`,
      `Secteur : ${sector}`,
      `Culture primaire : ${culture}`,
    ].join("\n")
  }

  if (action === "prefill-section" && section === "audience") {
    return [
      `Marque : ${brand}`,
      `Secteur : ${sector}`,
      `Tagline : ${ctx.tagline || "non précisé"}`,
      `Positionnement : ${sanitizePromptInput(ctx.positioning || "")}`,
    ].join("\n")
  }

  if (action === "prefill-section" && section === "style") {
    return [
      `Marque : ${brand}`,
      `Secteur : ${sector}`,
      `Objectif cognitif : ${objectif}`,
      `Culture primaire : ${culture}`,
    ].join("\n")
  }

  return ""
}

/* ─── Handler principal ──────────────────────────────────────────────────── */

export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── Auth ────────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 })
  }

  // ── Appel LLM — supporte anthropic, moonshot (OpenAI-compatible), openai, openrouter ──
  async function callLLM(opts: {
    provider: string
    model: string
    systemPrompt: string
    userMessage: string
    apiKey: string | undefined
    maxTokens?: number
    temperature?: number
  }): Promise<string> {
    const { provider, model, systemPrompt, userMessage, apiKey, maxTokens = 512, temperature = 0.5 } = opts
    if (!apiKey) throw new Error(`Clé API manquante pour le provider ${provider}`)

    if (provider === "anthropic") {
      const res = await fetch(`${process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com"}/v1/messages`, {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({ model, max_tokens: maxTokens, system: systemPrompt,
          messages: [{ role: "user", content: userMessage }] }),
        signal: AbortSignal.timeout(30_000),
      })
      if (!res.ok) throw new Error(`Anthropic API ${res.status}`)
      const json = await res.json() as { content?: Array<{ text?: string }> }
      return json.content?.[0]?.text?.trim() ?? ""
    }

    if (provider === "google" || provider === "gemini") {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: userMessage }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: { maxOutputTokens: maxTokens, temperature },
          }),
          signal: AbortSignal.timeout(30_000),
        }
      )
      if (!res.ok) throw new Error(`Google Gemini API ${res.status}`)
      const json = await res.json() as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
      }
      return json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? ""
    }

    // moonshot, openai, openrouter, perplexity — tous OpenAI-compatible
    const baseUrl = provider === "moonshot"
      ? "https://api.moonshot.ai/v1"
      : provider === "openrouter"
      ? "https://openrouter.ai/api/v1"
      : provider === "perplexity"
      ? "https://api.perplexity.ai"
      : process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userMessage }],
        max_tokens: maxTokens,
        temperature,
      }),
      signal: AbortSignal.timeout(30_000),
    })
    if (!res.ok) throw new Error(`${provider} API ${res.status}`)
    const json = await res.json() as { choices?: Array<{ message?: { content?: string } }> }
    return json.choices?.[0]?.message?.content?.trim() ?? ""
  }

  // ── Tenant ──────────────────────────────────────────────────────────────
  const tenantId = await resolveUserTenant(supabase, user.id)

  if (!tenantId) {
    return NextResponse.json({ error: "Tenant introuvable." }, { status: 404 })
  }

  // ── Rate limit ──────────────────────────────────────────────────────────
  const { allowed, remaining } = await checkRateLimit(supabase, tenantId)
  if (!allowed) {
    return NextResponse.json(
      { error: "Limite atteinte : 20 appels IA par heure. Réessayez dans une heure." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Limit": String(RATE_LIMIT_PER_HOUR),
        },
      }
    )
  }

  // ── Validation ──────────────────────────────────────────────────────────
  let rawBody: unknown
  try {
    rawBody = await req.json()
  } catch {
    return NextResponse.json({ error: "Corps de la requête invalide." }, { status: 400 })
  }

  const parsed = RequestSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Paramètres invalides.", details: parsed.error.issues },
      { status: 400 }
    )
  }

  const body = parsed.data
  const { action, field, section } = body

  // Vérification des combinaisons requises
  if ((action === "generate" || action === "improve") && !field) {
    return NextResponse.json(
      { error: "Le champ 'field' est requis pour les actions generate/improve." },
      { status: 400 }
    )
  }
  if (action === "prefill-section" && !section) {
    return NextResponse.json(
      { error: "Le champ 'section' est requis pour l'action prefill-section." },
      { status: 400 }
    )
  }

  // ── Résolution du field_key et chargement de la config ──────────────────
  const fieldKey = resolveFieldKey(body)
  if (!fieldKey) {
    return NextResponse.json(
      { error: "Combinaison action/field/section non supportée." },
      { status: 400 }
    )
  }

  const config = await getPromptConfig(fieldKey)

  // ── Construction du message utilisateur ─────────────────────────────────
  const userMessage = buildUserMessage(body)
  if (!userMessage) {
    return NextResponse.json(
      { error: "Combinaison action/field/section non supportée." },
      { status: 400 }
    )
  }

  // ── Appel LLM via config DB ───────────────────────────────────────────
  try {
    const rawOutput = await callLLM({
      provider: config.provider,
      model: config.model,
      systemPrompt: config.systemPrompt,
      userMessage,
      apiKey: config.apiKey,
      maxTokens: 512,
      temperature: config.temperature,
    })

    // Enregistrement de l'usage (fail-silent)
    await recordUsage(supabase, tenantId)

    const rateLimitHeaders = {
      "X-RateLimit-Remaining": String(remaining - 1),
      "X-RateLimit-Limit": String(RATE_LIMIT_PER_HOUR),
    }

    // ── Parsing selon l'action ────────────────────────────────────────────
    if (action === "prefill-section") {
      const jsonMatch = rawOutput.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        return NextResponse.json(
          { error: "Réponse IA malformée. Réessayez." },
          { status: 422 }
        )
      }
      try {
        const fields = JSON.parse(jsonMatch[0]) as Record<string, string>
        return NextResponse.json({ fields }, { headers: rateLimitHeaders })
      } catch {
        return NextResponse.json(
          { error: "Réponse IA malformée. Réessayez." },
          { status: 422 }
        )
      }
    }

    // generate / improve → texte brut
    return NextResponse.json({ result: rawOutput }, { headers: rateLimitHeaders })
  } catch (err) {
    const message = err instanceof Error ? err.message : ""
    if (message.includes("API 4") || message.includes("API 5")) {
      return NextResponse.json(
        { error: "Service IA temporairement indisponible." },
        { status: 503 }
      )
    }
    return NextResponse.json({ error: "Erreur interne. Réessayez." }, { status: 500 })
  }
}
