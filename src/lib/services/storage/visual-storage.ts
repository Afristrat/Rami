/**
 * Visual Storage — Download, watermark, WebP conversion, upload vers MinIO
 * Gère deux types de sources :
 *   1. HTTP URL (Fal.ai, Replicate, Together AI) — fetch direct
 *   2. Data URI base64 (Nano Banana / Gemini 3 Pro Image) — decode base64
 *
 * SOP-003 étape 5 : compression WebP + archivage MinIO
 * Plan FREE → watermark automatique (coin bas-droite, semi-transparent)
 */

import { uploadToStorage, BUCKETS, buildStoragePath } from './client'

export interface StoreVisualParams {
  /** URL HTTP ou data URI base64 de l'image source */
  imageUrl: string
  tenantId: string
  sessionId: string
  directionId: number
  index: number
  /** Si true, ajoute le watermark RAMI */
  addWatermark?: boolean
}

export interface StoreVisualResult {
  minio_path: string
  public_url: string | null
  signed_url: string | null
  file_size_bytes: number
  width: number
  height: number
  format: 'webp'
}

/**
 * Télécharge l'image depuis la source, la convertit en WebP 1200px max,
 * applique un watermark si demandé, puis l'upload vers MinIO (préfixe `media`).
 */
export async function storeVisual(
  params: StoreVisualParams
): Promise<{ data: StoreVisualResult | null; error: string | null }> {
  const { imageUrl, tenantId, sessionId, directionId, index, addWatermark } = params

  try {
    // ── 1. Télécharger / décoder l'image source
    const rawBuffer = await fetchImageBuffer(imageUrl)

    // ── 2. Convertir en WebP 1200px max via sharp
    const sharp = (await import('sharp')).default
    let pipeline = sharp(rawBuffer)
      .rotate() // Correction EXIF auto
      .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })

    // ── 3. Watermark (plan FREE) — texte RAMI en bas à droite
    if (addWatermark) {
      const metadata = await sharp(rawBuffer).metadata()
      const w = Math.min(metadata.width ?? 1200, 1200)
      const h = Math.min(metadata.height ?? 1200, 1200)

      const watermarkSvg = buildWatermarkSvg(w, h)
      const watermarkBuffer = Buffer.from(watermarkSvg)

      pipeline = sharp(rawBuffer)
        .rotate()
        .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
        .composite([{ input: watermarkBuffer, gravity: 'southeast' }])
    }

    const { data: webpBuffer, info } = await pipeline
      .webp({ quality: 85, effort: 4 })
      .toBuffer({ resolveWithObject: true })

    // ── 4. Upload vers MinIO (préfixe `media`, bucket public)
    const filename = `d${directionId}-${index}-${sessionId.slice(0, 8)}.webp`
    const path = buildStoragePath(tenantId, filename)

    const { data: uploadData, error: uploadError } = await uploadToStorage({
      bucket: BUCKETS.media,
      path,
      buffer: webpBuffer,
      mimeType: 'image/webp',
    })

    if (uploadError || !uploadData) {
      return { data: null, error: uploadError?.message ?? 'Erreur upload MinIO' }
    }

    return {
      data: {
        minio_path:      uploadData.path,
        public_url:      uploadData.publicUrl,
        signed_url:      uploadData.signedUrl,
        file_size_bytes: info.size,
        width:           info.width,
        height:          info.height,
        format:          'webp',
      },
      error: null,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { data: null, error: `Erreur stockage visuel : ${message}` }
  }
}

// ── Helpers privés ─────────────────────────────────────────────────────────

/**
 * Récupère le buffer brut de l'image quelle que soit sa source.
 */
async function fetchImageBuffer(imageUrl: string): Promise<Buffer> {
  // Data URI base64 (Gemini / Nano Banana)
  if (imageUrl.startsWith('data:')) {
    const match = imageUrl.match(/^data:[^;]+;base64,(.+)$/)
    if (!match?.[1]) throw new Error('Data URI base64 invalide')
    return Buffer.from(match[1], 'base64')
  }

  // URL HTTP(S)
  const response = await fetch(imageUrl, {
    signal: AbortSignal.timeout(30_000),
  })

  if (!response.ok) {
    throw new Error(`Impossible de télécharger l'image : ${response.status}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

/**
 * Génère un SVG watermark adapté aux dimensions de l'image.
 */
function buildWatermarkSvg(imageWidth: number, _imageHeight: number): string {
  const fontSize = Math.max(14, Math.round(imageWidth * 0.025))
  const padding = Math.round(fontSize * 0.8)
  const textWidth = Math.round(fontSize * 3.2) // "RAMI" + espace
  const bgWidth = textWidth + padding * 2
  const bgHeight = fontSize + padding * 2

  return `<svg width="${bgWidth}" height="${bgHeight}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${bgWidth}" height="${bgHeight}" rx="4" fill="rgba(0,0,0,0.45)" />
  <text
    x="${bgWidth / 2}"
    y="${bgHeight / 2}"
    text-anchor="middle"
    dominant-baseline="central"
    font-family="Arial, sans-serif"
    font-size="${fontSize}"
    font-weight="600"
    letter-spacing="2"
    fill="rgba(255,255,255,0.75)"
  >RAMI</text>
</svg>`
}
