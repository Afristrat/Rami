// ============================================================
// Style presets visuels — partagés UI (Step 4) + serveur (génération)
//
// Chaque preset mappe un identifiant stable vers un fragment de prompt
// (anglais — langue des modèles de génération d'images). Le fragment est
// injecté dans le positive prompt par generateVisualContentAction : la
// sélection d'un preset dans l'UI influence donc RÉELLEMENT la génération.
// Les libellés sont des noms de styles (non traduits) ; les descriptions
// affichées dans l'UI vivent en i18n (workflow.visuals.presetDesc.*).
// ============================================================

export interface StylePreset {
  id: string
  /** Nom du style (nom propre, non traduit — comme dans les outils de design). */
  label: string
  /** Fragment injecté dans le positive prompt de génération d'images. */
  prompt: string
}

export const STYLE_PRESETS: readonly StylePreset[] = [
  {
    id: "digital-toon",
    label: "Digital Toon",
    prompt: "digital toon illustration, bold clean outlines, flat cel shading, vibrant cartoon style",
  },
  {
    id: "graphic-min",
    label: "Graphic Minimalism",
    prompt: "graphic minimalism, simple geometric shapes, generous negative space, flat vector design",
  },
  {
    id: "angular-retro",
    label: "Angular Retro",
    prompt: "angular retro illustration, mid-century flat style, sharp angular shapes, muted retro palette",
  },
  {
    id: "flat-neon",
    label: "Flat Neon",
    prompt: "flat design on dark background, glowing neon accents, high contrast, futuristic mood",
  },
  {
    id: "blueprint",
    label: "Blueprint",
    prompt: "technical blueprint style, monochrome schematic line diagrams, grid background, precise linework",
  },
  {
    id: "scientific",
    label: "Scientific",
    prompt: "scientific data visualization style, clean charts and diagrams, precise, credible, analytical",
  },
  {
    id: "dashboard",
    label: "Dashboard",
    prompt: "modern dashboard UI mockup, data tiles, KPI cards and widgets, clean interface design",
  },
  {
    id: "corporate",
    label: "Corporate",
    prompt: "professional corporate studio aesthetic, clean balanced composition, polished business look",
  },
  {
    id: "desaturated",
    label: "Desaturated",
    prompt: "desaturated editorial photography style, muted tones, refined sophisticated mood",
  },
  {
    id: "isometric",
    label: "Isometric Art",
    prompt: "isometric 3D illustration, colorful geometric blocks, clean isometric perspective",
  },
  {
    id: "abstract",
    label: "Abstract",
    prompt: "abstract organic shapes, smooth color gradients, fluid modern composition",
  },
  {
    id: "hero-photo",
    label: "Hero Photo",
    prompt: "high quality hero photography, professional studio lighting, photorealistic, premium feel",
  },
] as const

/**
 * Résout un preset par identifiant. Renvoie null si l'id est absent ou
 * inconnu (id forgé côté client → ignoré, jamais d'erreur).
 */
export function getStylePreset(id: string | null | undefined): StylePreset | null {
  if (!id) return null
  return STYLE_PRESETS.find((preset) => preset.id === id) ?? null
}
