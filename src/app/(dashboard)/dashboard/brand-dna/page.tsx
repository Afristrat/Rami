import type { ReactNode } from "react"
import {
  Fingerprint,
  Pencil,
  TrendingUp,
  Info,
  Zap,
  Brain,
  Palette as PaletteIcon,
  TriangleAlert,
  Mic,
  Linkedin,
  Instagram,
  Twitter,
  Sparkles,
  Target,
  Users,
  BarChart3,
} from "lucide-react"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { getBrandDnaAction } from "@/lib/actions/brand-dna.actions"
import { computeDnaScore, getDnaScoreLevel } from "@/lib/utils/dna-score"
import {
  CAUSSE_COLORS,
  VOICE_TONES,
  CULTURES,
  COGNITIVE_OBJECTIVES,
  CULTURE_COLOR_NOTES,
} from "@/lib/schemas/brand-dna.schema"
import type { BrandDnaFormData } from "@/lib/schemas/brand-dna.schema"
import { cn } from "@/lib/utils"
import { BrandDnaOverviewClient } from "@/components/brand-dna/brand-dna-overview-client"
import { BrandDnaNav } from "@/components/brand-dna/brand-dna-nav"

/* ─── Mapping plateformes optimales par couleur (Causse) ─── */
const COLOR_NETWORKS: Record<string, string[]> = {
  bleu_marine: ["LinkedIn", "YouTube", "Facebook"],
  bleu_roi: ["LinkedIn", "YouTube", "Facebook"],
  rouge_passion: ["Instagram", "TikTok", "YouTube"],
  vert_emeraude: ["LinkedIn", "Instagram", "Facebook"],
  violet_creatif: ["Instagram", "TikTok", "Pinterest"],
  orange_chaleureux: ["Instagram", "TikTok", "YouTube"],
  jaune_optimiste: ["Instagram", "TikTok", "Pinterest"],
  rose_empathique: ["Instagram", "Pinterest", "TikTok"],
  or_prestige: ["LinkedIn", "Instagram", "Pinterest"],
  noir_elegance: ["LinkedIn", "Instagram", "X"],
  turquoise_innovation: ["LinkedIn", "Instagram", "YouTube"],
  bordeaux_premium: ["LinkedIn", "Instagram", "Facebook"],
}

/* ─── Générateur de post-exemples dynamiques ─── */
function generatePostExamples(
  data: BrandDnaFormData,
  tonLabel: string,
  toneId: string,
): { linkedin: string; instagram: string; twitter: string } {
  const brand = data.brandName || "Votre marque"
  const sector = data.sector || ""
  const positioning = data.positioning || ""

  // Extraire un mot-clé du positionnement (premier segment significatif)
  const posWords = positioning.split(/[\s,.;]+/).filter((w) => w.length > 5)
  const keyword = posWords[0] || "excellence"

  const toneExamples: Record<string, { linkedin: string; instagram: string; twitter: string }> = {
    expert: {
      linkedin: `Les données ne mentent pas. Dans le secteur ${sector || "de votre industrie"}, les marques qui alignent stratégie visuelle et psychologie cognitive performent 3x mieux. ${brand} applique cette méthode au quotidien.`,
      instagram: `Chaque couleur. Chaque forme. Chaque mot. Rien n'est laissé au hasard chez ${brand}. La science au service de votre marque.`,
      twitter: `Le contenu générique est mort. Place au calibrage neuropsychologique. ${brand} montre la voie. #BrandDNA #${keyword}`,
    },
    bienveillant: {
      linkedin: `Les marques qui réussissent ne vendent pas du contenu. Elles partagent une vision. ${brand} accompagne chaque client dans cette transformation, avec patience et conviction.`,
      instagram: `Derrière chaque marque forte, il y a une équipe qui croit en sa mission. Et si la vôtre commençait ici ? ${brand} est là pour vous.`,
      twitter: `Votre marque mérite mieux que du contenu générique. Elle mérite d'être comprise. #${brand} #Authenticité`,
    },
    inspirant: {
      linkedin: `Le futur du ${sector || "marketing"} appartient à ceux qui osent repenser les règles. ${brand} ne suit pas les tendances — ${brand} les crée.`,
      instagram: `Imaginez un monde où chaque post touche exactement la bonne émotion. Ce monde existe. Bienvenue chez ${brand}.`,
      twitter: `Pendant que les autres publient, ${brand} calibre. La différence se voit dans les résultats. #Vision #${keyword}`,
    },
    ludique: {
      linkedin: `Plot twist : votre audience ne scrolle pas pour voir des posts ennuyeux. ${brand} transforme chaque publication en moment de curiosité. Et ça, ça change tout.`,
      instagram: `Si vos couleurs ne racontent pas une histoire, qui le fera ? ${brand} rend chaque pixel mémorable.`,
      twitter: `POV : vous découvrez que les couleurs de votre marque ont un effet psychologique réel. Bienvenue chez ${brand}.`,
    },
    premium: {
      linkedin: `L'excellence ne se décrète pas, elle se construit. ${brand} incarne une approche rigoureuse où chaque détail visuel reflète la qualité de votre offre.`,
      instagram: `Le raffinement est dans les détails. Chaque visuel ${brand} est conçu pour inspirer confiance et admiration.`,
      twitter: `La qualité se reconnaît au premier regard. ${brand} ne fait pas de compromis. #Premium #${keyword}`,
    },
    direct: {
      linkedin: `Votre contenu ne performe pas ? Le problème n'est pas l'algorithme. C'est le manque de calibrage psychologique. ${brand} corrige ça.`,
      instagram: `Pas de blabla. Juste des résultats. ${brand} transforme votre présence digitale.`,
      twitter: `Contenu calibré. Résultats mesurables. ${brand}. Point. #Efficacité`,
    },
  }

  return toneExamples[toneId] ?? toneExamples.expert
}

