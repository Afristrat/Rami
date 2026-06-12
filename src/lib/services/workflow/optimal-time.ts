// ============================================================
// Suggestion d'horaire optimal — Step 7 du workflow « Créer un post »
//
// Module PUR (zéro I/O) : remplace la fausse suggestion hardcodée
// (« LinkedIn lundi 8h30 — engagement +14% », stat inventée) par une
// heuristique HONNÊTE : fenêtres d'engagement recommandées par plateforme
// (bonnes pratiques sectorielles publiées), modulées par l'objectif
// cognitif (objectifs « sérieux » → matin, objectifs « émotionnels » →
// fin de fenêtre / soirée). Aucune statistique chiffrée n'est affichée :
// ce sont des recommandations génériques, pas des données du tenant.
// ============================================================

import type { Platform } from "@/lib/scheduler/platform-config"

export interface EngagementWindow {
  /** Jours de la semaine en convention JS Date#getDay (0 = dimanche … 6 = samedi). */
  weekdays: number[]
  /** Début de la fenêtre (heure locale, incluse). */
  startHour: number
  /** Fin de la fenêtre (heure locale, exclue). */
  endHour: number
}

/**
 * Fenêtres d'engagement recommandées par plateforme (heuristique issue des
 * bonnes pratiques publiées — pas des metrics du tenant).
 */
export const PLATFORM_ENGAGEMENT_WINDOWS: Record<Platform, EngagementWindow[]> = {
  linkedin: [{ weekdays: [2, 3, 4], startHour: 8, endHour: 10 }],
  twitter: [{ weekdays: [1, 2, 3, 4, 5], startHour: 9, endHour: 12 }],
  facebook: [{ weekdays: [3, 4, 5], startHour: 9, endHour: 11 }],
  instagram: [
    { weekdays: [2, 3, 4], startHour: 11, endHour: 13 },
    { weekdays: [2, 3, 4], startHour: 18, endHour: 20 },
  ],
  pinterest: [{ weekdays: [5, 6], startHour: 20, endHour: 22 }],
  mastodon: [{ weekdays: [1, 2, 3, 4, 5], startHour: 9, endHour: 11 }],
  youtube: [{ weekdays: [4, 5], startHour: 15, endHour: 17 }],
  tiktok: [{ weekdays: [2, 3, 4], startHour: 18, endHour: 21 }],
}

/** Objectifs cognitifs « sérieux » → privilégier le début de fenêtre (matinée pro). */
const EARLY_OBJECTIVES = new Set(["confiance", "expertise", "urgence"])

/** Délai minimal entre maintenant et la suggestion (planification réaliste). */
const MIN_LEAD_MS = 30 * 60 * 1000

/**
 * Calcule le prochain créneau conseillé pour une plateforme et un objectif,
 * à partir d'un instant donné. Déterministe (testable) : même entrée → même sortie.
 */
export function suggestOptimalTime(input: {
  platform: Platform
  objective?: string
  from: Date
}): Date {
  const windows = PLATFORM_ENGAGEMENT_WINDOWS[input.platform] ?? []
  const early = input.objective ? EARLY_OBJECTIVES.has(input.objective) : true
  const earliest = input.from.getTime() + MIN_LEAD_MS

  // Fenêtres triées selon la préférence horaire de l'objectif
  const ordered = [...windows].sort((a, b) =>
    early ? a.startHour - b.startHour : b.startHour - a.startHour
  )

  for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
    const day = new Date(input.from)
    day.setDate(day.getDate() + dayOffset)

    for (const window of ordered) {
      if (!window.weekdays.includes(day.getDay())) continue
      const hour = early ? window.startHour : window.endHour - 1
      const candidate = new Date(day)
      candidate.setHours(hour, 0, 0, 0)
      if (candidate.getTime() >= earliest) return candidate
    }
  }

  // Garde-fou (plateforme sans fenêtre) : lendemain 9h00.
  const fallback = new Date(input.from)
  fallback.setDate(fallback.getDate() + 1)
  fallback.setHours(9, 0, 0, 0)
  return fallback
}

/** Formate une Date en valeur `datetime-local` (heure locale, « YYYY-MM-DDTHH:mm »). */
export function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number): string => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}
