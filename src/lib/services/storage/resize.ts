/**
 * Redimensionnement automatique des images via sharp.
 * Convertit systématiquement en WebP pour optimiser le stockage et la performance.
 */

// Préréglages par contexte d'utilisation
export type ResizePreset =
  | "logo"          // Logo tenant — carré 256px
  | "thumbnail"     // Vignette galerie — 400px
  | "post"          // Image de post — 1200px max
  | "og"            // Open Graph — 1200×630
  | "avatar"        // Avatar compte — 200px carré
  | "original"      // Conserve les dimensions, juste WebP

export interface ResizeOptions {
  preset?: ResizePreset
  width?: number
  height?: number
  quality?: number     // 1-100, défaut 85
  keepOriginal?: boolean  // Si true, retourne aussi le buffer original
}

export interface ResizeResult {
  buffer: Buffer
  width: number
  height: number
  sizeBytes: number
  format: "webp"
  originalSizeBytes: number
  compressionRatio: number
}

const PRESET_CONFIGS: Record<ResizePreset, { width?: number; height?: number; fit: string }> = {
  logo:      { width: 256,  height: 256,  fit: "contain" },
  thumbnail: { width: 400,  height: 400,  fit: "cover" },
  post:      { width: 1200, height: 1200, fit: "inside" },
  og:        { width: 1200, height: 630,  fit: "cover" },
  avatar:    { width: 200,  height: 200,  fit: "cover" },
  original:  { fit: "inside" },
}

/**
 * Redimensionne et convertit une image en WebP.
 * Utilise sharp côté serveur uniquement (Node.js).
 */
export async function resizeImage(
  input: Buffer | Uint8Array,
  options: ResizeOptions = {}
): Promise<ResizeResult> {
  // Import dynamique pour éviter les erreurs de bundling côté client
  const sharp = (await import("sharp")).default

  const originalSizeBytes = input.length
  const preset = options.preset ?? "post"
  const presetConfig = PRESET_CONFIGS[preset]
  const quality = options.quality ?? 85

  const width = options.width ?? presetConfig.width
  const height = options.height ?? presetConfig.height
  const fit = presetConfig.fit as "contain" | "cover" | "fill" | "inside" | "outside"

  let pipeline = sharp(Buffer.from(input))
    .rotate() // Correction orientation EXIF automatique

  if (width || height) {
    pipeline = pipeline.resize({
      width,
      height,
      fit,
      withoutEnlargement: true, // Ne jamais upscaler
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
  }

  // Toujours convertir en WebP
  pipeline = pipeline.webp({
    quality,
    effort: 4,    // Balance vitesse/compression (0-6)
    lossless: false,
  })

  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true })

  return {
    buffer: data,
    width: info.width,
    height: info.height,
    sizeBytes: info.size,
    format: "webp",
    originalSizeBytes,
    compressionRatio: Math.round((1 - info.size / originalSizeBytes) * 100),
  }
}

/**
 * Génère un thumbnail miniature (80px) pour les previews en DB.
 */
export async function generateThumbnail(input: Buffer | Uint8Array): Promise<Buffer> {
  const sharp = (await import("sharp")).default

  const { data } = await sharp(Buffer.from(input))
    .rotate()
    .resize({ width: 80, height: 80, fit: "cover" })
    .webp({ quality: 60 })
    .toBuffer({ resolveWithObject: true })

  return data
}

/**
 * Vérifie si le fichier est une image redimensionnable (pas SVG ni GIF animé).
 */
export function isResizableImage(mimeType: string): boolean {
  return ["image/jpeg", "image/png", "image/webp"].includes(mimeType)
}