/* ─── Calcul de complétude par section ─── */
function computeSectionScores(data: BrandDnaFormData) {
  // Identité : brandName + sector + positioning + tagline + objectifCognitif
  let identityScore = 0
  if (data.brandName && data.brandName.length >= 1) identityScore += 40
  if (data.sector && data.sector.length > 0) identityScore += 20
  if (data.positioning && data.positioning.length >= 10) identityScore += 20
  if (data.tagline && data.tagline.length > 0) identityScore += 8
  const hasObjectif =
    (data.objectifsCognitifs && data.objectifsCognitifs.length > 0) ||
    (data.objectifCognitif && data.objectifCognitif.length > 0)
  if (hasObjectif) identityScore += 12

  // Palette : 3 couleurs
  let paletteScore = 0
  if (data.colorPrimary) paletteScore += 40
  if (data.colorSecondary) paletteScore += 32
  if (data.colorAccent) paletteScore += 28

  // Ton : voiceTone
  const toneScore = data.voiceTone ? 100 : 0

  // Audience : description + culture + age + location + painPoints
  let audienceScore = 0
  if (data.audienceDescription && data.audienceDescription.length >= 20) audienceScore += 50
  if (data.primaryCulture && data.primaryCulture.length > 0) audienceScore += 20
  if (data.audienceAge && data.audienceAge.length > 0) audienceScore += 15
  if (data.audienceLocation && data.audienceLocation.length > 0) audienceScore += 10
  if (data.audiencePainPoints && data.audiencePainPoints.length > 0) audienceScore += 5

  return {
    identity: Math.min(identityScore, 100),
    palette: Math.min(paletteScore, 100),
    tone: Math.min(toneScore, 100),
    audience: Math.min(audienceScore, 100),
  }
}

export async function generateMetadata() {
  const t = await getTranslations("metadata")
  return {
    title: t("brandDna"),
    description: t("brandDnaDescription"),
  }
}

