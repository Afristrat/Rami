import type { Metadata } from "next"
import { getLocale, getTranslations } from "next-intl/server"
import { CAUSSE_COLOR_MATRIX, type CausseColor } from "@/lib/utils/causse-matrix"

// Page publique (US-013) — Référentiel Causse × Culture, indexable, sans auth.
// Pilier MOAT-2 : autorité Brand DNA / neuropsychologie des couleurs en contexte MENA.

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://rami.ai-mpower.com"
const PATH = "/causse"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("causse")
  const locale = await getLocale()
  const url = `${BASE_URL}${PATH}`
  const title = t("metaTitle")
  const description = t("metaDescription")

  return {
    metadataBase: new URL(BASE_URL),
    title,
    description,
    keywords: [
      "neuropsychologie des couleurs",
      "Causse",
      "Brand DNA",
      "couleur émotion culture",
      "MENA",
      "Maroc",
      "marketing visuel",
    ],
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      type: "article",
      url,
      siteName: "RAMI by AI-MPower",
      locale,
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }
}

/** Données structurées Schema.org — un DefinedTermSet listant les couleurs. */
function buildJsonLd(name: string, description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    name,
    description,
    url: `${BASE_URL}${PATH}`,
    hasDefinedTerm: Object.values(CAUSSE_COLOR_MATRIX).map((c) => ({
      "@type": "DefinedTerm",
      name: c.name,
      description: `${c.emotions.join(", ")} — ${c.physiological_effects}`,
      inDefinedTermSet: `${BASE_URL}${PATH}`,
    })),
  }
}

function Swatch({ hex, label }: { hex: string; label?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-block size-6 shrink-0 rounded-md border border-white/20 shadow-sm"
        style={{ backgroundColor: hex }}
        aria-hidden
      />
      <span className="font-mono text-xs text-muted-foreground">{label ?? hex}</span>
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">{label}</p>
      <div className="text-sm text-foreground/90">{children}</div>
    </div>
  )
}

function ColorCard({ color, labels }: { color: CausseColor; labels: Record<string, string> }) {
  const cultures: Array<{ key: string; value?: string }> = [
    { key: labels.maroc, value: color.culture_maroc },
    { key: labels.africa, value: color.culture_afrique },
    { key: labels.europe, value: color.culture_europe },
    { key: labels.middleEast, value: color.culture_moyen_orient },
  ]

  return (
    <article className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-xl">
      {/* En-tête couleur */}
      <div className="mb-5 flex items-center gap-4">
        <span
          className="size-14 shrink-0 rounded-xl border border-white/20 shadow-lg"
          style={{ backgroundColor: color.hex_primary }}
          aria-hidden
        />
        <div>
          <h2 className="text-xl font-bold text-foreground">{color.name}</h2>
          <span className="font-mono text-xs text-muted-foreground">{color.hex_primary}</span>
        </div>
      </div>

      <div className="space-y-4">
        <Section label={labels.emotions}>
          <div className="flex flex-wrap gap-1.5">
            {color.emotions.map((e) => (
              <span key={e} className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-xs text-violet-300">
                {e}
              </span>
            ))}
          </div>
        </Section>

        <Section label={labels.physiologicalEffect}>{color.physiological_effects}</Section>

        {color.hex_variants && (
          <Section label={labels.variants}>
            <div className="flex flex-wrap gap-3">
              {Object.entries(color.hex_variants).map(([name, hex]) => (
                <Swatch key={name} hex={hex} label={name.replace(/_/g, " ")} />
              ))}
            </div>
          </Section>
        )}

        <Section label={labels.optimalNetworks}>{color.networks_optimal.join(" · ")}</Section>

        {color.sectors_recommended && (
          <Section label={labels.recommendedSectors}>{color.sectors_recommended.join(", ")}</Section>
        )}
        {color.avoid_sectors && (
          <Section label={labels.avoidSectors}>
            <span className="text-red-300">{color.avoid_sectors.join(", ")}</span>
          </Section>
        )}

        <Section label={labels.culturalNotes}>
          <ul className="space-y-1.5">
            {cultures.filter((c) => c.value).map((c) => (
              <li key={c.key} className="flex gap-2">
                <span className="shrink-0 font-semibold text-foreground/70">{c.key} :</span>
                <span className="text-muted-foreground">{c.value}</span>
              </li>
            ))}
          </ul>
        </Section>

        <blockquote className="border-l-2 border-violet-500/40 pl-3 text-sm italic text-muted-foreground">
          « {color.causse_quote} »
        </blockquote>
      </div>
    </article>
  )
}

export default async function CaussePage() {
  const t = await getTranslations("causse")

  const labels = {
    emotions: t("emotions"),
    physiologicalEffect: t("physiologicalEffect"),
    variants: t("variants"),
    optimalNetworks: t("optimalNetworks"),
    recommendedSectors: t("recommendedSectors"),
    avoidSectors: t("avoidSectors"),
    culturalNotes: t("culturalNotes"),
    maroc: t("maroc"),
    africa: t("africa"),
    europe: t("europe"),
    middleEast: t("middleEast"),
  }

  const jsonLd = buildJsonLd(t("metaTitle"), t("metaDescription"))

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0A0A0F] text-white">
      {/* Données structurées Schema.org (données statiques de confiance ;
          échappement de « < » par sécurité contre toute évasion </script>). */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      {/* Décor */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="rami-blob absolute -top-40 left-1/4 h-[600px] w-[600px] bg-[#7c3bed]" />
        <div className="rami-blob absolute top-1/3 right-1/4 h-[400px] w-[400px] bg-[#2563eb]" />
      </div>
      <div className="rami-grid-pattern pointer-events-none fixed inset-0" />

      <main className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        {/* Hero */}
        <header className="mb-14 text-center">
          <span className="mb-4 inline-block rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-violet-400">
            {t("badge")}
          </span>
          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">{t("title")}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/60">{t("subtitle")}</p>
          <p className="mx-auto mt-3 max-w-3xl text-sm text-white/40">{t("intro")}</p>
        </header>

        {/* Grille des couleurs */}
        <div className="grid gap-6 md:grid-cols-2">
          {Object.entries(CAUSSE_COLOR_MATRIX).map(([key, color]) => (
            <ColorCard key={key} color={color} labels={labels} />
          ))}
        </div>

        <footer className="mt-16 text-center text-xs text-white/30">
          {t("source")}
        </footer>
      </main>
    </div>
  )
}
