'use client'

import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { GenerateBriefSchema, GenerateBriefInput } from '@/lib/schemas/visual.schema'
import { Sparkles, Loader2, AlertCircle, ChevronDown, ChevronUp, Palette, Shapes, Globe, X } from 'lucide-react'
import { TranslatedFieldError } from '@/components/ui/field-error-i18n'
import {
  InstagramIcon,
  LinkedInIcon,
  TwitterXIcon,
  FacebookIcon,
  PinterestIcon,
  YouTubeIcon,
} from '@/components/connections/platform-icons'
import { useTranslations } from 'next-intl'
import type { BrandDNASummary } from '@/lib/actions/visual.actions'
import { CAMPAIGN_TYPES } from '@/lib/config/campaign-types'

const PLATFORMS = [
  { value: 'instagram', label: 'Instagram', Icon: InstagramIcon, color: '#E1306C', bgClass: 'bg-[#E1306C]/10', textClass: 'text-[#E1306C]', activeBg: 'bg-[#E1306C]/20', activeBorder: 'border-[#E1306C]' },
  { value: 'linkedin', label: 'LinkedIn', Icon: LinkedInIcon, color: '#0A66C2', bgClass: 'bg-[#0A66C2]/10', textClass: 'text-[#0A66C2]', activeBg: 'bg-[#0A66C2]/20', activeBorder: 'border-[#0A66C2]' },
  { value: 'twitter', label: 'X / Twitter', Icon: TwitterXIcon, color: '#1D9BF0', bgClass: 'bg-[#1D9BF0]/10', textClass: 'text-[#1D9BF0]', activeBg: 'bg-[#1D9BF0]/20', activeBorder: 'border-[#1D9BF0]' },
  { value: 'facebook', label: 'Facebook', Icon: FacebookIcon, color: '#1877F2', bgClass: 'bg-[#1877F2]/10', textClass: 'text-[#1877F2]', activeBg: 'bg-[#1877F2]/20', activeBorder: 'border-[#1877F2]' },
  { value: 'pinterest', label: 'Pinterest', Icon: PinterestIcon, color: '#E60023', bgClass: 'bg-[#E60023]/10', textClass: 'text-[#E60023]', activeBg: 'bg-[#E60023]/20', activeBorder: 'border-[#E60023]' },
  { value: 'youtube', label: 'YouTube', Icon: YouTubeIcon, color: '#FF0000', bgClass: 'bg-[#FF0000]/10', textClass: 'text-[#FF0000]', activeBg: 'bg-[#FF0000]/20', activeBorder: 'border-[#FF0000]' },
] as const

// 4 Direction templates matching prompt-compiler.ts
const DIRECTION_PREVIEWS = [
  {
    id: 1 as const,
    name: 'Blueprint Scientifique',
    style: 'Professionnel, data-driven, technique',
    composition: 'Grille structur\u00e9e, layout architectural, g\u00e9om\u00e9trique',
    emotion: 'Confiance, autorit\u00e9, expertise',
    colorEmphasis: 'Bleus froids, blancs, palette structur\u00e9e',
    accentColor: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
  },
  {
    id: 2 as const,
    name: 'Machine Narratif',
    style: 'Dynamique, audacieux, \u00e9ditorial puissant',
    composition: '\u00c9nergie diagonale, contraste fort, \u00e9clairage dramatique',
    emotion: 'Urgence, puissance, transformation',
    colorEmphasis: 'Contraste \u00e9lev\u00e9, accents satur\u00e9s, fonds sombres',
    accentColor: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
  },
  {
    id: 3 as const,
    name: 'Carte & Aspiration',
    style: 'Aspirationnel, lifestyle premium, luxe \u00e9ditorial',
    composition: 'Harmonie \u00e9quilibr\u00e9e, ratio dor\u00e9, espace n\u00e9gatif \u00e9l\u00e9gant',
    emotion: 'Aspiration, d\u00e9sir, statut',
    colorEmphasis: 'Ors chauds, tons profonds, palette sophistiqu\u00e9e',
    accentColor: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
  },
  {
    id: 4 as const,
    name: 'Dashboard Expertise',
    style: 'Tech moderne, minimal, data visualization',
    composition: 'Syst\u00e8me de grille, layout modulaire, hi\u00e9rarchie',
    emotion: 'Ma\u00eetrise, clart\u00e9, innovation',
    colorEmphasis: 'Monochromatique avec accent strat\u00e9gique',
    accentColor: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/30',
  },
]