export default async function BrandDnaPage() {
  const t = await getTranslations("brandDna")
  const tColors = await getTranslations("brandDna.colors")
  const tCultures = await getTranslations("brandDna.cultures")
  const tObjectives = await getTranslations("brandDna.cognitiveObjectives")
  const tTones = await getTranslations("brandDna.voiceTones")
  const tCultureNotes = await getTranslations("brandDna.cultureColorNotes")
  const tScore = await getTranslations("brandDna.scoreLevel")
  const tSectors = await getTranslations("brandDna.sectors")
  const brandDnaResult = await getBrandDnaAction()

  const initialData = "data" in brandDnaResult ? brandDnaResult.data : null

  // Si pas de Brand DNA, afficher le state vide
  if (!initialData) {
    return <BrandDnaEmptyState />
  }

  // Calcul du score
  const score = computeDnaScore(initialData)
  const level = getDnaScoreLevel(score)
  const pct = Math.round(score * 100)

  // Résolution des couleurs
  const primaryColor = CAUSSE_COLORS.find(
    (c) => c.id === initialData.colorPrimary
  )
  const secondaryColor = CAUSSE_COLORS.find(
    (c) => c.id === initialData.colorSecondary
  )
  const accentColor = CAUSSE_COLORS.find(
    (c) => c.id === initialData.colorAccent
  )
  const _paletteColors = [primaryColor, secondaryColor, accentColor].filter(
    Boolean
  )

  // Résolution du ton
  const tone = VOICE_TONES.find((t) => t.id === initialData.voiceTone)

  // Résolution de la culture
  const culture = CULTURES.find((c) => c.id === initialData.primaryCulture)

  // Résolution objectif cognitif
  const dominantId =
    initialData.objectifsCognitifs?.[0] ?? initialData.objectifCognitif
  const objective = COGNITIVE_OBJECTIVES.find((o) => o.id === dominantId)

  // Note culturelle pour la couleur primaire
  const hasCultureNote =
    primaryColor && culture
      ? CULTURE_COLOR_NOTES[primaryColor.id]?.[culture.id] ?? false
      : false

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto space-y-8">
      <BrandDnaNav />

      {/* ─── Hero Section ─── */}
      <section className="glass-card rounded-xl p-8 sm:p-10 overflow-hidden relative">
        {/* Decorative blur */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 relative z-10">
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight mb-2">
                {t("title")} — {initialData.brandName}
              </h2>
              <p className="text-muted-foreground max-w-xl text-base sm:text-lg">
                {t("heroSubtitle")}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard/brand-dna/edit"
                className={cn(
                  "inline-flex items-center gap-2 px-5 py-2.5 border border-primary text-primary font-semibold rounded-lg",
                  "hover:bg-primary/10 transition-all text-sm"
                )}
              >
                <Pencil className="size-4" />
                {t("editBrandDna")}
              </Link>
              <BrandDnaOverviewClient initialData={initialData} />
            </div>
          </div>

          {/* Score Gauge */}
          <div className="flex flex-col items-center shrink-0">
            <div className="relative size-32 flex items-center justify-center">
              {/* Background circle */}
              <div className="absolute inset-0 rounded-full border-4 border-border dark:border-white/10" />
              {/* Gradient arc */}
              <svg
                className="absolute inset-0 size-full -rotate-90"
                viewBox="0 0 128 128"
              >
                <defs>
                  <linearGradient
                    id="gaugeGrad"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop offset="0%" stopColor="#7c3bed" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
                <circle
                  cx="64"
                  cy="64"
                  r="60"
                  fill="none"
                  stroke="url(#gaugeGrad)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${score * 377} ${377}`}
                  className="transition-all duration-700"
                />
              </svg>
              {/* Inner circle with score */}
              <div className="size-24 rounded-full bg-background flex flex-col items-center justify-center z-20 border border-border dark:border-white/5">
                <span className="text-2xl font-black text-foreground tabular-nums">
                  {score.toFixed(2)}
                </span>
                <span className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">
                  {t("score")}
                </span>
              </div>
            </div>
            <p className="mt-4 text-xs font-medium text-muted-foreground flex items-center gap-1">
              <TrendingUp
                className={cn(
                  "size-3.5",
                  score >= 0.7 ? "text-green-500" : "text-amber-500"
                )}
              />
              {tScore(`${level.labelKey}.label`)}
            </p>
          </div>
        </div>
      </section>

      {/* ─── Grid Layout ─── */}
      <div className="grid grid-cols-12 gap-6 lg:gap-8">
        {/* Section 1 — Identité de marque */}
        <div className="col-span-12 glass-card rounded-xl p-6 sm:p-8">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <Info className="size-3.5" /> {t("brandIdentity")}
          </h3>
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            <div className="flex gap-4 sm:gap-6 items-start">
              {/* Logo placeholder or actual logo */}
              <div className="size-20 sm:size-24 glass-card rounded-xl flex items-center justify-center border border-border dark:border-white/10 shrink-0 overflow-hidden">
                {initialData.logoDataUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={initialData.logoDataUrl}
                    alt={`Logo ${initialData.brandName}`}
                    className="size-full object-contain p-2"
                  />
                ) : (
                  <Fingerprint className="size-10 text-primary" />
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xl sm:text-2xl font-bold text-foreground">
                    {initialData.brandName}
                  </h4>
                  {initialData.sector && (
                    <span className="px-2 py-0.5 bg-primary/20 text-primary text-[10px] font-bold rounded uppercase">
                      {tSectors(initialData.sector)}
                    </span>
                  )}
                </div>
                {initialData.tagline && (
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    <span className="italic font-medium text-foreground">
                      &ldquo;{initialData.tagline}&rdquo;
                    </span>
                  </p>
                )}
                {culture && (
                  <p className="text-xs text-muted-foreground">
                    {culture.flag} {tCultures(culture.id)}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-4">
              {initialData.positioning && (
                <div>
                  <h5 className="text-xs font-bold text-muted-foreground uppercase mb-2 tracking-wider">
                    {t("positioning")}
                  </h5>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {initialData.positioning}
                  </p>
                </div>
              )}
              {objective && (
                <div>
                  <h5 className="text-xs font-bold text-muted-foreground uppercase mb-2 tracking-wider">
                    {t("cognitiveObjective")}
                  </h5>
                  <p className="text-sm text-foreground/80">
                    {objective.icon} {tObjectives(`${objective.id}.label`)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 2 — Palette Causse (enrichie) */}
        <div className="col-span-12 lg:col-span-7 glass-card rounded-xl p-6 sm:p-8">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mb-6">
            {t("caussePalette")}
          </h3>

          {/* Color cards with neuropsychological insights */}
          <div className="space-y-4 mb-8">
            {([
              { color: primaryColor, role: t("rolePrimary") },
              { color: secondaryColor, role: t("roleSecondary") },
              { color: accentColor, role: t("roleAccent") },
            ] as const).map(({ color, role }) => {
              if (!color) return null
              const networks = COLOR_NETWORKS[color.id] ?? []
              return (
                <div
                  key={color.id}
                  className="flex gap-4 items-start p-4 bg-muted/30 dark:bg-white/5 rounded-xl border border-border dark:border-white/5"
                >
                  {/* Swatch */}
                  <div className="shrink-0 space-y-1.5">
                    <div
                      className="size-14 sm:size-16 rounded-lg border border-white/10 shadow-lg"
                      style={{ backgroundColor: color.hex }}
                    />
                    <p className="text-[9px] text-muted-foreground text-center font-mono">
                      {color.hex}
                    </p>
                  </div>
                  {/* Details */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-foreground">
                        {tColors(`${color.id}.name`)}
                      </p>
                      <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[9px] font-bold rounded uppercase">
                        {role}
                      </span>
                    </div>
                    <p className="text-[10px] text-foreground/60 italic">
                      {tColors(`${color.id}.emotion`)}
                    </p>
                    {/* Neuropsychological effect */}
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                        {t("neuroEffect")}
                      </p>
                      <p className="text-xs text-foreground/70 leading-relaxed">
                        {tColors(`${color.id}.psycho`)}
                      </p>
                    </div>
                    {/* Sectors + Platforms */}
                    <div className="flex flex-wrap gap-3">
                      {color.sectors.length > 0 && (
                        <div>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                            {t("optimalSectors")}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {color.sectors.map((s) => (
                              <span
                                key={s}
                                className="text-[9px] bg-muted dark:bg-white/10 text-muted-foreground px-1.5 py-0.5 rounded"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {networks.length > 0 && (
                        <div>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                            {t("recommendedPlatforms")}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {networks.map((n) => (
                              <span
                                key={n}
                                className="text-[9px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded"
                              >
                                {n}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Harmony + Culture note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 items-start border-t border-border dark:border-white/5 pt-6">
            {primaryColor && secondaryColor && (
              <div className="flex items-center gap-4">
                <div className="size-16 sm:size-20 rounded-full border-2 border-dashed border-muted-foreground/20 flex items-center justify-center p-3 shrink-0">
                  <div
                    className="size-full rounded-full"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor.hex}, ${secondaryColor.hex})`,
                    }}
                  />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground mb-1">
                    {t("colorHarmony")}
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    {tColors(`${primaryColor.id}.emotion`)} + {tColors(`${secondaryColor.id}.emotion`)}
                  </p>
                </div>
              </div>
            )}
            {hasCultureNote && primaryColor && culture && (
              <div className="bg-amber-500/10 dark:bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg flex items-start gap-3">
                <TriangleAlert className="size-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-800 dark:text-amber-200 mb-1">
                    {t("context")} {culture ? tCultures(culture.id) : ""}
                  </p>
                  <p className="text-[10px] text-amber-700 dark:text-amber-300 leading-relaxed">
                    {tCultureNotes(`${primaryColor.id}.${culture.id}`)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 3 — Cognitif & Audience (enrichie) */}
        <div className="col-span-12 lg:col-span-5 glass-card rounded-xl p-6 sm:p-8 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">
              {t("cognitiveAudience")}
            </h3>
            {objective && (
              <div className="px-3 py-1 bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded-full flex items-center gap-1">
                <span>{objective.icon}</span>
                {tObjectives(`${objective.id}.shortName`)}
              </div>
            )}
          </div>

          <div className="space-y-5 flex-1">
            {/* Audience profile card */}
            {initialData.audienceDescription && (
              <div className="p-4 bg-muted/30 dark:bg-white/5 rounded-xl border border-border dark:border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="size-3.5 text-primary" />
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    {t("audienceProfile")}
                  </p>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {initialData.audienceDescription}
                </p>
              </div>
            )}

            {/* Metadata chips */}
            <div className="flex flex-wrap gap-2">
              {initialData.audienceAge && (
                <span className="text-[10px] bg-muted dark:bg-white/5 text-muted-foreground px-2.5 py-1 rounded-full border border-border dark:border-white/10">
                  {initialData.audienceAge}
                </span>
              )}
              {initialData.audienceLocation && (
                <span className="text-[10px] bg-muted dark:bg-white/5 text-muted-foreground px-2.5 py-1 rounded-full border border-border dark:border-white/10">
                  {initialData.audienceLocation}
                </span>
              )}
              {culture && (
                <span className="text-[10px] bg-muted dark:bg-white/5 text-muted-foreground px-2.5 py-1 rounded-full border border-border dark:border-white/10">
                  {culture.flag} {tCultures(culture.id)}
                </span>
              )}
            </div>

            {/* Cognitive objective details */}
            {objective && (
              <div className="p-4 bg-blue-500/5 dark:bg-blue-500/10 rounded-xl border border-blue-500/10">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="size-3.5 text-blue-500" />
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    {t("audienceAspirations")}
                  </p>
                </div>
                <p className="text-xs text-foreground/70 leading-relaxed mb-2">
                  {tObjectives(`${objective.id}.description`)}
                </p>
                {tObjectives(`${objective.id}.keywords`) && (
                  <div className="flex flex-wrap gap-1">
                    {tObjectives(`${objective.id}.keywords`).split(", ").filter(Boolean).map((kw) => (
                      <span
                        key={kw}
                        className="text-[9px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Pain points structured */}
            {initialData.audiencePainPoints && (
              <div className="p-4 bg-amber-500/5 dark:bg-amber-500/10 rounded-xl border border-amber-500/10">
                <div className="flex items-center gap-2 mb-2">
                  <TriangleAlert className="size-3.5 text-amber-500" />
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    {t("audienceChallenges")}
                  </p>
                </div>
                <ul className="space-y-1">
                  {initialData.audiencePainPoints
                    .split(/[,;.\n]+/)
                    .map((pp) => pp.trim())
                    .filter((pp) => pp.length > 0)
                    .map((pp, i) => (
                      <li
                        key={i}
                        className="text-xs text-foreground/70 leading-relaxed flex items-start gap-1.5"
                      >
                        <span className="text-amber-500 mt-0.5 shrink-0">
                          -
                        </span>
                        {pp}
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Section 4 — Ton éditorial (avec vrais exemples de posts) */}
        {tone && (() => {
          const postExamples = generatePostExamples(initialData, tTones(`${tone.id}.label`), tone.id)
          return (
            <div className="col-span-12 glass-card rounded-xl p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">
                    {t("editorialTone")}
                  </h3>
                  <p className="text-lg font-bold text-foreground">
                    {tone.icon} {tTones(`${tone.id}.label`)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {tTones(`${tone.id}.description`)}
                  </p>
                </div>
                <Mic className="size-7 text-primary" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                {/* LinkedIn preview */}
                <div className="p-4 bg-muted/50 dark:bg-white/5 rounded-xl border border-border dark:border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Linkedin className="size-3.5 text-[#0A66C2]" />
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        {t("linkedinPreview")}
                      </span>
                    </div>
                    <span className="text-[9px] text-muted-foreground/60 uppercase">
                      {t("examplePost")}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/80 leading-relaxed">
                    &ldquo;{postExamples.linkedin}&rdquo;
                  </p>
                  <div className="h-1 bg-[#0A66C2] w-2/3 rounded-full" />
                </div>
                {/* Instagram preview */}
                <div className="p-4 bg-muted/50 dark:bg-white/5 rounded-xl border border-border dark:border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Instagram className="size-3.5 text-[#E4405F]" />
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        {t("instagramPreview")}
                      </span>
                    </div>
                    <span className="text-[9px] text-muted-foreground/60 uppercase">
                      {t("examplePost")}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/80 leading-relaxed">
                    &ldquo;{postExamples.instagram}&rdquo;
                  </p>
                  <div className="h-1 bg-[#E4405F] w-1/2 rounded-full" />
                </div>
                {/* X preview */}
                <div className="p-4 bg-muted/50 dark:bg-white/5 rounded-xl border border-border dark:border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Twitter className="size-3.5 text-foreground" />
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        {t("twitterPreview")}
                      </span>
                    </div>
                    <span className="text-[9px] text-muted-foreground/60 uppercase">
                      {t("examplePost")}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/80 leading-relaxed">
                    &ldquo;{postExamples.twitter}&rdquo;
                  </p>
                  <div className="h-1 bg-foreground/40 w-1/3 rounded-full" />
                </div>
              </div>
              {/* Keywords */}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {tTones(`${tone.id}.keywords`).split(", ").filter(Boolean).map((kw) => (
                  <span
                    key={kw}
                    className="rounded-full bg-primary/10 dark:bg-primary/20 px-2 py-0.5 text-[10px] font-medium text-primary"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )
        })()}

        {/* Section 5 — Recommandations IA (enrichie) */}
        {(() => {
          const sections = computeSectionScores(initialData)
          const sectionEntries = [
            { key: "identity" as const, label: t("completenessIdentity"), score: sections.identity },
            { key: "palette" as const, label: t("completenessPalette"), score: sections.palette },
            { key: "tone" as const, label: t("completenessTone"), score: sections.tone },
            { key: "audience" as const, label: t("completenessAudience"), score: sections.audience },
          ]
          const impactLabels = { high: t("highImpact"), medium: t("mediumImpact"), low: t("lowImpact") }

          return (
            <div className="col-span-12 glass-card rounded-xl p-6 sm:p-8">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <BarChart3 className="size-3.5" />
                {t("aiRecommendations")}
              </h3>

              {/* Completeness overview bars */}
              <div className="mb-6 p-4 bg-muted/30 dark:bg-white/5 rounded-xl border border-border dark:border-white/5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
                  {t("completenessOverview")}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {sectionEntries.map(({ key, label, score: sScore }) => (
                    <div key={key} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-foreground">
                          {label}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-bold tabular-nums",
                            sScore >= 100 ? "text-green-600 dark:text-green-400" :
                            sScore >= 60 ? "text-blue-600 dark:text-blue-400" :
                            "text-amber-600 dark:text-amber-400"
                          )}
                        >
                          {t("completenessOf", { pct: String(sScore) })}
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted dark:bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-700",
                            sScore >= 100 ? "bg-green-500" :
                            sScore >= 60 ? "bg-blue-500" :
                            "bg-amber-500"
                          )}
                          style={{ width: `${sScore}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contextual recommendations */}
              <div className="space-y-3">
                {score < 1 && !initialData.logoDataUrl && (
                  <RecommendationRow
                    icon={<Zap className="size-5 text-primary" />}
                    title={t("addLogo")}
                    description={t("addLogoDesc")}
                    impact="high"
                    impactLabels={impactLabels}
                    highlight
                  />
                )}
                {score < 1 && !initialData.voiceTone && (
                  <RecommendationRow
                    icon={<Mic className="size-5 text-primary" />}
                    title={t("addTone")}
                    description={t("addToneDesc")}
                    impact="high"
                    impactLabels={impactLabels}
                    highlight
                  />
                )}
                {score < 1 && !initialData.audiencePainPoints && (
                  <RecommendationRow
                    icon={<Brain className="size-5 text-muted-foreground" />}
                    title={t("detailPainPoints")}
                    description={t("detailPainPointsDesc")}
                    impact="medium"
                    impactLabels={impactLabels}
                  />
                )}
                {score < 1 && !initialData.primaryCulture && (
                  <RecommendationRow
                    icon={<PaletteIcon className="size-5 text-muted-foreground" />}
                    title={t("specifyCulture")}
                    description={t("specifyCultureDesc")}
                    impact="medium"
                    impactLabels={impactLabels}
                  />
                )}
                {score < 1 && !(
                  (initialData.objectifsCognitifs && initialData.objectifsCognitifs.length > 0) ||
                  (initialData.objectifCognitif && initialData.objectifCognitif.length > 0)
                ) && (
                  <RecommendationRow
                    icon={<Target className="size-5 text-muted-foreground" />}
                    title={t("addObjective")}
                    description={t("addObjectiveDesc")}
                    impact="medium"
                    impactLabels={impactLabels}
                  />
                )}
                {score < 1 && (!initialData.audienceAge || !initialData.audienceLocation) && (
                  <RecommendationRow
                    icon={<Users className="size-5 text-muted-foreground" />}
                    title={t("addAudienceDetails")}
                    description={t("addAudienceDetailsDesc")}
                    impact="low"
                    impactLabels={impactLabels}
                  />
                )}
                {score >= 0.85 && (
                  <RecommendationRow
                    icon={<Sparkles className="size-5 text-primary" />}
                    title={t("brandDnaComplete")}
                    description={t("brandDnaCompleteDesc")}
                    impact="low"
                    impactLabels={impactLabels}
                    highlight
                  />
                )}
                {score >= 0.5 && score < 0.85 && (
                  <RecommendationRow
                    icon={<Zap className="size-5 text-primary" />}
                    title={t("improveCompleteness")}
                    description={t("improveCompletenessDesc", { pct: String(pct) })}
                    impact="high"
                    impactLabels={impactLabels}
                    highlight
                  />
                )}
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}

/* ─── Recommendation Row ─── */
function RecommendationRow({
  icon,
  title,
  description,
  impact,
  impactLabels,
  highlight,
}: {
  icon: ReactNode
  title: string
  description: string
  impact: "high" | "medium" | "low"
  impactLabels: Record<"high" | "medium" | "low", string>
  highlight?: boolean
}) {
  const impactStyles = {
    high: "bg-red-500/20 text-red-600 dark:text-red-400",
    medium: "bg-amber-500/20 text-amber-600 dark:text-amber-400",
    low: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
  }

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl border",
        highlight
          ? "bg-primary/5 dark:bg-primary/5 border-primary/20"
          : "bg-muted/30 dark:bg-white/5 border-border dark:border-white/5"
      )}
    >
      <div
        className={cn(
          "size-10 rounded-full flex items-center justify-center shrink-0",
          highlight ? "bg-primary/20" : "bg-muted dark:bg-white/10"
        )}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="text-right shrink-0">
        <span
          className={cn(
            "px-2 py-0.5 text-[10px] font-bold rounded uppercase",
            impactStyles[impact]
          )}
        >
          {impactLabels[impact]}
        </span>
      </div>
    </div>
  )
}

/* ─── Empty State ─── */
async function BrandDnaEmptyState() {
  const t = await getTranslations("brandDna")

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto space-y-6">
      <BrandDnaNav />
      <section className="glass-card rounded-xl p-10 sm:p-16 text-center space-y-6">
        <div className="mx-auto size-20 rounded-full bg-primary/10 flex items-center justify-center">
          <Fingerprint className="size-10 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            {t("emptyState")}
          </h2>
          <p className="mt-2 text-muted-foreground max-w-lg mx-auto">
            {t("emptyStateDescriptionAlt")}
          </p>
        </div>
        <Link
          href="/dashboard/brand-dna/edit"
          className={cn(
            "inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white",
            "rami-btn-gradient shadow-lg shadow-primary/20"
          )}
        >
          <Sparkles className="size-4" />
          {t("configureBrandDna")}
        </Link>
      </section>
    </div>
  )
}
