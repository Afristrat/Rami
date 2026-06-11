// ============================================================
// Polices PDF (socle PDF serveur)
// ============================================================
// Helvetica (police PDF par défaut) ne couvre ni le latin étendu (turc), ni
// l'arabe. On embarque Noto Sans (latin-ext → fr/en/es/de/pt/tr) et Noto Sans
// Arabic (ar) pour un rendu correct « selon la langue de l'utilisateur ».
// Le chinois (zh) n'a pas de police CJK embarquée (poids prohibitif) → repli
// libellés anglais géré en amont par localeForPdfLabels().

import path from "node:path"
import { Font } from "@react-pdf/renderer"

let registered = false

/** Enregistre les polices PDF une seule fois par process. */
export function registerPdfFonts(): void {
  if (registered) return
  const dir = path.join(process.cwd(), "public", "fonts")

  Font.register({
    family: "NotoSans",
    fonts: [
      { src: path.join(dir, "NotoSans-Regular.ttf"), fontWeight: "normal" },
      { src: path.join(dir, "NotoSans-Bold.ttf"), fontWeight: "bold" },
    ],
  })
  Font.register({
    family: "NotoArabic",
    fonts: [
      { src: path.join(dir, "NotoSansArabic-Regular.ttf"), fontWeight: "normal" },
      { src: path.join(dir, "NotoSansArabic-Bold.ttf"), fontWeight: "bold" },
    ],
  })

  // Pas de césure automatique (évite des coupures de mots hasardeuses).
  Font.registerHyphenationCallback((word) => [word])

  registered = true
}

export interface PdfFontChoice {
  family: string
  rtl: boolean
}

/** Famille de police + sens de lecture selon la locale. */
export function fontForLocale(locale: string): PdfFontChoice {
  if (locale === "ar") return { family: "NotoArabic", rtl: true }
  return { family: "NotoSans", rtl: false }
}

/**
 * Locale à utiliser pour les LIBELLÉS du PDF. Le chinois n'ayant pas de police
 * CJK embarquée, on retombe sur l'anglais pour le chrome (le contenu rédigé
 * reste inchangé). Les autres locales sont rendues telles quelles.
 */
export function localeForPdfLabels(locale: string): string {
  return locale === "zh" ? "en" : locale
}
