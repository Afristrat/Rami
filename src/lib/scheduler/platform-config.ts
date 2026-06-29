export type Platform =
  | "twitter"
  | "linkedin"
  | "facebook"
  | "instagram"
  | "pinterest"
  | "youtube"
  | "tiktok"

/**
 * Statut de disponibilité d'une plateforme dans l'UI :
 * - `live`        : backend de publication réel → sélectionnable et publiable.
 * - `coming_soon` : déclarée mais sans backend → VISIBLE (badge « Bientôt ») mais
 *                   NON sélectionnable (zéro factice : rien ne peut échouer).
 * - `hidden`      : masquée des listes de sélection (aucun backend, non prioritaire).
 * NB : l'AFFICHAGE des posts historiques s'appuie toujours sur `PLATFORM_CONFIG`
 * complet — seules les listes de SÉLECTION filtrent sur ce statut.
 */
export type PlatformStatus = "live" | "coming_soon" | "hidden"

export interface PlatformConfig {
  label: string
  color: string      // hex pour les chips calendrier
  bgClass: string    // classe Tailwind pour fond badge
  textClass: string  // classe Tailwind pour texte badge
  icon: string       // emoji fallback
  charLimit: number
  status: PlatformStatus
  // ── Contraintes média (guidance soft : aperçu fidèle + avertissements) ──
  aspectRatios: string[]    // ratios d'image acceptés ; le 1er sert de défaut d'aperçu
  maxImages: number         // nombre max d'images dans un post (borne haute connue)
  supportsCarousel: boolean // carrousel multi-images natif sur la plateforme
  mediaRequired: boolean    // un média est-il obligatoire pour publier
}

export const PLATFORM_CONFIG: Record<Platform, PlatformConfig> = {
  twitter: {
    label: "X / Twitter",
    color: "#1D9BF0",
    bgClass: "bg-[#1D9BF0]/15",
    textClass: "text-[#1D9BF0]",
    icon: "𝕏",
    charLimit: 280,
    status: "live",
    aspectRatios: ["16:9", "1:1"],
    maxImages: 4,
    supportsCarousel: false,
    mediaRequired: false,
  },
  linkedin: {
    label: "LinkedIn",
    color: "#0A66C2",
    bgClass: "bg-[#0A66C2]/15",
    textClass: "text-[#0A66C2]",
    icon: "in",
    charLimit: 3000,
    status: "live",
    aspectRatios: ["1.91:1", "1:1", "4:5"],
    maxImages: 9,
    supportsCarousel: true,
    mediaRequired: false,
  },
  facebook: {
    label: "Facebook",
    color: "#1877F2",
    bgClass: "bg-[#1877F2]/15",
    textClass: "text-[#1877F2]",
    icon: "f",
    charLimit: 63206,
    status: "live",
    aspectRatios: ["1.91:1", "1:1", "4:5"],
    maxImages: 10,
    supportsCarousel: true,
    mediaRequired: false,
  },
  instagram: {
    label: "Instagram",
    color: "#E1306C",
    bgClass: "bg-[#E1306C]/15",
    textClass: "text-[#E1306C]",
    icon: "📸",
    charLimit: 2200,
    status: "live",
    aspectRatios: ["1:1", "4:5", "1.91:1", "9:16"],
    maxImages: 10,
    supportsCarousel: true,
    mediaRequired: true,
  },
  pinterest: {
    label: "Pinterest",
    color: "#E60023",
    bgClass: "bg-[#E60023]/15",
    textClass: "text-[#E60023]",
    icon: "P",
    charLimit: 500,
    status: "live",
    aspectRatios: ["2:3", "1:1"],
    maxImages: 5,
    supportsCarousel: true,
    mediaRequired: true,
  },
  youtube: {
    label: "YouTube",
    color: "#FF0000",
    bgClass: "bg-[#FF0000]/15",
    textClass: "text-[#FF0000]",
    icon: "▶",
    charLimit: 5000,
    status: "coming_soon",
    aspectRatios: ["16:9"],
    maxImages: 1,
    supportsCarousel: false,
    mediaRequired: true,
  },
  tiktok: {
    label: "TikTok",
    color: "#010101",
    bgClass: "bg-zinc-900/10 dark:bg-zinc-100/10",
    textClass: "text-zinc-900 dark:text-zinc-100",
    icon: "♪",
    charLimit: 2200,
    status: "coming_soon",
    aspectRatios: ["9:16"],
    maxImages: 35,
    supportsCarousel: true,
    mediaRequired: true,
  },
}

export const ALL_PLATFORMS = Object.keys(PLATFORM_CONFIG) as Platform[]

/**
 * Plateformes VISIBLES dans les listes de sélection (toutes sauf `hidden`).
 * Inclut les `coming_soon` — à afficher avec un badge « Bientôt », non sélectionnables.
 */
export const VISIBLE_PLATFORMS = ALL_PLATFORMS.filter(
  (p) => PLATFORM_CONFIG[p].status !== "hidden"
)

/** Plateformes réellement SÉLECTIONNABLES (backend de publication réel : `live`). */
export const SELECTABLE_PLATFORMS = ALL_PLATFORMS.filter(
  (p) => PLATFORM_CONFIG[p].status === "live"
)

/** True si la plateforme est sélectionnable (publiable). */
export function isPlatformSelectable(platform: Platform): boolean {
  return PLATFORM_CONFIG[platform].status === "live"
}

/** Convertit un ratio "w:h" en valeur CSS aspect-ratio "w / h" (défaut 1/1). */
export function aspectRatioToCss(ratio: string | undefined): string {
  if (!ratio) return "1 / 1"
  const [w, h] = ratio.split(":")
  const nw = Number(w)
  const nh = Number(h)
  if (!Number.isFinite(nw) || !Number.isFinite(nh) || nw <= 0 || nh <= 0) return "1 / 1"
  return `${nw} / ${nh}`
}

export interface MediaConformityIssue {
  level: "warning" | "error"
  message: string
}

/**
 * Vérifie la conformité d'un contenu vis-à-vis d'une plateforme (guidance pour
 * l'aperçu). Soft : sert à AVERTIR l'humain avant validation, pas à bloquer.
 */
export function checkPlatformConformity(
  platform: Platform,
  input: { content: string; imageCount: number }
): MediaConformityIssue[] {
  const cfg = PLATFORM_CONFIG[platform]
  const issues: MediaConformityIssue[] = []
  if (input.content.length > cfg.charLimit) {
    issues.push({
      level: "error",
      message: `Texte trop long pour ${cfg.label} (${input.content.length}/${cfg.charLimit}).`,
    })
  }
  if (cfg.mediaRequired && input.imageCount === 0) {
    issues.push({ level: "error", message: `${cfg.label} exige au moins un média.` })
  }
  if (input.imageCount > cfg.maxImages) {
    issues.push({
      level: "warning",
      message: `${cfg.label} accepte au plus ${cfg.maxImages} image(s) (${input.imageCount} fournies).`,
    })
  }
  if (input.imageCount > 1 && !cfg.supportsCarousel) {
    issues.push({
      level: "warning",
      message: `${cfg.label} ne gère pas de carrousel — seule la 1ʳᵉ image sera utilisée.`,
    })
  }
  return issues
}
