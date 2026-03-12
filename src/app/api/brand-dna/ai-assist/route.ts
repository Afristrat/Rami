/**
 * RAMI — Route API IA Brand DNA Assist
 * POST /api/brand-dna/ai-assist
 *
 * Actions :
 *  - generate      : Générer un texte (tagline, positioning) depuis le contexte Brand DNA
 *  - improve       : Améliorer un texte existant
 *  - prefill-section : Pré-remplir une section entière (identite | audience | style)
 *
 * Rate limit : 20 appels/heure/tenant (fail-open si table rate_limits absente)
 * Modèle     : Claude Haiku 4.5 (claude-haiku-4-5-20251001)
 */

import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { sanitizePromptInput } from "@/lib/utils/sanitize"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/* ─── Constants ─────────────────────────────────────────────────────────── */

const RATE_LIMIT_PER_HOUR = 20
const MODEL = "claude-haiku-4-5-20251001"

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

/* ─── Prompts ────────────────────────────────────────────────────────────── */

function buildPrompt(body: RequestBody): string {
  const { action, field, currentValue, section, context: ctx } = body

  const brand = ctx.brandName || "non précisé"
  const sector = ctx.sector || "non précisé"
  const objectif = ctx.objectifCognitif || "non précisé"

  if (action === "generate" && field === "tagline") {
    return `Tu es un expert en branding pour les marchés africains et MENA.
Génère une tagline percutante pour cette marque :
- Nom : ${brand}
- Secteur : ${sector}
- Objectif cognitif : ${objectif}

Contraintes : maximum 80 caractères, en français, mémorable et différenciante.
Retourne UNIQUEMENT la tagline, sans guillemets ni explication.`
  }

  if (action === "generate" && field === "positioning") {
    return `Tu es un stratège en branding spécialisé dans les marchés africains et MENA.
Génère une proposition de positionnement unique pour :
- Marque : ${brand}
- Secteur : ${sector}
- Objectif cognitif : ${objectif}

Contraintes : 80 à 300 caractères, en français, exprime clairement la différenciation concurrentielle.
Retourne UNIQUEMENT le texte du positionnement, sans explication.`
  }

  if (action === "improve" && field === "tagline") {
    const safe = sanitizePromptInput(currentValue || "")
    return `Tu es un expert en branding. Améliore cette tagline pour la rendre plus impactante :
Tagline actuelle : "${safe}"
Contexte : marque "${brand}" dans le secteur ${sector}.

Contraintes : maximum 80 caractères, en français, plus percutante que l'original.
Retourne UNIQUEMENT la tagline améliorée, sans guillemets ni explication.`
  }

  if (action === "improve" && field === "positioning") {
    const safe = sanitizePromptInput(currentValue || "")
    return `Tu es un stratège en branding. Améliore ce positionnement pour le rendre plus différenciant :
Positionnement actuel : "${safe}"
Contexte : marque "${brand}" dans le secteur ${sector}, objectif cognitif : ${objectif}.

Contraintes : 80 à 400 caractères, en français, plus spécifique que l'original.
Retourne UNIQUEMENT le positionnement amélioré, sans explication.`
  }

  if (action === "prefill-section" && section === "identite") {
    return `Tu es un expert en branding spécialisé dans les marchés africains et MENA.
Génère des contenus Brand DNA pour :
- Nom de la marque : ${brand}
- Secteur : ${sector}

Retourne UNIQUEMENT un objet JSON valide avec ces deux champs :
{
  "tagline": "slogan court et percutant (max 80 chars, en français)",
  "positioning": "proposition de valeur unique et différenciante (80-300 chars, en français)"
}
Aucun texte avant ou après le JSON.`
  }

  if (action === "prefill-section" && section === "audience") {
    return `Tu es un expert en marketing spécialisé dans les marchés africains et MENA.
Génère un profil d'audience pour :
- Marque : ${brand}
- Secteur : ${sector}
- Tagline : ${ctx.tagline || "non précisé"}
- Positionnement : ${sanitizePromptInput(ctx.positioning || "")}

Retourne UNIQUEMENT un objet JSON valide :
{
  "audienceDescription": "description détaillée de l'audience idéale (80-400 chars, en français)",
  "audienceAge": "tranche d'âge (ex : 28-45 ans)",
  "audienceLocation": "zone géographique (ex : Maroc, Tunisie, France...)",
  "audiencePainPoints": "3 douleurs principales, séparées par virgules (max 200 chars, en français)"
}
Aucun texte avant ou après le JSON.`
  }

  if (action === "prefill-section" && section === "style") {
    return `Tu es un expert en stratégie de marque.
Identifie le meilleur ton de voix pour :
- Marque : ${brand}
- Secteur : ${sector}
- Objectif cognitif : ${objectif}

Tons disponibles (retourne exactement l'id) :
- expert        : référence incontestable du secteur
- bienveillant  : lien émotionnel profond, chaleureux
- inspirant     : pousse à l'action et à se dépasser
- ludique       : marque mémorable via humour et créativité
- premium       : chaque mot reflète l'exclusivité
- direct        : va à l'essentiel, sans fioritures

Retourne UNIQUEMENT un objet JSON valide :
{
  "voiceTone": "id_du_ton_choisi"
}
Aucun texte avant ou après le JSON.`
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

  // ── Tenant ──────────────────────────────────────────────────────────────
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .single()

  if (userError || !userData?.tenant_id) {
    return NextResponse.json({ error: "Tenant introuvable." }, { status: 404 })
  }

  const tenantId = userData.tenant_id as string

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

  // ── Prompt ──────────────────────────────────────────────────────────────
  const prompt = buildPrompt(body)
  if (!prompt) {
    return NextResponse.json(
      { error: "Combinaison action/field/section non supportée." },
      { status: 400 }
    )
  }

  // ── Appel Claude Haiku ──────────────────────────────────────────────────
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    })

    const rawOutput =
      message.content[0].type === "text" ? message.content[0].text.trim() : ""

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
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: "Service IA temporairement indisponible." },
        { status: 503 }
      )
    }
    return NextResponse.json({ error: "Erreur interne. Réessayez." }, { status: 500 })
  }
}
