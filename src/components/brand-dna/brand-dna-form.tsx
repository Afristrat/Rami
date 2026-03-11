"use client"

import { useCallback, useState, useTransition } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Dna,
  Loader2,
  Palette,
  Target,
  User,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { saveBrandDnaAction } from "@/lib/actions/brand-dna.actions"
import { DnaScoreBadge, ColorPaletteSummary, VoiceToneBadge } from "./dna-score-badge"
import {
  brandDnaFormSchema,
  type BrandDnaFormData,
  SECTORS,
  CULTURES,
  type CultureId,
} from "@/lib/schemas/brand-dna.schema"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { LogoUploader } from "./logo-uploader"
import { ColorPalettePicker } from "./color-palette-picker"
import { VoiceTonePicker } from "./voice-tone-picker"

/* ─── Étapes ─────────────────────────────────────── */

const STEPS = [
  {
    id: 0,
    label: "Identité",
    icon: Dna,
    description: "Nom, secteur et positionnement de la marque",
  },
  {
    id: 1,
    label: "Palette Causse",
    icon: Palette,
    description: "3 couleurs psychologiquement calculées",
  },
  {
    id: 2,
    label: "Ton de voix",
    icon: User,
    description: "Le registre éditorial de la marque",
  },
  {
    id: 3,
    label: "Audience",
    icon: Target,
    description: "Qui sont vos clients idéaux ?",
  },
] as const

/* ─── Stepper ─────────────────────────────────────── */

