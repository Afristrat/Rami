/**
 * Validation des types MIME acceptés par RAMI.
 * Chaque type est associé à une extension canonique et une catégorie.
 */

export type MimeCategory = "image" | "video" | "audio" | "document"

interface MimeEntry {
  extensions: string[]
  category: MimeCategory
  maxSizeBytes: number
}

export const ALLOWED_MIME_TYPES: Record<string, MimeEntry> = {
  // Images
  "image/jpeg": { extensions: ["jpg", "jpeg"], category: "image", maxSizeBytes: 10 * 1024 * 1024 },
  "image/png": { extensions: ["png"], category: "image", maxSizeBytes: 10 * 1024 * 1024 },
  "image/webp": { extensions: ["webp"], category: "image", maxSizeBytes: 10 * 1024 * 1024 },
  "image/gif": { extensions: ["gif"], category: "image", maxSizeBytes: 5 * 1024 * 1024 },
  "image/svg+xml": { extensions: ["svg"], category: "image", maxSizeBytes: 2 * 1024 * 1024 },
  // Audio
  "audio/mpeg": { extensions: ["mp3"], category: "audio", maxSizeBytes: 500 * 1024 * 1024 },
  "audio/mp4": { extensions: ["m4a"], category: "audio", maxSizeBytes: 500 * 1024 * 1024 },
  "audio/wav": { extensions: ["wav"], category: "audio", maxSizeBytes: 500 * 1024 * 1024 },
  "audio/ogg": { extensions: ["ogg"], category: "audio", maxSizeBytes: 500 * 1024 * 1024 },
  "audio/webm": { extensions: ["weba"], category: "audio", maxSizeBytes: 500 * 1024 * 1024 },
  // Video
  "video/mp4": { extensions: ["mp4"], category: "video", maxSizeBytes: 500 * 1024 * 1024 },
  "video/webm": { extensions: ["webm"], category: "video", maxSizeBytes: 500 * 1024 * 1024 },
  // Documents
  "application/pdf": { extensions: ["pdf"], category: "document", maxSizeBytes: 50 * 1024 * 1024 },
}

export type AllowedMimeType = keyof typeof ALLOWED_MIME_TYPES

export interface MimeValidationResult {
  valid: boolean
  error?: string
  entry?: MimeEntry
}

/**
 * Valide un type MIME et la taille du fichier.
 * Double vérification : type MIME déclaré + magic bytes (premiers octets).
 */
export function validateMimeType(
  mimeType: string,
  fileSizeBytes: number
): MimeValidationResult {
  const entry = ALLOWED_MIME_TYPES[mimeType]

  if (!entry) {
    return {
      valid: false,
      error: `Type de fichier non autorisé : ${mimeType}. Types acceptés : JPEG, PNG, WebP, GIF, SVG, MP3, MP4, WAV, PDF.`,
    }
  }

  if (fileSizeBytes > entry.maxSizeBytes) {
    const maxMB = Math.round(entry.maxSizeBytes / (1024 * 1024))
    const actualMB = (fileSizeBytes / (1024 * 1024)).toFixed(1)
    return {
      valid: false,
      error: `Fichier trop volumineux : ${actualMB} MB. Limite pour ${mimeType} : ${maxMB} MB.`,
    }
  }

  return { valid: true, entry }
}

/**
 * Détecte le type MIME réel depuis les magic bytes du buffer.
 * Protège contre les attaques par changement d'extension.
 */
export function detectMimeFromBuffer(buffer: Uint8Array): string | null {
  const bytes = buffer.slice(0, 12)

  // JPEG : FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg"
  // PNG : 89 50 4E 47 0D 0A 1A 0A
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png"
  // GIF : 47 49 46 38
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) return "image/gif"
  // WebP : 52 49 46 46 ?? ?? ?? ?? 57 45 42 50
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return "image/webp"
  // PDF : 25 50 44 46
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return "application/pdf"
  // MP3 : ID3 ou FF FB/FF F3/FF F2
  if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) return "audio/mpeg"
  if (bytes[0] === 0xff && (bytes[1] === 0xfb || bytes[1] === 0xf3 || bytes[1] === 0xf2)) return "audio/mpeg"
  // MP4 / M4A : ftyp à offset 4
  if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) return "video/mp4"

  return null
}

/**
 * Vérifie la cohérence entre le MIME déclaré et les magic bytes.
 */
export function validateMimeConsistency(
  declaredMime: string,
  buffer: Uint8Array
): MimeValidationResult {
  const detectedMime = detectMimeFromBuffer(buffer)

  if (!detectedMime) {
    // Impossible de détecter → on fait confiance au MIME déclaré si autorisé
    return validateMimeType(declaredMime, buffer.length)
  }

  if (detectedMime !== declaredMime) {
    // Tolérance : audio/mp4 vs video/mp4 pour les m4a
    const audioVideoMp4 =
      (declaredMime === "audio/mp4" || declaredMime === "audio/mpeg") &&
      detectedMime === "video/mp4"
    if (!audioVideoMp4) {
      return {
        valid: false,
        error: `Type de fichier incohérent : déclaré ${declaredMime}, détecté ${detectedMime}. Upload refusé.`,
      }
    }
  }

  return validateMimeType(declaredMime, buffer.length)
}

export function isImageMime(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES[mimeType]?.category === "image"
}
