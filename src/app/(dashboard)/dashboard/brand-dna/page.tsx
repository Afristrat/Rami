import { Sparkles } from "lucide-react"
import { getBrandDnaAction } from "@/lib/actions/brand-dna.actions"
import { BrandDnaForm } from "@/components/brand-dna/brand-dna-form"
import { computeDnaScore, getDnaScoreLevel } from "@/lib/utils/dna-score"
import { CAUSSE_COLORS, VOICE_TONES, CULTURES, COGNITIVE_OBJECTIVES } from "@/lib/schemas/brand-dna.schema"

export const metadata = {
  title: "Brand DNA — RAMI",
  description: "Configurez l'ADN de votre marque pour générer du contenu neuropsychologiquement calibré.",
}

export default async function BrandDnaPage() {
  const result = await getBrandDnaAction()
  const initialData = "data" in result ? result.data : null

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {/* En-tête page */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
          <Sparkles className="size-4" />
          <span className="text-sm font-medium">Brand DNA</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {initialData ? "Modifier votre Brand DNA" : "Configurez votre Brand DNA"}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
          L&apos;ADN de marque guide chaque visuel généré par RAMI — couleurs, ton, formes. Chaque
          post devient une flèche calibrée pour toucher l&apos;émotion précise de votre audience.
        </p>

        {/* Badges */}
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            "🧠 Neuropsychologie des couleurs (Causse)",
            "🎯 Psychologie des formes (Gestalt)",
            "📐 Calibrage par culture et secteur",
          ].map((badge) => (
            <span
              key={badge}
              className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium text-muted-foreground"
            >
              {badge}
            </span>
          ))}
        </div>

        {/* Carte résumé Brand DNA existant */}
        {initialData && (() => {
          const score = computeDnaScore(initialData)
          const level = getDnaScoreLevel(score)
          const pct = Math.round(score * 100)
          const primaryColor = CAUSSE_COLORS.find((c) => c.id === initialData.colorPrimary)
          const secondaryColor = CAUSSE_COLORS.find((c) => c.id === initialData.colorSecondary)
          const accentColor = CAUSSE_COLORS.find((c) => c.id === initialData.colorAccent)
          const tone = VOICE_TONES.find((t) => t.id === initialData.voiceTone)
          const culture = CULTURES.find((c) => c.id === initialData.primaryCulture)
          // v1.1 : objectifsCognitifs[0] = dominant ; fallback v1.0 objectifCognitif
          const dominantId = initialData.objectifsCognitifs?.[0] ?? initialData.objectifCognitif
          const objective = COGNITIVE_OBJECTIVES.find((o) => o.id === dominantId)

          return (
            <div className={`mt-4 rounded-xl border p-4 ${level.bgColor} ${level.borderColor}`}>
              {/* Ligne supérieure : score + label */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="size-2 shrink-0 rounded-full bg-green-500" />
                  <p className={`text-sm font-semibold ${level.color}`}>
                    Brand DNA actif — <span className="font-bold">{initialData.brandName}</span>
                  </p>
                </div>
                <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${level.color} border ${level.borderColor}`}>
                  <span>{pct}%</span>
                  <span className="font-medium opacity-80">{level.label}</span>
                </div>
              </div>

              {/* Barre de progression */}
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-current transition-all"
                  style={{ width: `${pct}%`, color: "inherit" }}
                />
              </div>

              {/* Mini-récap : palette + ton + culture + objectif */}
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                {(primaryColor || secondaryColor || accentColor) && (
                  <div className="flex items-center gap-1.5">
                    {[primaryColor, secondaryColor, accentColor].map((c) =>
                      c ? (
                        <span
                          key={c.id}
                          title={c.name}
                          className="size-3.5 rounded-full border border-white/30 shadow-sm"
                          style={{ backgroundColor: c.hex }}
                        />
                      ) : null
                    )}
                    <span className="text-[11px] text-current opacity-70">Palette</span>
                  </div>
                )}
                {tone && (
                  <span className="text-[11px] text-current opacity-70">
                    {tone.icon} {tone.label.split(" ")[0]}
                  </span>
                )}
                {culture && (
                  <span className="text-[11px] text-current opacity-70">
                    {culture.flag} {culture.label}
                  </span>
                )}
                {objective && (
                  <span className="text-[11px] text-current opacity-70">
                    {objective.icon} {objective.label.split(" ")[0]}
                  </span>
                )}
              </div>
            </div>
          )
        })()}
      </div>

      {/* Formulaire Brand DNA */}
      <BrandDnaForm initialData={initialData} />
    </div>
  )
}
