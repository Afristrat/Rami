'use server'

// ============================================================
// Visual Actions — Server Actions pour la génération de visuels
// SOP-003 : Orchestration complète Brand DNA → Images générées
//           → Vision AI scoring → MinIO storage → DB persist
// ============================================================

import { createClient } from '@/lib/supabase/server'
import { normalizeBrandDNA } from '@/lib/services/brand-dna/normalize'
import { scoreCulturalCoherenceFromHex, type CulturalLevel } from '@/lib/services/brand-dna/cultural-scorer'
import { type GenerateBriefInput } from '@/lib/schemas/visual.schema'
import { checkGenerationQuota, getPlanConfig } from '@/lib/billing'
import { resolveUserTenant } from '@/lib/services/tenant/resolve'
// Cœur de génération partagé (US-052) : la logique réelle vit hors de ce fichier
// `'use server'` pour être réutilisable par l'API publique v1.
import { generateVisuals, type VisualGenerationResult } from '@/lib/services/visuals/generate-core'

// Ré-exporté pour préserver les imports existants (composants UI…).
export type { VisualGenerationResult }

/**
 * Action principale : génère 4 directions × N images à partir d'un brief.
 *
 * Pipeline SOP-003 :
 *   1. Charger Brand DNA + plan tenant
 *   2. Compiler 4 StructuredPrompts
 *   3. Générer images (provider chain : Fal → Replicate → Together)
 *   4. Valider via Vision AI Claude Haiku (score ≥ 70, 1 retry max)
 *   5. Stocker en MinIO (WebP 1200px, watermark si plan FREE)
 *   6. Persister session en DB (URLs permanentes)
 *   7. Retourner URLs permanentes au client
 */
export async function generateVisualsAction(
  input: GenerateBriefInput
): Promise<VisualGenerationResult> {
  const supabase = await createClient()

  // Auth check (session)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, session_id: '', visuals: [], error: 'Non authentifié' }
  }

  // Vérification quota générations — propre au parcours session
  // (l'API publique v1 applique son propre rate-limit côté authenticateApiRequest).
  const quotaCheck = await checkGenerationQuota()
  if (!quotaCheck.allowed) {
    const planConfig = getPlanConfig(quotaCheck.plan)
    const limit = planConfig.generationsPerMonth
    return {
      success: false,
      session_id: '',
      visuals: [],
      error: `Quota de générations atteint (${quotaCheck.count}/${limit} ce mois). Passez au plan supérieur pour continuer.`,
      quota_exceeded: { plan: quotaCheck.plan, count: quotaCheck.count, limit },
    }
  }

  // Résolution du contexte tenant depuis la session, puis délégation au cœur partagé.
  const resolvedTenantId = await resolveUserTenant(supabase, user.id)
  const { data: tenantData } = !resolvedTenantId
    ? { data: null }
    : await supabase
        .from('tenants')
        .select('id, plan, brand_dna, generation_count')
        .eq('id', resolvedTenantId)
        .single()

  return generateVisuals(
    {
      supabase,
      tenantId: tenantData?.id ?? user.id,
      plan: (tenantData?.plan as string) ?? 'free',
      brandDNARaw: tenantData?.brand_dna,
      tenantRowId: tenantData?.id ?? null,
      actorId: user.id,
    },
    input
  )
}

/**
 * Charge le Brand DNA du tenant courant pour préremplir l'interface
 */
export interface BrandDNASummary {
  sector?: string
  cognitiveObjective?: string
  primaryCulture?: string
  colorPalette?: Array<{ hex: string; name?: string; emotion?: string }>
}

export async function getTenantBrandDNAAction(): Promise<{
  hasDNA: boolean
  brandName?: string
  platform?: string
  cognitiveObjective?: string
  summary?: BrandDNASummary
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { hasDNA: false }

  const resolvedId = await resolveUserTenant(supabase, user.id)
  const { data } = !resolvedId ? { data: null } : await supabase
    .from('tenants')
    .select('brand_dna')
    .eq('id', resolvedId)
    .single()

  if (!data?.brand_dna) return { hasDNA: false }

  const dna = normalizeBrandDNA(data.brand_dna)
  const activePlatforms = dna.active_platforms ?? []

  const colorPalette = (dna.color_palette ?? [])
    .filter((c) => c.hex)
    .map((c) => ({ hex: c.hex as string, name: c.name, emotion: c.emotion }))
    .slice(0, 5)

  return {
    hasDNA: !!dna.identity?.name,
    brandName: dna.identity?.name,
    platform: activePlatforms[0] ?? 'instagram',
    cognitiveObjective: dna.cognitive_objective,
    summary: {
      sector: dna.identity?.sector,
      cognitiveObjective: dna.cognitive_objective,
      primaryCulture: dna.culture_markets?.primary_culture,
      colorPalette,
    },
  }
}

