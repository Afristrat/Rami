// ============================================================
// POST /api/video/improve-brief — améliore l'intention d'un brief vidéo
// Réutilise le routage LLM existant (getPromptConfig + callTextLLM) avec un
// system prompt dédié à la vidéo sociale bilingue. Contexte = Brand DNA tenant.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { resolveUserTenant } from '@/lib/services/tenant/resolve'
import { getBrandDnaAction } from '@/lib/actions/brand-dna.actions'
import { getPromptConfig } from '@/lib/services/ai/prompt-config'
import { callTextLLM } from '@/lib/services/ai/text-llm'
import { log } from '@/lib/utils/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BodySchema = z.object({ intent: z.string().min(1).max(1000) })

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const tenantId = await resolveUserTenant(supabase, user.id)
  if (!tenantId) return NextResponse.json({ error: 'Tenant introuvable.' }, { status: 404 })

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corps invalide.' }, { status: 400 })
  }
  const parsed = BodySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Intention invalide.' }, { status: 400 })
  }

  const dnaResult = await getBrandDnaAction()
  const dna = 'data' in dnaResult ? dnaResult.data : null
  const ctx = [
    dna?.brandName ? `Marque : ${dna.brandName}` : null,
    dna?.sector ? `Secteur : ${dna.sector}` : null,
    dna?.voiceTone ? `Ton de marque : ${dna.voiceTone}` : null,
    dna?.positioning ? `Positionnement : ${dna.positioning}` : null,
  ].filter(Boolean).join('\n')

  const systemPrompt = [
    "Tu es un expert en brief créatif pour vidéos social media bilingues (français/arabe).",
    "On te donne l'intention brute d'une vidéo. Réécris-la pour la rendre plus claire, spécifique et orientée résultat :",
    "qui est l'audience, quelle émotion viser, quel message clé, quelle action attendue.",
    "Reste concis (2 à 4 phrases), en français, sans jargon. N'invente pas de faits.",
    "Réponds UNIQUEMENT par le brief amélioré, sans préambule ni guillemets.",
    ctx ? `\nContexte de marque :\n${ctx}` : '',
  ].join(' ')

  try {
    const config = await getPromptConfig('brand_dna_improve_positioning')
    const result = await callTextLLM({
      provider: config.provider,
      model: config.model,
      apiKey: config.apiKey,
      systemPrompt,
      userPrompt: parsed.data.intent,
      maxTokens: 400,
      temperature: 0.6,
    })
    const improved = result.trim()
    if (!improved) return NextResponse.json({ error: "L'IA n'a pas pu améliorer le brief." }, { status: 502 })
    return NextResponse.json({ result: improved })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur LLM'
    log({ level: 'error', module: 'mishkat', action: 'improve_brief_failed', tenant_id: tenantId, metadata: { error: message } })
    return NextResponse.json({ error: "Échec de l'amélioration du brief." }, { status: 502 })
  }
}
