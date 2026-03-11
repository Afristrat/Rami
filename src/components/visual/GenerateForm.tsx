'use client'

import { useForm } from 'react-hook-form'
import { useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { GenerateBriefSchema, GenerateBriefInput } from '@/lib/schemas/visual.schema'
import { Sparkles, Loader2, AlertCircle } from 'lucide-react'

const PLATFORMS = [
  { value: 'instagram', label: 'Instagram', emoji: '📸' },
  { value: 'linkedin', label: 'LinkedIn', emoji: '💼' },
  { value: 'twitter', label: 'X / Twitter', emoji: '𝕏' },
  { value: 'facebook', label: 'Facebook', emoji: '📘' },
  { value: 'pinterest', label: 'Pinterest', emoji: '📌' },
  { value: 'youtube', label: 'YouTube', emoji: '▶' },
] as const

const BRIEF_EXAMPLES = [
  'Lancement d\'un nouveau café premium au Maroc, ambiance chaleureuse et moderne',
  'Campagne de recrutement pour une startup tech à Casablanca, innovante et humaine',
  'Promotion d\'une collection mode éco-responsable, élégante et engagée',
]

interface GenerateFormProps {
  onGenerate: (data: GenerateBriefInput) => Promise<void>
  isGenerating: boolean
  defaultPlatform?: string
  hasBrandDNA: boolean
  brandName?: string
}

export function GenerateForm({
  onGenerate,
  isGenerating,
  defaultPlatform = 'instagram',
  hasBrandDNA,
  brandName,
}: GenerateFormProps) {
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
    },
  })

  // useWatch obligatoire (React Compiler — watch() non mémoïsable)
  const briefValue = useWatch({ control, name: 'brief', defaultValue: '' })
  const selectedPlatform = useWatch({ control, name: 'platform', defaultValue: 'instagram' })

  const charCount = briefValue?.length ?? 0

  return (
    <form onSubmit={handleSubmit(onGenerate)} className="space-y-6">
      {/* Alerte Brand DNA */}
      {!hasBrandDNA && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="text-amber-300 font-medium">Brand DNA non configuré</p>
            <p className="text-amber-300/60 mt-0.5">
              Les visuels seront générés sans palette de marque personnalisée.{' '}
              <a href="/brand-dna/onboarding" className="underline hover:text-amber-300">
                Configurer maintenant &#8594;
              </a>
            </p>
          </div>
        </div>
      )}

      {hasBrandDNA && brandName && (
        <div className="flex items-center gap-2 text-xs text-white/40">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Brand DNA activé pour <span className="text-white/60 font-medium">{brandName}</span>
        </div>
      )}

      {/* Brief */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-white/80">
            Brief créatif <span className="text-violet-400">*</span>
          </label>
          <span className={`text-xs ${charCount > 1800 ? 'text-amber-400' : 'text-white/30'}`}>
            {charCount}/2000
          </span>
        </div>

        <textarea
          {...register('brief')}
          rows={4}
          placeholder="Décrivez le contenu à créer — contexte, message clé, audience, ton souhaité..."
          className="w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white placeholder-white/25 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-transparent transition-all"
        />

        {errors.brief && (
          <p className="text-xs text-red-400">{errors.brief.message}</p>
        )}

        {/* Exemples */}
        <div className="flex flex-wrap gap-2">
          {BRIEF_EXAMPLES.map((example, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setValue('brief', example)}
              className="text-xs px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.06] text-white/40 hover:text-white/70 hover:border-white/15 transition-all truncate max-w-[200px]"
            >
              {example.slice(0, 40)}...
            </button>
          ))}
        </div>
      </div>

      {/* Plateforme */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-white/80">Plateforme cible</label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {PLATFORMS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setValue('platform', p.value as GenerateBriefInput['platform'])}
              className={`flex flex-col items-center gap-1 px-2 py-3 rounded-xl border text-xs transition-all ${
                selectedPlatform === p.value
                  ? 'border-violet-500 bg-violet-500/20 text-violet-300'
                  : 'border-white/[0.08] bg-white/[0.04] text-white/50 hover:border-white/20 hover:text-white/70'
              }`}
            >
              <span className="text-base">{p.emoji}</span>
              <span className="font-medium">{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Options avancées */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs text-white/50">Directions visuelles</label>
          <select
            {...register('directions_count', { valueAsNumber: true })}
            className="w-full px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.08] text-white/80 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500/50"
          >
            <option value={1}>1 direction</option>
            <option value={2}>2 directions</option>
            <option value={3}>3 directions</option>
            <option value={4}>4 directions</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-white/50">Images par direction</label>
          <select
            {...register('images_per_direction', { valueAsNumber: true })}
            className="w-full px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.08] text-white/80 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500/50"
          >
            <option value={1}>1 image</option>
            <option value={2}>2 images</option>
            <option value={3}>3 images</option>
            <option value={4}>4 images</option>
            <option value={5}>5 images</option>
          </select>
        </div>
      </div>

      {/* Bouton générer */}
      <button
        type="submit"
        disabled={isGenerating || charCount < 10}
        className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white font-semibold text-sm transition-all hover:from-violet-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Génération en cours...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Générer les visuels
          </>
        )}
      </button>
    </form>
  )
}
