// ============================================================
// Mishkāt — Spec psychologique calibré (Causse × Gestalt) pour la vidéo
// ============================================================
// RAMI dérive ICI, depuis le Brand DNA résolu (objectif cognitif + secteur +
// culture), la calibration psychologique d'une vidéo : émotion cible → palette
// (fond/dégradé/contraste WCAG) + forme Gestalt du secteur + style de
// composition. C'est le CONTRAT que le renderer Mishkāt doit consommer pour
// produire un visuel « pensé pour l'impact » (et non un template générique).
//
// PUR (aucune I/O) → testable. Réutilise le moteur Causse existant
// (CAUSSE_COLOR_MATRIX) et le resolver (BrandIdentity, contraste WCAG) — aucune
// règle psychologique n'est dupliquée ici.

import { CAUSSE_COLOR_MATRIX } from '@/lib/utils/causse-matrix'
import { readableTextColor, type BrandIdentity } from '@/lib/services/brand-dna/resolver'
import type { MishkatPsychologySpec } from './types'

type CausseColorKey = keyof typeof CAUSSE_COLOR_MATRIX

/**
 * Design vidéo par émotion : couleur Causse dominante, fond + arrêt de dégradé
 * calibrés (HEX explicites = auditables), et style de composition (règles RAMI
 * objectif cognitif → style, cf. CLAUDE.md §2.2).
 */
const EMOTION_VIDEO_DESIGN = {
  confiance:  { causseColor: 'bleu',   bg: '#0B1220', gradientStop: '#1E3A8A', composition: 'Blueprint + Scientifique' },
  expertise:  { causseColor: 'bleu',   bg: '#0A0F1A', gradientStop: '#1E3A8A', composition: 'Dashboard + Stack' },
  urgence:    { causseColor: 'rouge',  bg: '#1A0B0B', gradientStop: '#8B0000', composition: 'Machine + Narratif' },
  aspiration: { causseColor: 'violet', bg: '#140A24', gradientStop: '#5B21B6', composition: 'Carte/Tuile + Narratif' },
  creativite: { causseColor: 'violet', bg: '#160A22', gradientStop: '#5B21B6', composition: 'Narratif + Machine' },
  communaute: { causseColor: 'orange', bg: '#FBF3EC', gradientStop: '#FB923C', composition: 'Narratif + Carte/Tuile' },
  joie:       { causseColor: 'jaune',  bg: '#FFFBEB', gradientStop: '#F59E0B', composition: 'Narratif + Machine' },
  croissance: { causseColor: 'vert',   bg: '#F0FAF4', gradientStop: '#16A34A', composition: 'Carte/Tuile + Stack' },
  serenite:   { causseColor: 'bleu',   bg: '#F2F6FC', gradientStop: '#7DD3FC', composition: 'Narratif + Scientifique' },
} as const satisfies Record<string, { causseColor: CausseColorKey; bg: string; gradientStop: string; composition: string }>

export type EmotionKey = keyof typeof EMOTION_VIDEO_DESIGN

// Repli quand le Brand DNA n'a pas d'objectif cognitif exploitable.
const OBJECTIVE_TO_EMOTION: Record<string, EmotionKey> = {
  awareness: 'confiance',
  acquisition: 'aspiration',
  proof: 'expertise',
  wrapped_shareable: 'joie',
  demo_day: 'aspiration',
}

// Le ton vidéo est un signal fort qui peut surclasser l'objectif.
const TONE_TO_EMOTION: Record<string, EmotionKey> = {
  urgence: 'urgence',
  premium: 'aspiration',
  cinematic: 'aspiration',
  pedagogique: 'expertise',
  insolent: 'urgence',
}

function normalizeKey(s: string | null | undefined): string {
  return (s ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
}

function isEmotionKey(s: string): s is EmotionKey {
  return Object.prototype.hasOwnProperty.call(EMOTION_VIDEO_DESIGN, s)
}

/**
 * Émotion cible d'une vidéo. Priorité : objectif cognitif de la marque (le
 * signal le plus fort) → ton vidéo (override marqué) → objectif vidéo → défaut
 * « confiance ». PUR.
 */
export function deriveTargetEmotion(
  cognitiveObjective: string | null | undefined,
  objective: string,
  tone: string,
): EmotionKey {
  const cog = normalizeKey(cognitiveObjective)
  if (isEmotionKey(cog)) return cog
  const t = normalizeKey(tone)
  if (t in TONE_TO_EMOTION) return TONE_TO_EMOTION[t]
  const o = normalizeKey(objective)
  if (o in OBJECTIVE_TO_EMOTION) return OBJECTIVE_TO_EMOTION[o]
  return 'confiance'
}

/**
 * Construit le spec psychologique calibré pour une vidéo. PUR.
 * @param identity  Identité de marque résolue (resolveBrandIdentity).
 * @param brief     Objectif + ton de CETTE vidéo (affinent l'émotion).
 */
export function buildPsychologySpec(
  identity: BrandIdentity,
  brief: { objective: string; tone: string },
): MishkatPsychologySpec {
  const emotion = deriveTargetEmotion(identity.cognitiveObjective, brief.objective, brief.tone)
  const design = EMOTION_VIDEO_DESIGN[emotion]

  // Overrides Causse critiques (cf. règles RAMI §2.2) appliqués à la couleur
  // d'émotion (utilisée seulement si la marque n'a pas de couleur réelle).
  const sector = normalizeKey(identity.sector)
  let causseColorKey: CausseColorKey = design.causseColor
  if (sector.includes('islamique')) causseColorKey = 'vert' // vert obligatoire
  const causse = CAUSSE_COLOR_MATRIX[causseColorKey]
  let emotionHex = causse.hex_primary
  if ((sector.includes('sante') || sector.includes('medical')) && causseColorKey === 'rouge') {
    emotionHex = CAUSSE_COLOR_MATRIX.rouge.hex_variants?.bordeaux ?? '#8B0000' // bordeaux santé
  }

  // Accent : couleur RÉELLE de marque si elle existe (déjà calibrée à
  // l'onboarding), sinon la couleur d'émotion Causse. Texte garanti lisible.
  const accent = identity.hasBrandColor ? identity.accent : emotionHex
  const onAccent = readableTextColor(accent)
  const secondary = identity.secondary ?? emotionHex
  const bg = design.bg
  const text = readableTextColor(bg)

  return {
    target_emotion: emotion,
    emotion_rationale: `${causse.causse_quote}. Calibrage RAMI : émotion cible « ${emotion} » → composition ${design.composition}.`,
    palette: { bg, text, accent, onAccent, secondary, gradient: [bg, design.gradientStop] },
    gestalt: {
      shape: identity.shapeKey,
      signal: identity.shapeSignal,
      keywords: identity.shapePromptKeywords,
    },
    composition_style: design.composition,
    culture: identity.culture,
    networks_optimal: causse.networks_optimal,
  }
}
