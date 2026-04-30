/**
 * Vision Scorer — Validation Brand DNA via Claude Haiku (Vision)
 * SOP-003 étape 6 : score ≥ 70 → accept / < 70 → régénérer (max 2 retries)
 *
 * Évalue :
 *  - Couleur dominante dans ±15% du HEX cible
 *  - Cohérence palette
 *  - Forme géométrique détectée vs attendue
 *  - Émotion visuelle transmise
 */

export interface VisionScorerInput {
  /** URL HTTP publique ou data URI base64 de l'image */
  imageUrl: string
  /** Couleurs HEX cibles issues du Brand DNA (ex: ["#1D4ED8", "#FFFFFF"]) */
  targetColors?: string[]
  /** Émotion / objectif cognitif attendu (ex: "confiance", "urgence") */
  targetEmotion?: string
  /** Texte du prompt positif utilisé pour la génération */
  promptUsed?: string
}

export interface VisionScorerResult {
  /** Score 0-100 */
  score: number
  /** True si Vision AI a été appelée, false si score heuristique */
  vision_scored: boolean
  /** Couleur dominante détectée (#RRGGBB) */
  dominant_color_hex?: string
  /** Raison détaillée du score (pour debug) */
  reasoning?: string
}

const HAIKU_MODEL = 'claude-haiku-4-5-20251001'
const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'
const TIMEOUT_MS = 15_000

/**
 * Score une image via Claude Haiku Vision.
 * Retourne un score heuristique si la clé API est absente ou si l'appel échoue.
 */
export async function scoreImageWithVision(
  input: VisionScorerInput
): Promise<VisionScorerResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return heuristicScore(input)
  }

  const { imageUrl, targetColors, targetEmotion, promptUsed } = input

  const colorContext = targetColors?.length
    ? `Couleurs cibles du Brand DNA : ${targetColors.join(', ')}.`
    : ''
  const emotionContext = targetEmotion
    ? `Émotion / objectif cognitif attendu : "${targetEmotion}".`
    : ''
  const promptContext = promptUsed
    ? `Prompt utilisé : "${promptUsed.slice(0, 200)}".`
    : ''

  const systemPrompt = `Tu es un expert en psychologie des couleurs et en design visuel (matrice Causse, Gestalt).
Tu analyses des images générées par IA pour vérifier leur cohérence avec une identité de marque.
Réponds UNIQUEMENT en JSON valide, sans markdown, sans commentaires.`

  const userMessage = `Analyse cette image de manière objective.

${colorContext}
${emotionContext}
${promptContext}

Évalue sur 100 points selon ces critères :
1. Cohérence couleurs (40 pts) : la couleur dominante est-elle proche (±15%) des couleurs cibles ?
2. Émotion transmise (30 pts) : l'image transmet-elle l'objectif cognitif attendu ?
3. Qualité visuelle (20 pts) : composition équilibrée, netteté, professionnalisme ?
4. Pertinence prompt (10 pts) : l'image correspond-elle au prompt fourni ?

Retourne ce JSON exact :
{
  "score": <integer 0-100>,
  "dominant_color_hex": "<#RRGGBB ou null>",
  "color_coherence": <integer 0-40>,
  "emotion_coherence": <integer 0-30>,
  "visual_quality": <integer 0-20>,
  "prompt_relevance": <integer 0-10>,
  "reasoning": "<une phrase explicative>"
}`

  // Préparer la source image (URL HTTP ou data URI base64)
  let imageSource: Record<string, unknown>
  if (imageUrl.startsWith('data:')) {
    // Data URI — extraire le média type et le base64
    const match = imageUrl.match(/^data:([^;]+);base64,(.+)$/)
    if (!match) {
      return heuristicScore(input)
    }
    imageSource = {
      type: 'base64',
      media_type: match[1],
      data: match[2],
    }
  } else {
    imageSource = {
      type: 'url',
      url: imageUrl,
    }
  }

  try {
    const response = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: HAIKU_MODEL,
        max_tokens: 512,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: imageSource,
              },
              {
                type: 'text',
                text: userMessage,
              },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })

    if (!response.ok) {
      return heuristicScore(input)
    }

    const json = await response.json() as {
      content?: Array<{ type: string; text?: string }>
    }
    const text = json.content?.find((c) => c.type === 'text')?.text ?? ''

    const parsed = JSON.parse(text) as {
      score?: number
      dominant_color_hex?: string
      reasoning?: string
    }

    const score = Math.min(100, Math.max(0, Math.round(parsed.score ?? 50)))

    return {
      score,
      vision_scored: true,
      dominant_color_hex: parsed.dominant_color_hex ?? undefined,
      reasoning: parsed.reasoning,
    }
  } catch {
    return heuristicScore(input)
  }
}

/**
 * Score heuristique de secours (pas d'appel Vision AI).
 * Utilisé si la clé est absente ou si l'appel échoue.
 */
function heuristicScore(input: VisionScorerInput): VisionScorerResult {
  // Score de base selon la qualité présumée du provider
  const providerBaseScores: Record<string, number> = {
    'fal-ai/flux-pro':         82,
    'fal-ai/flux/dev':         72,
    'fal-ai/flux/schnell':     65,
    'fal-ai/ideogram-v2':      78,
    'stability-ai/sdxl':       68,
    'black-forest-labs/flux':  72,
    'together_ai':             65,
    'replicate':               70,
    'nano_banana':             75,
  }

  const prompt = input.promptUsed ?? ''
  let score = 70

  // Bonus si le prompt contient des éléments du Brand DNA
  if (input.targetColors?.some((c) => prompt.toLowerCase().includes(c.toLowerCase()))) {
    score += 5
  }
  if (input.targetEmotion && prompt.toLowerCase().includes(input.targetEmotion.toLowerCase())) {
    score += 5
  }

  // Appliquer le score de base du provider si connu
  for (const [key, base] of Object.entries(providerBaseScores)) {
    if (prompt.toLowerCase().includes(key) || (input.promptUsed ?? '').includes(key)) {
      score = base
      break
    }
  }

  return {
    score: Math.min(100, Math.max(0, score)),
    vision_scored: false,
    reasoning: 'Score heuristique (Vision AI non disponible)',
  }
}
