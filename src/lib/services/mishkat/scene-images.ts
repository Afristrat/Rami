// ============================================================
// Mishkāt — Flux v2 « image contextuelle par scène ».
// À partir d'un storyboard renvoyé par Mishkāt (chaque scène porte un
// `image_prompt` déjà calibré côté studio via psychology), RAMI génère UNE
// image de fond par scène (provider image souverain), la stocke sur MinIO et
// renvoie la carte `{ sceneId: urlPublique }` attendue par `createProduction`.
// Module serveur pur (réutilisable par un worker pg-boss).
// ============================================================

import { generateImage } from '@/lib/services/image-generation'
import { uploadToStorage, buildStoragePath } from '@/lib/services/storage/client'
import { log } from '@/lib/utils/logger'
import type { MishkatStoryboard, MishkatAspect } from './types'

/** Dimensions du fond de scène par aspect (plein cadre vidéo). */
const ASPECT_DIMS: Record<MishkatAspect, { width: number; height: number }> = {
  '16:9': { width: 1920, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
  '1:1': { width: 1080, height: 1080 },
}

// Le texte est incrusté par Mishkāt par-dessus le fond → on l'exclut de l'image.
const SCENE_NEGATIVE_PROMPT =
  'texte, mots, lettres, chiffres, typographie, watermark, logo, sous-titres, légende, cadre, bordure, flou, basse qualité'

export interface SceneImagesResult {
  /** Carte sceneId → URL publique MinIO (à passer en `sceneImages`). */
  sceneImages: Record<string, string>
  /** Scènes sans `image_prompt` (ignorées) ou dont la génération a échoué. */
  skipped: string[]
}

/** Convertit l'image générée (URL provider) en WebP plein cadre stocké sur MinIO. */
async function storeSceneImage(tenantId: string, sceneId: string, sourceUrl: string): Promise<string | null> {
  const res = await fetch(sourceUrl)
  if (!res.ok) return null
  const rawBuffer = Buffer.from(await res.arrayBuffer())
  const sharp = (await import('sharp')).default
  const webp = await sharp(rawBuffer)
    .rotate()
    .resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 88 })
    .toBuffer()

  const path = buildStoragePath(tenantId, `scene-${sceneId}.webp`)
  const { data, error } = await uploadToStorage({ prefix: 'media', path, buffer: webp, mimeType: 'image/webp' })
  if (error || !data) return null
  return data.publicUrl
}

/**
 * Génère une image de fond par scène du storyboard. Les scènes sont traitées en
 * parallèle (chaîne de providers gérée par `generateImage`). Une scène sans
 * `image_prompt` ou dont la génération échoue est ignorée (Mishkāt retombe alors
 * sur son fond par défaut) — jamais d'échec global bloquant.
 */
export async function generateSceneImages(
  tenantId: string,
  storyboard: MishkatStoryboard,
  aspect: MishkatAspect,
): Promise<SceneImagesResult> {
  const dims = ASPECT_DIMS[aspect] ?? ASPECT_DIMS['16:9']
  const scenes = Array.isArray(storyboard.scenes) ? storyboard.scenes : []

  const results = await Promise.all(
    scenes.map(async (scene) => {
      const prompt = typeof scene.image_prompt === 'string' ? scene.image_prompt.trim() : ''
      if (!scene.id || prompt.length < 3) return { id: scene.id ?? '', url: null as string | null }
      try {
        const gen = await generateImage({
          positive_prompt: prompt,
          negative_prompt: SCENE_NEGATIVE_PROMPT,
          width: dims.width,
          height: dims.height,
          guidance_scale: 9,
          num_inference_steps: 32,
          num_images: 1,
        })
        const src = gen.images[0]?.url
        if (!src) return { id: scene.id, url: null }
        const url = await storeSceneImage(tenantId, scene.id, src)
        return { id: scene.id, url }
      } catch (err) {
        log({
          level: 'error',
          module: 'mishkat.scene-images',
          action: 'scene_image_failed',
          tenant_id: tenantId,
          metadata: { sceneId: scene.id, error: err instanceof Error ? err.message : String(err) },
        })
        return { id: scene.id, url: null }
      }
    }),
  )

  const sceneImages: Record<string, string> = {}
  const skipped: string[] = []
  for (const r of results) {
    if (r.url) sceneImages[r.id] = r.url
    else if (r.id) skipped.push(r.id)
  }
  return { sceneImages, skipped }
}
