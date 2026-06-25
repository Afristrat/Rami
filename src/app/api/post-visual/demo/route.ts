import { renderPostVisualToPng } from "@/lib/services/post-visual/render"
import { resolveBrandIdentity } from "@/lib/services/brand-dna/resolver"
import type { PostVisual } from "@/lib/schemas/post-visual.schema"

// Démo publique du moteur de composition « post visuel » : prouve en prod que le
// rendu (next/og + Noto) applique le Brand DNA (couleur réelle, forme Gestalt du
// secteur, monogramme/logo) ET garde des ACCENTS PARFAITS. Carte fixe (aucune
// donnée tenant — DNA d'exemple résolu par le Brand DNA Resolver). À retirer après validation.
export const runtime = "nodejs"

// DNA d'exemple (forme `ressources_humaines` → cercle ; accent bleu_roi).
const SAMPLE_DNA = {
  brandName: "AI-Mpower",
  sector: "ressources_humaines",
  colorPrimary: "bleu_roi",
  colorSecondary: "vert_emeraude",
  colorAccent: "orange_chaleureux",
}

export async function GET(): Promise<Response> {
  const id = resolveBrandIdentity(SAMPLE_DNA, { tenantName: "AI-Mpower" })
  const card: PostVisual = {
    format: "1:1",
    theme: "dark",
    accentHex: id.accent,
    handle: id.handle ?? undefined,
    brand: {
      monogram: id.monogram,
      onAccent: id.onAccent,
      secondary: id.secondary ?? undefined,
      shapeKey: id.shapeKey,
      logoDataUrl: id.logoDataUrl ?? undefined,
    },
    layout: {
      type: "headline",
      eyebrow: "Étude de cas",
      title: "L'IA qui vise juste — couleur de marque, forme du secteur, accents impeccables",
      subtitle: "Visuel composé par le code : identité appliquée, pas hallucinée par l'IA image.",
    },
  }
  const png = await renderPostVisualToPng(card)
  return new Response(new Uint8Array(png), {
    headers: { "content-type": "image/png", "cache-control": "no-store" },
  })
}