// Gestalt shape labels by sector
const GESTALT_LABELS: Record<string, string> = {
  finance: 'Carr\u00e9 \u2014 Stabilit\u00e9, ordre, fiabilit\u00e9',
  tech: 'Diagonales \u2014 Dynamisme, vitesse, innovation',
  sant\u00e9: 'Cercle \u2014 Communaut\u00e9, unit\u00e9, protection',
  agro: 'Courbes \u2014 \u00c9l\u00e9gance, fluidit\u00e9, naturel',
  luxe: 'Courbes \u2014 \u00c9l\u00e9gance, fluidit\u00e9, douceur',
  startups: 'Triangle \u2014 Ambition, performance, direction',
  data: 'Grille \u2014 Clart\u00e9, organisation, expertise',
}

// Culture labels
const CULTURE_LABELS: Record<string, string> = {
  maroc: 'Maroc \u2014 Esth\u00e9tique nord-africaine, palette m\u00e9diterran\u00e9enne',
  afrique_subsaharienne: 'Afrique \u2014 Tons terre riches, motifs vibrants',
  europe_francophone: 'Europe \u2014 \u00c9l\u00e9gance fran\u00e7aise, design raffin\u00e9',
  moyen_orient: 'Moyen-Orient \u2014 Luxe, motifs g\u00e9om\u00e9triques, accents dor\u00e9s',
  international: 'International \u2014 Universel, multiculturel',
}

interface GenerateFormProps {
  onGenerate: (data: GenerateBriefInput & { platforms: string[] }) => Promise<void>
  isGenerating: boolean
  defaultPlatform?: string
  hasBrandDNA: boolean
  brandName?: string
  brandDNASummary?: BrandDNASummary
  /** Autorise la sélection de PLUSIEURS plateformes (génère une série par plateforme). */
  multiPlatform?: boolean
}

