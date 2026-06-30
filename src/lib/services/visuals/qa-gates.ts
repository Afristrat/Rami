// ============================================================
// API publique v1 — gates QA déterministes des visuels (US-052)
// Cascade côté RAMI : ces gates s'exécutent sur l'artefact généré AVANT publication.
// Couvrent exactement les défauts de l'incident du carrousel 2026-06-23 :
//   géométrie A4, chrome navigateur (file://, horodatage, n° de page), polices non
//   embarquées, marque absente. Multi-tenant : marque résolue, jamais codée en dur.
// ============================================================

import { resolveBrandIdentity } from "@/lib/services/brand-dna/resolver"

const RATIOS: Record<string, number> = { "1:1": 1, "4:5": 0.8, "9:16": 0.5625, "16:9": 1.7778 }

/**
 * Types dont le rendu passe par un PDF (génération @react-pdf). Seuls ces types
 * subissent les gates propres au PDF (`no_browser_chrome`, `fonts_embedded`).
 * Les types rasterisés (`image`) ou futurs (`video`) ne les déclenchent pas :
 * une image n'a pas de « polices embarquées » → ne doit pas échouer à tort.
 * Enum ouvert par conception.
 */
export const PDF_RENDER_TYPES: readonly string[] = ["carousel"]

export type GateSeverity = "critical" | "warning"
export interface Gate {
  id: string
  ok: boolean
  severity: GateSeverity
  detail: string
}
export interface VisualQAInput {
  type: string
  format: string
  manifest: { width: number; height: number; fonts_embedded: boolean; duration?: number }
  sourceText?: string
  brandDna?: unknown
  tenantName?: string | null
}
export interface QAGateResult {
  passed: boolean
  gates: Gate[]
  brandPreflightScore: number
}

function gateFormat(i: VisualQAInput): Gate {
  const want = RATIOS[i.format]
  if (!want) return { id: "format", ok: false, severity: "critical", detail: `format inconnu ${i.format}` }
  const got = i.manifest.height ? i.manifest.width / i.manifest.height : 0
  const ok = Math.abs(got - want) <= 0.03 && Math.min(i.manifest.width, i.manifest.height) >= 1000
  return {
    id: "format",
    ok,
    severity: "critical",
    detail: `ratio ${got.toFixed(3)} vs ${want} (${i.manifest.width}x${i.manifest.height})`,
  }
}

/** Décompose les ligatures (ﬁ→fi) pour ne pas rater « file:// » dans un texte extrait. */
function normalize(t: string): string {
  return (t || "").normalize("NFKC")
}

function gateNoChrome(i: VisualQAInput): Gate {
  const t = normalize(i.sourceText ?? "")
  const hits: string[] = []
  if (t.includes("file://")) hits.push("file://")
  if (/\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}/.test(t)) hits.push("horodatage")
  if (/(?:^|\s)\d+\s*\/\s*\d+(?:\s|$)/.test(t) && t.includes(".html")) hits.push("pagination n/N")
  return {
    id: "no_browser_chrome",
    ok: hits.length === 0,
    severity: "critical",
    detail: hits.length ? "chrome détecté: " + hits.join(", ") : "propre",
  }
}

function gateFonts(i: VisualQAInput): Gate {
  return {
    id: "fonts_embedded",
    ok: !!i.manifest.fonts_embedded,
    severity: "critical",
    detail: i.manifest.fonts_embedded ? "polices embarquées" : "polices NON embarquées (risque fallback)",
  }
}

function gateBrand(i: VisualQAInput): { gate: Gate; score: number } {
  if (i.brandDna == null) {
    return {
      gate: { id: "brand", ok: true, severity: "warning", detail: "pas de brand kit -> neutre" },
      score: 0,
    }
  }
  const id = resolveBrandIdentity(i.brandDna, { tenantName: i.tenantName ?? null })
  const hasAccent = /^#?[0-9a-fA-F]{6}$/.test(id.accent || "")
  const hasMark = !!(id.hasLogo || id.monogram)
  const score = (hasAccent ? 50 : 0) + (hasMark ? 50 : 0)
  return {
    gate: {
      id: "brand",
      ok: hasAccent && hasMark,
      severity: "warning",
      detail: `accent=${id.accent} mark=${hasMark}`,
    },
    score,
  }
}

/** Évalue la cascade de gates déterministes sur un visuel généré. */
export function evaluateVisualQA(i: VisualQAInput): QAGateResult {
  const b = gateBrand(i)
  const gates: Gate[] = [gateFormat(i), b.gate]
  if (PDF_RENDER_TYPES.includes(i.type)) {
    gates.push(gateNoChrome(i), gateFonts(i))
  }
  return {
    passed: gates.filter((g) => g.severity === "critical").every((g) => g.ok),
    gates,
    brandPreflightScore: b.score,
  }
}