function Stepper({ currentStep, completedSteps }: { currentStep: number; completedSteps: Set<number> }) {
  return (
    <nav aria-label="Étapes Brand DNA" className="mb-8">
      {/* Mobile : barre de progression */}
      <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground sm:hidden">
        <span>Étape {currentStep + 1} sur {STEPS.length}</span>
        <span className="font-medium text-foreground">{STEPS[currentStep].label}</span>
      </div>
      <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-muted sm:hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      {/* Desktop : steps horizontaux */}
      <ol className="hidden items-center sm:flex">
        {STEPS.map((step, idx) => {
          const isCompleted = completedSteps.has(idx)
          const isCurrent = idx === currentStep
          const Icon = step.icon
          return (
            <li key={step.id} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full border-2 transition-all",
                    isCompleted
                      ? "border-primary bg-primary text-primary-foreground"
                      : isCurrent
                        ? "border-primary bg-background text-primary"
                        : "border-border bg-background text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="size-4.5" />
                  ) : (
                    <Icon className="size-4" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium",
                    isCurrent ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    "mx-2 mt-[-18px] h-0.5 flex-1 transition-colors",
                    isCompleted ? "bg-primary" : "bg-border"
                  )}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/* ─── Champ formulaire ────────────────────────────── */

function FormField({
  label,
  error,
  required,
  children,
  hint,
}: {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

/* ─── Étape 0 — Identité ─────────────────────────── */

function StepIdentite({ form }: { form: ReturnType<typeof useForm<BrandDnaFormData>> }) {
  const { register, formState: { errors }, setValue } = form
  // useWatch garantit que le logo s'affiche dès le premier rendu en mode édition
  // et se met à jour immédiatement après upload / suppression
  const logoDataUrl = useWatch({ control: form.control, name: "logoDataUrl", defaultValue: "" })
  const logoFileName = useWatch({ control: form.control, name: "logoFileName", defaultValue: "" })

  return (
    <div className="space-y-5">
      <FormField label="Logo de la marque" hint="Optionnel — PNG, JPG, SVG ou WebP, max 10 Mo">
        <LogoUploader
          value={logoDataUrl}
          fileName={logoFileName}
          onChange={(dataUrl, fileName) => {
            setValue("logoDataUrl", dataUrl, { shouldDirty: true })
            setValue("logoFileName", fileName, { shouldDirty: true })
          }}
          onClear={() => {
            setValue("logoDataUrl", "", { shouldDirty: true })
            setValue("logoFileName", "", { shouldDirty: true })
          }}
        />
      </FormField>

      <FormField label="Nom de la marque" required error={errors.brandName?.message}>
        <Input
          {...register("brandName")}
          placeholder="ex : AI-MPower, NovaPay, FreshMarket..."
          aria-invalid={!!errors.brandName}
        />
      </FormField>

      <FormField
        label="Tagline"
        hint="Slogan ou promesse de marque (optionnel)"
        error={errors.tagline?.message}
      >
        <Input
          {...register("tagline")}
          placeholder="ex : L'IA qui vise juste."
          aria-invalid={!!errors.tagline}
        />
      </FormField>

      <FormField label="Secteur d'activité" required error={errors.sector?.message}>
        <select
          {...register("sector")}
          aria-invalid={!!errors.sector}
          className={cn(
            "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent",
            "disabled:cursor-not-allowed disabled:opacity-50",
            errors.sector && "border-destructive ring-2 ring-destructive/20"
          )}
        >
          <option value="">Choisissez un secteur...</option>
          {SECTORS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </FormField>

      <FormField
        label="Positionnement"
        required
        error={errors.positioning?.message}
        hint="Comment vous différenciez-vous de la concurrence ? Quelle est votre proposition de valeur unique ?"
      >
        <textarea
          {...register("positioning")}
          placeholder="ex : Nous aidons les agences digitales d'Afrique du Nord à produire 10x plus de contenu premium grâce à une IA qui comprend la neuropsychologie des couleurs et les codes culturels locaux."
          rows={4}
          aria-invalid={!!errors.positioning}
          className={cn(
            "flex min-h-[100px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors resize-y",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent",
            "disabled:cursor-not-allowed disabled:opacity-50",
            errors.positioning && "border-destructive ring-2 ring-destructive/20"
          )}
        />
      </FormField>
    </div>
  )
}

/* ─── Étape 1 — Palette ──────────────────────────── */

function StepPalette({ form }: { form: ReturnType<typeof useForm<BrandDnaFormData>> }) {
  const { setValue, formState: { errors } } = form
  const colorPrimary = useWatch({ control: form.control, name: "colorPrimary", defaultValue: "" })
  const colorSecondary = useWatch({ control: form.control, name: "colorSecondary", defaultValue: "" })
  const colorAccent = useWatch({ control: form.control, name: "colorAccent", defaultValue: "" })
  // Le secteur guide les recommandations Causse, la culture guide les notes contextuelles
  const sector = useWatch({ control: form.control, name: "sector", defaultValue: "" })
  const primaryCulture = useWatch({ control: form.control, name: "primaryCulture", defaultValue: "" })

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 dark:border-amber-900/50 dark:bg-amber-950/30">
        <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
          🎨 Méthode Jean-Gabriel Causse
        </p>
        <p className="mt-1 text-xs text-amber-700/90 dark:text-amber-400/90 leading-relaxed">
          Chaque couleur produit un effet neuropsychologique précis sur votre audience. Choisissez
          3 couleurs alignées avec l&apos;émotion que vous souhaitez déclencher.
          {sector && " Les badges ★ signalent les couleurs les plus efficaces pour votre secteur."}
        </p>
      </div>

      <ColorPalettePicker
        primary={colorPrimary}
        secondary={colorSecondary}
        accent={colorAccent}
        sector={sector || undefined}
        primaryCulture={primaryCulture || undefined}
        onChangePrimary={(id) => setValue("colorPrimary", id, { shouldValidate: true })}
        onChangeSecondary={(id) => setValue("colorSecondary", id, { shouldValidate: true })}
        onChangeAccent={(id) => setValue("colorAccent", id, { shouldValidate: true })}
        errors={{
          primary: errors.colorPrimary?.message,
          secondary: errors.colorSecondary?.message,
          accent: errors.colorAccent?.message,
        }}
      />
    </div>
  )
}

/* ─── Étape 2 — Ton de voix ──────────────────────── */

function StepTonDeVoix({ form }: { form: ReturnType<typeof useForm<BrandDnaFormData>> }) {
  const { setValue, formState: { errors } } = form
  const voiceTone = useWatch({ control: form.control, name: "voiceTone", defaultValue: "" })

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Le ton de voix détermine comment la marque s&apos;exprime sur toutes les plateformes — des
        captions Instagram aux posts LinkedIn.
      </p>
      <VoiceTonePicker
        value={voiceTone}
        onChange={(id) => setValue("voiceTone", id, { shouldValidate: true })}
        error={errors.voiceTone?.message}
      />
    </div>
  )
}

/* ─── Étape 3 — Audience ─────────────────────────── */

function StepAudience({ form }: { form: ReturnType<typeof useForm<BrandDnaFormData>> }) {
  const { register, setValue, formState: { errors } } = form
  const primaryCulture = useWatch({ control: form.control, name: "primaryCulture", defaultValue: "" })

  return (
    <div className="space-y-5">
      {/* Culture cible — SOP-005 Bloc B */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-foreground">Culture cible principale</p>
        <p className="text-xs text-muted-foreground">
          Détermine les codes visuels et symboliques prioritaires (Causse × culture)
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CULTURES.map((culture) => {
            const isSelected = primaryCulture === culture.id
            return (
              <button
                key={culture.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setValue("primaryCulture", isSelected ? "" : culture.id, { shouldDirty: true })}
                className={cn(
                  "flex items-center gap-2 rounded-lg border-2 px-3 py-2.5 text-left text-sm transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isSelected
                    ? "border-primary bg-primary/5 font-medium text-foreground"
                    : "border-border hover:border-primary/40 hover:bg-muted/50 text-muted-foreground"
                )}
              >
                <span className="text-base" aria-hidden="true">{culture.flag}</span>
                <span className="text-xs">{culture.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <FormField
        label="Description de l'audience cible"
        required
        error={errors.audienceDescription?.message}
        hint="Qui sont vos clients idéaux ? Quels sont leurs besoins, aspirations et douleurs ?"
      >
        <textarea
          {...register("audienceDescription")}
          placeholder="ex : Directeurs et directrices d'agences digitales au Maroc et en Afrique francophone, 30-50 ans, gérant 10 à 50 marques clientes. Ils cherchent à produire plus de contenu premium sans recruter. Leur douleur principale : maintenir la cohérence de marque sur plusieurs clients simultanément."
          rows={5}
          aria-invalid={!!errors.audienceDescription}
          className={cn(
            "flex min-h-[120px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors resize-y",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent",
            "disabled:cursor-not-allowed disabled:opacity-50",
            errors.audienceDescription && "border-destructive ring-2 ring-destructive/20"
          )}
        />
      </FormField>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          label="Tranche d'âge"
          error={errors.audienceAge?.message}
          hint="Optionnel"
        >
          <Input
            {...register("audienceAge")}
            placeholder="ex : 28-45 ans"
            aria-invalid={!!errors.audienceAge}
          />
        </FormField>

        <FormField
          label="Zone géographique"
          error={errors.audienceLocation?.message}
          hint="Optionnel"
        >
          <Input
            {...register("audienceLocation")}
            placeholder="ex : Maroc, Tunisie, France..."
            aria-invalid={!!errors.audienceLocation}
          />
        </FormField>
      </div>

      <FormField
        label="Points de douleur principaux"
        error={errors.audiencePainPoints?.message}
        hint="Quels problèmes votre marque résout-elle ? (optionnel)"
      >
        <textarea
          {...register("audiencePainPoints")}
          placeholder="ex : Manque de temps, budget limité pour le design, difficulté à mesurer le ROI du contenu social media..."
          rows={3}
          aria-invalid={!!errors.audiencePainPoints}
          className={cn(
            "flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors resize-y",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent",
            errors.audiencePainPoints && "border-destructive ring-2 ring-destructive/20"
          )}
        />
      </FormField>
    </div>
  )
}

/* ─── Récap finale ───────────────────────────────── */

function StepRecap({ data }: { data: BrandDnaFormData }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-900/50 dark:bg-green-950/30">
        <CheckCircle2 className="size-5 shrink-0 text-green-600 dark:text-green-400" />
        <div>
          <p className="text-sm font-semibold text-green-800 dark:text-green-300">
            Brand DNA prêt à être sauvegardé !
          </p>
          <p className="text-xs text-green-700/80 dark:text-green-400/80">
            Vérifiez les informations ci-dessous avant de valider.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* Identité */}
        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Identité
          </p>
          <div className="flex items-start gap-3">
            {data.logoDataUrl && (
              <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={data.logoDataUrl} alt="Logo" className="size-full object-contain p-0.5" />
              </div>
            )}
            <div>
              <p className="font-semibold text-foreground">{data.brandName}</p>
              {data.tagline && (
                <p className="text-xs text-muted-foreground italic">&ldquo;{data.tagline}&rdquo;</p>
              )}
              <p className="mt-0.5 text-xs text-muted-foreground">{data.sector}</p>
            </div>
          </div>
        </div>

        {/* Palette Causse (utilise ColorPaletteSummary) */}
        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Palette Causse
          </p>
          <ColorPaletteSummary
            primaryId={data.colorPrimary}
            secondaryId={data.colorSecondary}
            accentId={data.colorAccent}
          />
        </div>

        {/* Ton de voix (utilise VoiceToneBadge) */}
        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Ton de voix
          </p>
          {data.voiceTone && <VoiceToneBadge toneId={data.voiceTone} />}
        </div>

        {/* Audience & culture */}
        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Audience
          </p>
          {data.primaryCulture && (() => {
            const cult = CULTURES.find((c) => c.id === (data.primaryCulture as CultureId))
            return cult ? (
              <span className="mb-2 inline-flex items-center gap-1 rounded-full border border-blue-200/60 bg-blue-50/60 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:border-blue-800/40 dark:bg-blue-950/30 dark:text-blue-300">
                {cult.flag} {cult.label}
              </span>
            ) : null
          })()}
          <p className="line-clamp-3 text-xs text-foreground/80">{data.audienceDescription}</p>
          {(data.audienceAge || data.audienceLocation) && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {data.audienceAge && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                  {data.audienceAge}
                </span>
              )}
              {data.audienceLocation && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                  {data.audienceLocation}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Composant principal ────────────────────────── */

interface BrandDnaFormProps {
  initialData?: BrandDnaFormData | null
}

export function BrandDnaForm({ initialData }: BrandDnaFormProps) {
  const [currentStep, setCurrentStep] = useState(0)
  // Si initialData existe, toutes les étapes précédentes sont considérées complètes
  // → le récapitulatif s'affiche immédiatement à l'étape 4 en mode édition
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(
    initialData ? new Set([0, 1, 2]) : new Set()
  )
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const form = useForm<BrandDnaFormData>({
    resolver: zodResolver(brandDnaFormSchema),
    mode: "onTouched",
    defaultValues: initialData ?? {
      brandName: "",
      tagline: "",
      sector: "",
      positioning: "",
      logoDataUrl: "",
      logoFileName: "",
      colorPrimary: "",
      colorSecondary: "",
      colorAccent: "",
      voiceTone: "",
      primaryCulture: "",
      audienceDescription: "",
      audienceAge: "",
      audienceLocation: "",
      audiencePainPoints: "",
    },
  })

  // Champs par étape pour la validation partielle
  const STEP_FIELDS: (keyof BrandDnaFormData)[][] = [
    ["brandName", "sector", "positioning"],
    ["colorPrimary", "colorSecondary", "colorAccent"],
    ["voiceTone"],
    ["audienceDescription"],
  ]

  const validateCurrentStep = useCallback(async () => {
    const fields = STEP_FIELDS[currentStep]
    const result = await form.trigger(fields)
    return result
  }, [currentStep, form]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleNext = useCallback(async () => {
    const valid = await validateCurrentStep()
    if (!valid) return
    setCompletedSteps((prev) => new Set([...prev, currentStep]))
    setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1))
  }, [currentStep, validateCurrentStep])

  const handleBack = useCallback(() => {
    setCurrentStep((s) => Math.max(s - 1, 0))
  }, [])

  const handleSubmit = form.handleSubmit((data) => {
    setServerError(null)
    startTransition(async () => {
      const result = await saveBrandDnaAction(data)
      if ("error" in result) {
        setServerError(result.error)
      } else {
        setIsSubmitted(true)
      }
    })
  })

  // useWatch abonne le composant aux changements de formulaire (contrairement à getValues())
  // Nécessaire pour que DnaScoreBadge et StepRecap se mettent à jour en temps réel
  const watchedValues = useWatch({ control: form.control })
  const isLastStep = currentStep === STEPS.length - 1

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-10 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950">
          <CheckCircle2 className="size-8 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Brand DNA sauvegardé !</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Votre identité de marque est prête. RAMI va maintenant calibrer chaque post pour
            toucher précisément votre audience.
          </p>
        </div>
        <Button
          onClick={() => {
            setIsSubmitted(false)
            setCurrentStep(0)
            setCompletedSteps(new Set())
            form.reset()
          }}
          variant="outline"
          size="lg"
          className="mt-2"
        >
          Modifier le Brand DNA
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Stepper currentStep={currentStep} completedSteps={completedSteps} />

      {/* Card étape */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        {/* En-tête étape */}
        <div className="mb-6">
          <div className="flex items-center gap-2.5">
            {(() => {
              const StepIcon = STEPS[currentStep].icon
              return (
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <StepIcon className="size-4" />
                </div>
              )
            })()}
            <div>
              <h2 className="text-base font-bold text-foreground">
                {STEPS[currentStep].label}
              </h2>
              <p className="text-xs text-muted-foreground">
                {STEPS[currentStep].description}
              </p>
            </div>
          </div>
        </div>

        {/* Contenu étape */}
        {currentStep === 0 && <StepIdentite form={form} />}
        {currentStep === 1 && <StepPalette form={form} />}
        {currentStep === 2 && <StepTonDeVoix form={form} />}
        {currentStep === 3 && <StepAudience form={form} />}
      </div>

      {/* Score DNA en temps réel à l'étape 4 */}
      {isLastStep && (
        <div className="mt-4">
          <DnaScoreBadge data={watchedValues} />
        </div>
      )}

      {/* Récap si dernière étape et valide */}
      {isLastStep && completedSteps.size >= 3 && (
        <div className="mt-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-bold text-foreground">Récapitulatif</h3>
          <StepRecap data={watchedValues as BrandDnaFormData} />
        </div>
      )}

      {/* Erreur serveur */}
      {serverError && (
        <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 p-3.5">
          <AlertCircle className="size-4 shrink-0 text-destructive" />
          <p className="text-sm text-destructive">{serverError}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0 || isPending}
          className={cn(currentStep === 0 && "invisible")}
        >
          <ChevronLeft className="size-4" />
          Retour
        </Button>

        <span className="text-xs text-muted-foreground">
          {currentStep + 1} / {STEPS.length}
        </span>

        {isLastStep ? (
          <Button type="submit" size="lg" className="gap-1.5" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <CheckCircle2 className="size-4" />
                Sauvegarder le Brand DNA
              </>
            )}
          </Button>
        ) : (
          <Button type="button" onClick={handleNext} disabled={isPending}>
            Suivant
            <ChevronRight className="size-4" />
          </Button>
        )}
      </div>
    </form>
  )
}
