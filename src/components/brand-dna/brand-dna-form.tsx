"use client"

import React, { useCallback, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Crown,
  Dna,
  ExternalLink,
  Link2,
  Loader2,
  Palette,
  Target,
  TriangleAlert,
  User,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { saveBrandDnaAction } from "@/lib/actions/brand-dna.actions"
import { DnaScoreBadge, ColorPaletteSummary, VoiceToneBadge } from "./dna-score-badge"
import {
  brandDnaFormSchema,
  type BrandDnaFormData,
  CULTURES,
  COGNITIVE_OBJECTIVES,
  type CultureId,
} from "@/lib/schemas/brand-dna.schema"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { LogoUploader } from "./logo-uploader"
import { ColorPalettePicker } from "./color-palette-picker"
import { VoiceTonePicker } from "./voice-tone-picker"
import {
  TwitterXIcon,
  LinkedInIcon,
  InstagramIcon,
  FacebookIcon,
  PinterestIcon,
} from "@/components/connections/platform-icons"

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
  {
    id: 4,
    label: "Connexions",
    icon: Link2,
    description: "Connectez vos comptes sociaux",
  },
] as const

/* ─── Plateformes onboarding (Feature 1) ──────────── */

const ONBOARDING_PLATFORMS = [
  {
    id: "twitter",
    label: "X (Twitter)",
    description: "Tweets, threads — 280 caractères",
    Icon: TwitterXIcon,
    color: "text-foreground",
    bgColor: "bg-foreground/[0.08]",
    borderColor: "border-foreground/10",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    description: "Contenu professionnel — 3 000 caractères",
    Icon: LinkedInIcon,
    color: "text-[#0A66C2]",
    bgColor: "bg-[#0A66C2]/10",
    borderColor: "border-[#0A66C2]/20",
  },
  {
    id: "facebook",
    label: "Facebook",
    description: "Pages et publications planifiées",
    Icon: FacebookIcon,
    color: "text-[#1877F2]",
    bgColor: "bg-[#1877F2]/10",
    borderColor: "border-[#1877F2]/20",
  },
  {
    id: "instagram",
    label: "Instagram",
    description: "Photos, reels — 2 200 caractères",
    Icon: InstagramIcon,
    color: "text-[#E1306C]",
    bgColor: "bg-[#E1306C]/10",
    borderColor: "border-[#E1306C]/20",
  },
  {
    id: "pinterest",
    label: "Pinterest",
    description: "Épingles visuelles haute durée de vie",
    Icon: PinterestIcon,
    color: "text-[#E60023]",
    bgColor: "bg-[#E60023]/10",
    borderColor: "border-[#E60023]/20",
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
  const fieldId = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  return (
    <div className="space-y-1.5">
      <Label htmlFor={fieldId} className="text-sm font-medium">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<{ id?: string }>, { id: fieldId })
        : children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

/* ─── Étape 0 — Identité ─────────────────────────── */

function StepIdentite({ form }: { form: ReturnType<typeof useForm<BrandDnaFormData>> }) {
  const { register, formState: { errors }, setValue } = form

  const logoDataUrl = useWatch({ control: form.control, name: "logoDataUrl", defaultValue: "" })
  const logoFileName = useWatch({ control: form.control, name: "logoFileName", defaultValue: "" })
  const sector = useWatch({ control: form.control, name: "sector", defaultValue: "" })
  const objectifsCognitifs = useWatch({ control: form.control, name: "objectifsCognitifs", defaultValue: [] })
  const objectifCognitifCustom = useWatch({ control: form.control, name: "objectifCognitifCustom", defaultValue: "" })

  const selectedObjectifs = objectifsCognitifs ?? []
  const dominantId = selectedObjectifs[0] ?? null

  function handleObjectifToggle(id: string) {
    const current = selectedObjectifs
    if (current.includes(id)) {
      setValue("objectifsCognitifs", current.filter((x) => x !== id), { shouldDirty: true })
    } else {
      setValue("objectifsCognitifs", [...current, id], { shouldDirty: true })
    }
  }

  const showCustomInput = selectedObjectifs.includes("epatez_nous")
  const overLimit = selectedObjectifs.length > 3

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

      {/* ── Secteur — Feature 2 : 30 secteurs groupés + Autre ── */}
      <div className="space-y-2">
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
            <optgroup label="Finance & Services">
              <option>Finance & Banque</option>
              <option>Finance Islamique</option>
              <option>Assurance & Mutuelles</option>
            </optgroup>
            <optgroup label="Immobilier & Industrie">
              <option>Immobilier & Promotion</option>
              <option>BTP & Construction</option>
              <option>Industrie & Manufacturing</option>
              <option>Agroalimentaire & Agriculture</option>
              <option>Énergie & Environnement</option>
            </optgroup>
            <optgroup label="Santé & Bien-être">
              <option>Santé & Médical</option>
              <option>Pharmacie & Parapharmacie</option>
              <option>Bien-être & Spa</option>
            </optgroup>
            <optgroup label="Tech & Digital">
              <option>Tech & SaaS</option>
              <option>Intelligence Artificielle & Data</option>
              <option>Cybersécurité</option>
              <option>E-commerce & Marketplace</option>
              <option>Télécommunications</option>
            </optgroup>
            <optgroup label="Éducation & Médias">
              <option>Éducation & Formation</option>
              <option>EdTech & E-learning</option>
              <option>Média & Presse</option>
              <option>Marketing & Publicité</option>
            </optgroup>
            <optgroup label="Conseil & Droit">
              <option>Consulting & Conseil</option>
              <option>Ressources Humaines</option>
              <option>Juridique & Droit</option>
            </optgroup>
            <optgroup label="Luxe & Lifestyle">
              <option>Luxe & Haute Couture</option>
              <option>Mode & Prêt-à-porter</option>
              <option>Beauté & Cosmétiques</option>
              <option>Sport & Fitness</option>
              <option>Tourisme & Hospitality</option>
              <option>Restauration & Food</option>
            </optgroup>
            <optgroup label="Impact & Autre">
              <option>ONG & Social Impact</option>
              <option>Autre</option>
            </optgroup>
          </select>
        </FormField>

        {/* Champ libre obligatoire si "Autre" */}
        {sector === "Autre" && (
          <FormField
            label="Précisez votre secteur"
            required
            error={errors.sectorCustom?.message}
          >
            <Input
              {...register("sectorCustom")}
              placeholder="ex : Aquaculture, Architecture d'intérieur, Édition jeunesse..."
              aria-invalid={!!errors.sectorCustom}
              autoFocus
            />
          </FormField>
        )}
      </div>

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

      {/* ── Objectifs cognitifs — Feature 3 + 4 : multi-select + promesses ── */}
      <div className="space-y-2">
        <div>
          <p className="text-sm font-semibold text-foreground">Objectifs cognitifs</p>
          <p className="text-xs text-muted-foreground">
            Quelle(s) réaction(s) souhaitez-vous déclencher ? Le premier sélectionné est
            l&apos;objectif dominant. Détermine les styles visuels générés par RAMI.
          </p>
        </div>

        {/* Avertissement si > 3 sélectionnés */}
        {overLimit && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-900/50 dark:bg-amber-950/30">
            <TriangleAlert className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Plus de 3 objectifs peuvent diluer le message. Nous recommandons d&apos;en choisir 1 à 3.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {COGNITIVE_OBJECTIVES.map((obj) => {
            const isSelected = selectedObjectifs.includes(obj.id)
            const isDominant = obj.id === dominantId

            return (
              <button
                key={obj.id}
                type="button"
                role="checkbox"
                aria-checked={isSelected}
                onClick={() => handleObjectifToggle(obj.id)}
                className={cn(
                  "flex items-start gap-3 rounded-xl border-2 p-3 text-left transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40 hover:bg-muted/50"
                )}
              >
                {/* Checkbox custom */}
                <div
                  className={cn(
                    "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border-2 transition-all",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border"
                  )}
                  aria-hidden="true"
                >
                  {isSelected && <CheckCircle2 className="size-3" />}
                </div>

                <span className="mt-0.5 text-xl leading-none" aria-hidden="true">{obj.icon}</span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className={cn("text-sm font-semibold leading-tight", isSelected ? "text-primary" : "text-foreground")}>
                      {obj.label}
                    </p>
                    {isDominant && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                        <Crown className="size-2.5" />
                        Dominant
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug">{obj.description}</p>
                  {isSelected && obj.visualStyles.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {obj.visualStyles.map((style) => (
                        <span key={style} className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium text-primary">
                          {style}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Textarea "Épatez-nous" — visible quand cette carte est sélectionnée */}
        {showCustomInput && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
            <p className="text-xs font-semibold text-primary">
              🎨 Décrivez l&apos;effet que vous souhaitez produire
            </p>
            <textarea
              value={objectifCognitifCustom ?? ""}
              onChange={(e) => setValue("objectifCognitifCustom", e.target.value, { shouldDirty: true })}
              placeholder="ex : Je veux que mes clients ressentent la sécurité d'un partenaire qui a tout prévu, combinée à l'excitation d'une technologie qui change la donne..."
              rows={3}
              className={cn(
                "flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors resize-y",
                "placeholder:text-muted-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent"
              )}
            />
            {errors.objectifCognitifCustom && (
              <p className="text-xs text-destructive">{errors.objectifCognitifCustom.message}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Étape 1 — Palette ──────────────────────────── */

function StepPalette({ form }: { form: ReturnType<typeof useForm<BrandDnaFormData>> }) {
  const { setValue, formState: { errors } } = form
  const colorPrimary = useWatch({ control: form.control, name: "colorPrimary", defaultValue: "" })
  const colorSecondary = useWatch({ control: form.control, name: "colorSecondary", defaultValue: "" })
  const colorAccent = useWatch({ control: form.control, name: "colorAccent", defaultValue: "" })
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
      {/* Culture cible */}
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
          placeholder="ex : Directeurs et directrices d'agences digitales au Maroc et en Afrique francophone, 30-50 ans, gérant 10 à 50 marques clientes. Ils cherchent à produire plus de contenu premium sans recruter."
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

/* ─── Étape 4 — Connexions (Feature 1) ───────────── */

function StepConnexions() {
  // Suivi local optimiste : plateformes dont le flow OAuth a été ouvert
  const [initiated, setInitiated] = useState<Set<string>>(new Set())

  function handleConnect(platformId: string) {
    setInitiated((prev) => new Set([...prev, platformId]))
    window.open(`/api/oauth/${platformId}/authorize`, "_blank", "noopener,noreferrer")
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-3.5 dark:border-blue-900/50 dark:bg-blue-950/30">
        <p className="text-xs font-semibold text-blue-800 dark:text-blue-300">
          🔗 Connectez vos comptes sociaux
        </p>
        <p className="mt-1 text-xs text-blue-700/90 dark:text-blue-400/90 leading-relaxed">
          Publiez directement depuis RAMI en 1 clic. Cette étape est optionnelle — vous pouvez
          connecter vos comptes maintenant ou plus tard depuis{" "}
          <span className="font-semibold">Paramètres → Connexions</span>.
        </p>
      </div>

      <div className="space-y-2.5">
        {ONBOARDING_PLATFORMS.map((platform) => {
          const wasInitiated = initiated.has(platform.id)
          return (
            <div
              key={platform.id}
              className={cn(
                "flex items-center gap-4 rounded-xl border bg-card p-4 transition-all",
                wasInitiated
                  ? "border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20"
                  : "border-border hover:border-primary/20 hover:shadow-sm"
              )}
            >
              {/* Icône plateforme */}
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-xl border",
                  platform.bgColor,
                  platform.borderColor
                )}
              >
                <platform.Icon className={cn("size-5", platform.color)} />
              </div>

              {/* Infos */}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{platform.label}</p>
                <p className="text-xs text-muted-foreground">{platform.description}</p>
              </div>

              {/* Bouton */}
              {wasInitiated ? (
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-3.5" />
                  En cours…
                </span>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-1.5"
                  onClick={() => handleConnect(platform.id)}
                >
                  <ExternalLink className="size-3.5" />
                  Connecter
                </Button>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/30 px-4 py-3">
        <span className="text-base" aria-hidden="true">🔒</span>
        <p className="text-xs text-muted-foreground">
          Vos tokens OAuth sont chiffrés AES-256-GCM avant stockage et ne sont jamais partagés
          avec des tiers. Déconnectez un compte à tout moment depuis{" "}
          <span className="font-medium">Paramètres → Connexions</span>.
        </p>
      </div>
    </div>
  )
}

/* ─── Récap finale ───────────────────────────────── */

function StepRecap({ data }: { data: BrandDnaFormData }) {
  // v1.1 : premier objectif = dominant ; fallback v1.0
  const dominantId = data.objectifsCognitifs?.[0] ?? data.objectifCognitif
  const dominantObjective = COGNITIVE_OBJECTIVES.find((o) => o.id === dominantId)
  const extraObjectives = (data.objectifsCognitifs ?? []).slice(1)

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
            <div className="min-w-0">
              <p className="font-semibold text-foreground">{data.brandName}</p>
              {data.tagline && (
                <p className="text-xs text-muted-foreground italic">&ldquo;{data.tagline}&rdquo;</p>
              )}
              <p className="mt-0.5 text-xs text-muted-foreground">
                {data.sector === "Autre" && data.sectorCustom
                  ? data.sectorCustom
                  : data.sector}
              </p>
              {dominantObjective && (
                <span className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <span aria-hidden="true">{dominantObjective.icon}</span>
                  <span>{dominantObjective.shortName}</span>
                  {extraObjectives.length > 0 && (
                    <span className="opacity-60">+{extraObjectives.length}</span>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Palette Causse */}
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

        {/* Ton de voix */}
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
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  // En mode édition, toutes les étapes précédentes sont considérées complètes
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(
    initialData ? new Set([0, 1, 2, 3]) : new Set()
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
      sectorCustom: "",
      positioning: "",
      logoDataUrl: "",
      logoFileName: "",
      colorPrimary: "",
      colorSecondary: "",
      colorAccent: "",
      voiceTone: "",
      objectifsCognitifs: [],
      objectifCognitif: "",
      objectifCognitifCustom: "",
      primaryCulture: "",
      audienceDescription: "",
      audienceAge: "",
      audienceLocation: "",
      audiencePainPoints: "",
    },
  })

  // Champs par étape pour la validation partielle
  const STEP_FIELDS: (keyof BrandDnaFormData)[][] = [
    ["brandName", "sector", "sectorCustom", "positioning"],
    ["colorPrimary", "colorSecondary", "colorAccent"],
    ["voiceTone"],
    ["audienceDescription"],
    [], // connexions : pas de champ requis
  ]

  const validateCurrentStep = useCallback(async () => {
    const fields = STEP_FIELDS[currentStep]
    if (fields.length === 0) return true
    const result = await form.trigger(fields)
    return result
  }, [currentStep, form]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleNext = useCallback(async () => {
    const valid = await validateCurrentStep()
    if (!valid) return

    // Validation manuelle : sectorCustom obligatoire si secteur = "Autre"
    if (currentStep === 0) {
      const sectorVal = form.getValues("sector")
      if (sectorVal === "Autre") {
        const customVal = form.getValues("sectorCustom")
        if (!customVal || customVal.trim().length === 0) {
          form.setError("sectorCustom", {
            type: "manual",
            message: "Précisez votre secteur d'activité",
          })
          return
        }
      }
    }

    setCompletedSteps((prev) => new Set([...prev, currentStep]))
    setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1))
  }, [currentStep, validateCurrentStep, form])

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
        router.refresh()
      }
    })
  })

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
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <Button
            onClick={() => router.push("/dashboard")}
            size="lg"
          >
            Voir le tableau de bord
          </Button>
          <Button
            onClick={() => {
              setIsSubmitted(false)
              setCurrentStep(0)
              setCompletedSteps(new Set([0, 1, 2, 3]))
            }}
            variant="outline"
            size="lg"
          >
            Modifier le Brand DNA
          </Button>
        </div>
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
        {currentStep === 4 && <StepConnexions />}
      </div>

      {/* Score DNA en temps réel à la dernière étape */}
      {isLastStep && (
        <div className="mt-4">
          <DnaScoreBadge data={watchedValues} />
        </div>
      )}

      {/* Récap si dernière étape et étapes précédentes complètes */}
      {isLastStep && completedSteps.size >= 4 && (
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
                Continuer &amp; Sauvegarder
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