/**
 * Récupère les sessions visuelles récentes du tenant (pour l'historique)
 */
export async function getVisualSessionsAction(limit = 10): Promise<{
  sessions: Array<{
    id: string
    brief: string
    platform: string
    image_count: number
    created_at: string
  }>
  error?: string
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { sessions: [], error: 'Non authentifié' }

  const tenantId = await resolveUserTenant(supabase, user.id)
  if (!tenantId) return { sessions: [], error: 'Tenant introuvable' }

  const { data, error } = await supabase
    .from('visual_sessions')
    .select('id, brief, platform, image_count, created_at')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return { sessions: [], error: error.message }

  return {
    sessions: (data ?? []).map((s) => ({
      id: s.id,
      brief: s.brief,
      platform: s.platform,
      image_count: s.image_count,
      created_at: s.created_at,
    })),
  }
}

// ============================================================
// Données réelles du panneau latéral du workflow « Créer un post »
// (remplace le mock WorkflowSidebar : score 0.87 + historique inventés)
// ============================================================

export interface WorkflowSidebarBrandDNA {
  name: string
  /** Couleurs HEX réelles de la palette de marque. */
  colors: string[]
  /** Plateformes actives réelles (identifiants). */
  platforms: string[]
  /** Ton éditorial réel (voiceTone), si renseigné. */
  tone?: string
  /** Score de cohérence culturelle RÉEL (palette × secteur) — absent si le secteur n'a pas de règle Causse. */
  culturalScore?: { score: number; level: CulturalLevel }
}

export interface WorkflowSidebarHistoryItem {
  id: string
  title: string
  platform: string
  status: string
  createdAt: string
}

/**
 * Charge les données RÉELLES du panneau latéral : Brand DNA du tenant (couleurs,
 * plateformes, ton, score de cohérence culturelle calculé) + historique des posts
 * récents. Aucune donnée fabriquée : état vide honnête si rien à afficher.
 */
export async function getWorkflowSidebarDataAction(): Promise<{
  brandDNA: WorkflowSidebarBrandDNA | null
  history: WorkflowSidebarHistoryItem[]
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { brandDNA: null, history: [] }

  const tenantId = await resolveUserTenant(supabase, user.id)
  if (!tenantId) return { brandDNA: null, history: [] }

  // ── Brand DNA réel ──
  const { data: tenant } = await supabase
    .from('tenants')
    .select('brand_dna')
    .eq('id', tenantId)
    .single()

  let brandDNA: WorkflowSidebarBrandDNA | null = null
  if (tenant?.brand_dna) {
    const dna = normalizeBrandDNA(tenant.brand_dna)
    const name = dna.identity?.name
    if (name) {
      const colors = (dna.color_palette ?? [])
        .map((c) => c.hex)
        .filter((h): h is string => typeof h === 'string' && h.length > 0)
      const sector = dna.identity?.sector

      let culturalScore: WorkflowSidebarBrandDNA['culturalScore']
      if (sector && colors.length > 0) {
        const result = scoreCulturalCoherenceFromHex({ sector, hexColors: colors })
        // N'afficher un score que s'il repose sur de vraies règles Causse (sinon = neutre non significatif).
        if (result.hasRules) {
          culturalScore = { score: result.score, level: result.level }
        }
      }

      brandDNA = {
        name,
        colors,
        platforms: dna.active_platforms ?? [],
        tone: dna.editorial_tone?.register,
        culturalScore,
      }
    }
  }

  // ── Historique réel : posts récents du tenant ──
  const { data: postsData } = await supabase
    .from('posts')
    .select('id, title, content, platforms, status, created_at')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(5)

  const history: WorkflowSidebarHistoryItem[] = (postsData ?? []).map((p) => {
    const platforms = Array.isArray(p.platforms) ? p.platforms : []
    const title = (typeof p.title === 'string' && p.title.trim().length > 0)
      ? p.title.trim()
      : (typeof p.content === 'string' ? p.content.slice(0, 60) : '')
    return {
      id: p.id,
      title,
      platform: platforms.length > 0 ? String(platforms[0]) : '',
      status: p.status,
      createdAt: p.created_at,
    }
  })

  return { brandDNA, history }
}