export function GenerateForm({
  onGenerate,
  isGenerating,
  defaultPlatform = 'instagram',
  hasBrandDNA,
  brandName,
  brandDNASummary,
  multiPlatform = false,
}: GenerateFormProps) {
  const t = useTranslations('visuals.form')
  const tc = useTranslations('visuals.campaigns')
  const [directionsOpen, setDirectionsOpen] = useState(true)
  const [enabledDirections, setEnabledDirections] = useState<Set<number>>(
    new Set([1, 2, 3, 4])
  )
  const [selectedCampaignType, setSelectedCampaignType] = useState<string | undefined>(undefined)
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(
    new Set([defaultPlatform])
  )

  const BRIEF_EXAMPLES = [
    "Lancement d'un nouveau caf\u00e9 premium au Maroc, ambiance chaleureuse et moderne",
    "Campagne de recrutement pour une startup tech \u00e0 Casablanca, innovante et humaine",
    "Promotion d'une collection mode \u00e9co-responsable, \u00e9l\u00e9gante et engag\u00e9e",
  ]

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<GenerateBriefInput>({
    resolver: zodResolver(GenerateBriefSchema),
    defaultValues: {
      brief: '',
      platform: (defaultPlatform as GenerateBriefInput['platform']) ?? 'instagram',
      directions_count: 4,
      images_per_direction: 5,
      campaignType: undefined,
    },
  })

  const briefValue = useWatch({ control, name: 'brief', defaultValue: '' })
  const charCount = briefValue?.length ?? 0

  const toggleDirection = (id: number) => {
    setEnabledDirections((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        if (next.size <= 1) return prev // Au moins une direction
        next.delete(id)
      } else {
        next.add(id)
      }
      setValue('directions_count', next.size as 1 | 2 | 3 | 4)
      return next
    })
  }

  const handlePlatformClick = (value: string) => {
    setSelectedPlatforms((prev) => {
      const next = new Set(prev)
      if (multiPlatform) {
        if (next.has(value)) {
          if (next.size <= 1) return prev // Au moins une plateforme
          next.delete(value)
        } else {
          next.add(value)
        }
      } else {
        next.clear()
        next.add(value)
      }
      // La 1re plateforme alimente le champ `platform` (validité du schéma).
      setValue('platform', (next.values().next().value as GenerateBriefInput['platform']))
      return next
    })
  }

  const submit = handleSubmit((data) =>
    onGenerate({ ...data, platforms: Array.from(selectedPlatforms) })
  )

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* Hidden : directions_count synced by toggleDirection */}
      <input type="hidden" {...register('directions_count', { valueAsNumber: true })} />

      {/* Alerte Brand DNA */}
      {!hasBrandDNA && (
        <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="text-amber-700 dark:text-amber-300 font-medium">{t('brandDnaNotConfigured')}</p>
            <p className="text-amber-700/70 dark:text-amber-300/60 text-xs mt-0.5">
              {t('brandDnaNotConfiguredDesc')}{' '}
              <a href="/brand-dna/onboarding" className="underline hover:text-amber-600 dark:hover:text-amber-300">
                {t('configure')} &rarr;
              </a>
            </p>
          </div>
        </div>
      )}

      {hasBrandDNA && brandName && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          {t('brandDnaActive')} <span className="text-foreground font-medium">{brandName}</span>
        </div>
      )}

      {/* Campaign Type Selector */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-foreground">
            {tc('title')}
          </label>
          <span className="text-xs text-muted-foreground">
            {tc('optional')}
          </span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin scrollbar-thumb-muted">
          {CAMPAIGN_TYPES.map((ct) => {
            const isActive = selectedCampaignType === ct.id
            const Icon = ct.icon
            return (
              <button
                key={ct.id}
                type="button"
                onClick={() => {
                  if (isActive) {
                    setSelectedCampaignType(undefined)
                    setValue('campaignType', undefined)
                  } else {
                    setSelectedCampaignType(ct.id)
                    setValue('campaignType', ct.id)
                  }
                }}
                className={`group relative flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'border-violet-500 bg-violet-500/15 text-violet-700 dark:text-violet-300 shadow-sm'
                    : 'border-border bg-muted/40 text-muted-foreground hover:border-muted-foreground/30 hover:bg-muted/60'
                }`}
                title={tc(ct.descriptionKey)}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-violet-500' : 'text-muted-foreground'}`} />
                <span>{tc(ct.labelKey)}</span>
                {isActive && (
                  <X className="w-3 h-3 text-violet-400 ml-0.5" />
                )}
              </button>
            )
          })}
        </div>

        {/* Suggested platforms for selected campaign type */}
        {selectedCampaignType && (() => {
          const ct = CAMPAIGN_TYPES.find((c) => c.id === selectedCampaignType)
          if (!ct) return null
          return (
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span>{tc(ct.descriptionKey)}</span>
              <span className="text-muted-foreground/40">|</span>
              <span>
                {ct.suggestedPlatforms.map((p) => {
                  const plat = PLATFORMS.find((pl) => pl.value === p)
                  return plat?.label ?? p
                }).join(', ')}
              </span>
            </div>
          )
        })()}
      </div>

      {/* Hidden campaign type input */}
      <input type="hidden" {...register('campaignType')} />

      {/* Brief */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">
            {t('briefLabel')} <span className="text-violet-500">*</span>
          </label>
          <span className={`text-xs ${charCount > 1800 ? 'text-amber-500' : 'text-muted-foreground'}`}>
            {charCount}/2000
          </span>
        </div>

        <textarea
          {...register('brief')}
          rows={3}
          placeholder={t('briefPlaceholder')}
          className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-input text-foreground placeholder:text-muted-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-transparent transition-all"
        />

        {errors.brief && <TranslatedFieldError message={errors.brief.message} />}

        {/* Exemples */}
        <div className="flex flex-wrap gap-1.5">
          {BRIEF_EXAMPLES.map((example, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setValue('brief', example)}
              className="text-xs px-2 py-1 rounded-md bg-muted border border-border text-muted-foreground hover:text-foreground transition-all truncate max-w-[200px]"
            >
              {example.slice(0, 38)}...
            </button>
          ))}
        </div>
      </div>

      {/* Apercu des directions visuelles */}
      <div className="border border-border rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setDirectionsOpen(!directionsOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-medium text-foreground">
              {t('directionsPreviewTitle')}
            </span>
            <span className="text-xs text-muted-foreground">
              ({enabledDirections.size} {enabledDirections.size > 1 ? t('directionsActive') : t('directionActive')})
            </span>
          </div>
          {directionsOpen ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        {directionsOpen && (
          <div className="p-4 space-y-4">
            {/* Brand DNA context bar */}
            {hasBrandDNA && brandDNASummary && (
              <div className="flex flex-wrap gap-3 p-3 rounded-lg bg-muted/40 border border-border">
                {/* Couleurs palette */}
                {brandDNASummary.colorPalette && brandDNASummary.colorPalette.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Palette className="w-3.5 h-3.5 text-muted-foreground" />
                    <div className="flex items-center gap-1">
                      {brandDNASummary.colorPalette.map((c, i) => (
                        <div
                          key={i}
                          className="w-5 h-5 rounded-md border border-border"
                          style={{ backgroundColor: c.hex }}
                          title={`${c.hex}${c.name ? ` \u2014 ${c.name}` : ''}${c.emotion ? ` (${c.emotion})` : ''}`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{t('brandPalette')}</span>
                  </div>
                )}

                {/* Forme Gestalt */}
                {brandDNASummary.sector && GESTALT_LABELS[brandDNASummary.sector] && (
                  <div className="flex items-center gap-2">
                    <Shapes className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">
                      {GESTALT_LABELS[brandDNASummary.sector]}
                    </span>
                  </div>
                )}

                {/* Culture */}
                {brandDNASummary.primaryCulture && CULTURE_LABELS[brandDNASummary.primaryCulture] && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">
                      {CULTURE_LABELS[brandDNASummary.primaryCulture]}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* 4 direction cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DIRECTION_PREVIEWS.map((dir) => {
                const isEnabled = enabledDirections.has(dir.id)
                return (
                  <button
                    key={dir.id}
                    type="button"
                    onClick={() => toggleDirection(dir.id)}
                    className={`text-left p-3 rounded-xl border-2 transition-all ${
                      isEnabled
                        ? `${dir.borderColor} ${dir.bgColor}`
                        : 'border-border bg-muted/20 opacity-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${isEnabled ? dir.accentColor : 'text-muted-foreground'}`}>
                            {dir.id}.
                          </span>
                          <span className={`text-sm font-semibold ${isEnabled ? dir.accentColor : 'text-muted-foreground'}`}>
                            {dir.name}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-snug">{dir.style}</p>
                        <p className="text-[10px] text-muted-foreground/70">{dir.composition}</p>
                      </div>
                      <div
                        className={`shrink-0 mt-0.5 w-4 h-4 rounded-md border-2 flex items-center justify-center transition-all ${
                          isEnabled
                            ? `${dir.borderColor} ${dir.bgColor}`
                            : 'border-muted-foreground/30'
                        }`}
                      >
                        {isEnabled && (
                          <svg className={`w-2.5 h-2.5 ${dir.accentColor}`} viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium ${
                        isEnabled ? `${dir.bgColor} ${dir.accentColor}` : 'bg-muted text-muted-foreground'
                      }`}>
                        {dir.emotion}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Rangee inferieure : plateforme + options + bouton */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        {/* Plateformes */}
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => {
            const isActive = selectedPlatforms.has(p.value)
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => handlePlatformClick(p.value)}
                className={`group flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-xs font-semibold transition-all ${
                  isActive
                    ? `${p.activeBorder} ${p.activeBg} shadow-sm`
                    : 'border-border bg-muted/40 text-muted-foreground hover:border-muted-foreground/30 hover:bg-muted/60'
                }`}
                title={p.label}
              >
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-lg transition-all ${
                    isActive
                      ? `${p.activeBg} ${p.textClass}`
                      : `${p.bgClass} ${p.textClass} opacity-60 group-hover:opacity-100`
                  }`}
                >
                  <p.Icon className="size-4" />
                </span>
                <span className={`hidden sm:inline ${isActive ? p.textClass : ''}`}>
                  {p.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* Options + bouton (ml-auto sur sm+) */}
        <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
          <select
            {...register('images_per_direction', { valueAsNumber: true })}
            className="px-2.5 py-1.5 rounded-lg bg-muted/50 border border-input text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-violet-500/50 cursor-pointer"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n} {n > 1 ? t('images') : t('image')}</option>
            ))}
          </select>

          <button
            type="submit"
            disabled={isGenerating || charCount < 10}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white font-semibold text-sm transition-all hover:from-violet-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('inProgress')}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {t('generateVisuals')}
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  )
}
