import { getTranslations } from "next-intl/server"
import { getBrandDnaAction } from "@/lib/actions/brand-dna.actions"
import { getBenchmarkAction } from "@/lib/actions/perplexity-benchmark.actions"
import { BrandDnaForm } from "@/components/brand-dna/brand-dna-form"
import { BrandDnaNav } from "@/components/brand-dna/brand-dna-nav"
import { PerplexityBenchmarkPanel } from "@/components/brand-dna/perplexity-benchmark-panel"
import { computeDnaScore, getDnaScoreLevel } from "@/lib/utils/dna-score"
import {
  CAUSSE_COLORS,
  VOICE_TONES,
  CULTURES,
  COGNITIVE_OBJECTIVES,
} from "@/lib/schemas/brand-dna.schema"

export async function generateMetadata() {
  const t = await getTranslations("metadata")
  return {
    title: t("brandDna"),
    description: t("brandDnaDescription"),
  }
}

export default async function BrandDnaEditPage() {
  const [brandDnaResult, benchmarkResult] = await Promise.all([
    getBrandDnaAction(),
    getBenchmarkAction(),
  ])

  const tColors = await getTranslations("brandDna.colors")
  const tTones = await getTranslations("brandDna.voiceTones")
  const tCultures = await getTranslations("brandDna.cultures")
  const tObjectives = await getTranslations("brandDna.cognitiveObjectives")
  const tScore = await getTranslations("brandDna.scoreLevel")
  const tSectors = await getTranslations("brandDna.sectors")

  const initialData = "data" in brandDnaResult ? brandDnaResult.data : null
  const benchmarkData = "data" in benchmarkResult ? benchmarkResult.data : null
  const benchmarkStale =
    "stale" in benchmarkResult ? benchmarkResult.stale : false

  const dnaSummary = initialData
    ? (() => {
        const score = computeDnaScore(initialData)
        const level = getDnaScoreLevel(score)
        const pct = Math.round(score * 100)
        const primaryColor = CAUSSE_COLORS.find((c) => c.id === initialData.colorPrimary)
        const secondaryColor = CAUSSE_COLORS.find((c) => c.id === initialData.colorSecondary)
        const accentColor = CAUSSE_COLORS.find((c) => c.id === initialData.colorAccent)
        const tone = VOICE_TONES.find((t) => t.id === initialData.voiceTone)
        const culture = CULTURES.find((c) => c.id === initialData.primaryCulture)
        const dominantId = initialData.objectifsCognitifs?.[0] ?? initialData.objectifCognitif
        const objective = COGNITIVE_OBJECTIVES.find((o) => o.id === dominantId)
        return { score, level, pct, primaryColor, secondaryColor, accentColor, tone, culture, objective }
      })()
    : null

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-4 max-w-6xl mx-auto space-y-4">
      <BrandDnaNav />

      {/* Bandeau Brand DNA existant — horizontal compact */}
      {dnaSummary && initialData && (
        <div className={`rounded-lg border p-3 flex flex-wrap items-center gap-4 ${dnaSummary.level.bgColor} ${dnaSummary.level.borderColor}`}>
          <div className="flex items-center gap-2">
            <span className="size-2 shrink-0 rounded-full bg-green-500" />
            <span className={`text-sm font-bold ${dnaSummary.level.color}`}>
              {initialData.brandName}
            </span>
          </div>
          <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${dnaSummary.level.color} border ${dnaSummary.level.borderColor}`}>
            <span>{dnaSummary.pct}%</span>
            <span className="font-medium opacity-80">{tScore(`${dnaSummary.level.labelKey}.label`)}</span>
          </div>
          <div className="flex items-center gap-2">
            {[dnaSummary.primaryColor, dnaSummary.secondaryColor, dnaSummary.accentColor].map((c) =>
              c ? (
                <span key={c.id} title={tColors(`${c.id}.name`)} className="size-4 rounded-full border border-white/30 shadow-sm" style={{ backgroundColor: c.hex }} />
              ) : null
            )}
          </div>
          {dnaSummary.tone && (
            <span className="text-[11px] text-current opacity-70">{dnaSummary.tone.icon} {tTones(`${dnaSummary.tone.id}.label`).split(" ")[0]}</span>
          )}
          {dnaSummary.culture && (
            <span className="text-[11px] text-current opacity-70">{dnaSummary.culture.flag} {tCultures(dnaSummary.culture.id)}</span>
          )}
          {dnaSummary.objective && (
            <span className="text-[11px] text-current opacity-70">{dnaSummary.objective.icon} {tObjectives(`${dnaSummary.objective.id}.label`).split(" ")[0]}</span>
          )}
          <div className="flex-1 min-w-[100px] h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
            <div className="h-full rounded-full bg-current transition-all" style={{ width: `${dnaSummary.pct}%`, color: "inherit" }} />
          </div>
        </div>
      )}

      {/* Formulaire principal — pleine largeur */}
      <BrandDnaForm initialData={initialData} />

      {/* Benchmark sectoriel — en bas, pleine largeur */}
      {initialData?.sector && (
        <PerplexityBenchmarkPanel
          initialBenchmark={benchmarkData}
          initialStale={benchmarkStale}
          sector={tSectors(initialData.sector)}
          primaryCulture={initialData.primaryCulture}
        />
      )}
    </div>
  )
}
