// ============================================================
// Normalisation du logo pour le RENDU composé
// ============================================================
// Les moteurs de composition (Satori/next-og pour le post-visuel, @react-pdf
// pour carrousel/PDF) ne rendent de façon fiable QUE le PNG/JPEG — pas le WebP
// (format produit par l'uploader actuel) ni le SVG arbitraire. Ce module
// convertit n'importe quel logo (data URI) en PNG data URI exploitable partout.
//
// Serveur uniquement (utilise sharp). À appeler dans les actions qui embarquent
// le logo dans un artefact, AVANT de le passer au renderer.

import sharp from "sharp"
import { isUsableLogo } from "./resolver"

/** Taille max du logo rendu (px) — borne le poids et la mémoire. */
const MAX_DIM = 320

const DATAURI_RE = /^data:image\/([a-z0-9.+-]+);base64,(.+)$/i

/**
 * Convertit un logo data URI (webp/png/jpeg/svg…) en PNG data URI redimensionné,
 * prêt pour Satori / @react-pdf / pptxgenjs. Renvoie null si entrée invalide ou
 * conversion impossible (le renderer retombe alors sur le monogramme). PUR côté
 * contrat (pas d'effet de bord), mais asynchrone (sharp).
 */
export async function normalizeLogoForRender(value: unknown): Promise<string | null> {
  if (!isUsableLogo(value)) return null
  const m = DATAURI_RE.exec(value)
  if (!m) return null
  const [, format, b64] = m

  // Déjà un PNG → on le garde tel quel (évite une recompression inutile), sauf
  // si on veut borner la taille : on borne quand même pour la cohérence.
  try {
    const input = Buffer.from(b64, "base64")
    const png = await sharp(input, { density: 200 }) // density aide le rendu SVG
      .resize(MAX_DIM, MAX_DIM, { fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer()
    return `data:image/png;base64,${png.toString("base64")}`
  } catch {
    // Format illisible par sharp → on n'incruste pas de logo cassé.
    void format
    return null
  }
}
