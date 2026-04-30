"use client"

import React, { useCallback, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Dna,
  Lightbulb,
  Loader2,
  Palette,
  Sparkles,
  Target,
  Upload,
  User,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useExpertMode } from "@/lib/hooks/use-expert-mode"
import { ExpertModeToggle } from "@/components/ui/expert-mode-toggle"
import { saveBrandDnaAction } from "@/lib/actions/brand-dna.actions"
import { DnaScoreBadge, ColorPaletteSummary, VoiceToneBadge } from "./dna-score-badge"
import {
  brandDnaFormSchema,
  type BrandDnaFormData,
  SECTORS,
  CULTURES,
  COGNITIVE_OBJECTIVES,
  CAUSSE_COLORS,
  type CultureId,
  type Typography,
} from "@/lib/schemas/brand-dna.schema"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { LogoUploader } from "./logo-uploader"
import { ColorPalettePicker } from "./color-palette-picker"
import { VoiceTonePicker } from "./voice-tone-picker"
import { TypographyPicker } from "./typography-picker"
import { AiAssistButton } from "./ai-assist-button"
import { PrefillSectionButton } from "./prefill-section-button"

/* ─── Étapes (i18n) ──────────────────────────────── */

const TOTAL_STEPS = 4

function getSteps(t: (key: string) => string) {
  return [
    { id: 0, label: t("stepIdentity"), icon: Dna },
    { id: 1, label: t("stepPalette"), icon: Palette },
    { id: 2, label: t("stepVoice"), icon: User },
    { id: 3, label: t("stepAudience"), icon: Target },
  ]
}

function getStepTitles(t: (key: string) => string) {
  return [
    { title: t("stepIdentityTitle"), subtitle: t("stepIdentitySubtitle") },
    { title: t("stepPaletteTitle"), subtitle: t("stepPaletteSubtitle") },
    { title: t("stepVoiceTitle"), subtitle: t("stepVoiceSubtitle") },
    { title: t("stepAudienceTitle"), subtitle: t("stepAudienceSubtitle") },
  ]
}

function getStepTips(t: (key: string) => string) {
  return [
    t("tipIdentity"),
    t("tipPalette"),
    t("tipVoice"),
    t("tipAudience"),
  ]
}

/* ─── Stepper compact ────────────────────────────── */

function CompactStepper({ currentStep, completedSteps }: { currentStep: number; completedSteps: Set<number> }) {
  const tForm = useTranslations("brandDna.form")
  const steps = getSteps(tForm)
  const stepTitles = getStepTitles(tForm)
  const progressPct = ((currentStep + 1) / TOTAL_STEPS) * 100

  return (
    <div className="space-y-3">
      {/* Stepper dots + step info on one line */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1">
          {steps.map((step, idx) => {
            const isCompleted = completedSteps.has(idx)
            const isCurrent = idx === currentStep
            const StepIcon = step.icon
            return (
              <div key={step.id} className="flex items-center">
                <div
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                    isCurrent
                      ? "bg-primary/10 text-primary font-semibold"
                      : isCompleted
                        ? "text-foreground/60"
                        : "text-muted-foreground/40"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="size-3.5 text-green-500" />
                  ) : (
                    <StepIcon className={cn("size-3.5", isCurrent ? "text-primary" : "text-muted-foreground/30")} />
                  )}
                  <span className="hidden sm:inline">{step.label}</span>
                </div>
                {idx < TOTAL_STEPS - 1 && (
                  <div className={cn(
                    "w-4 h-px mx-0.5",
                    isCompleted ? "bg-green-500/50" : "bg-border"
                  )} />
                )}
              </div>
            )
          })}
        </div>
        <span className="text-xs font-semibold text-primary tabular-nums shrink-0">
          {currentStep + 1}/{TOTAL_STEPS} ({Math.round(progressPct)}%)
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-muted dark:bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-blue-600 rounded-full transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Title + subtitle compact */}
      <div>
        <h2 className="text-lg font-bold text-foreground">
          {stepTitles[currentStep].title}
        </h2>
        <p className="text-muted-foreground text-sm mt-0.5">
          {stepTitles[currentStep].subtitle}
        </p>
      </div>
    </div>
  )
}

/* ─── AI Tip inline (collapsible) ────────────────── */

function AiTipBanner({ step }: { step: number }) {
  const tForm = useTranslations("brandDna.form")
  const stepTips = getStepTips(tForm)
  const [open, setOpen] = useState(false)

  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className="w-full text-left rounded-lg border border-primary/20 bg-primary/5 dark:bg-primary/5 px-3.5 py-2 transition-all hover:bg-primary/10"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Lightbulb className="size-3.5 text-primary shrink-0" />
          <span className="text-xs font-semibold text-primary">{tForm("aiTip")}</span>
        </div>
        {open ? <ChevronUp className="size-3 text-primary/60" /> : <ChevronDown className="size-3 text-primary/60" />}
      </div>
      {open && (
        <p className="mt-2 text-xs text-foreground/70 leading-relaxed">
          {stepTips[step]}
        </p>
      )}
    </button>
  )
}

/* ─── Badge "Optionnel" (i18n) ─────────────────── */

function OptionalBadge() {
  const tCommon = useTranslations("common")
  return (
    <span className="text-[9px] uppercase tracking-wider font-bold bg-muted dark:bg-white/10 text-muted-foreground dark:text-white/40 px-1.5 py-0.5 rounded">
      {tCommon("optional")}
    </span>
  )
}

/* ─── Champ formulaire compact ───────────────────── */

function FormField({
  label,
  error,
  required,
  children,
  hint,
  optional,
}: {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
  hint?: string
  optional?: boolean
}) {
  const fieldId = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={fieldId} className="text-xs font-medium text-foreground/60 dark:text-white/60">
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </Label>
        {optional && (
          <OptionalBadge />
        )}
      </div>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      {React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<{ id?: string }>, { id: fieldId })
        : children}
      {error && <TranslatedError msg={error} />}
    </div>
  )
}

/** Resolves validation.* i18n keys for inline field errors */
function TranslatedError({ msg }: { msg: string }) {
  const t = useTranslations()
  const isKey = msg.startsWith("validation.")
  return <p className="text-xs text-destructive">{isKey ? t(msg) : msg}</p>
}

/* ─── Étape 0 — Identité (layout compact) ────────── */

function StepIdentite({ form }: { form: ReturnType<typeof useForm<BrandDnaFormData>> }) {
  const t = useTranslations("brandDna")
  const tForm = useTranslations("brandDna.form")
  const tSectors = useTranslations("brandDna.sectors")
  const tObjectives = useTranslations("brandDna.cognitiveObjectives")
  const { register, formState: { errors }, setValue, getValues } = form
  const objectifCognitif = useWatch({ control: form.control, name: "objectifCognitif", defaultValue: "" })
  const logoDataUrl = useWatch({ control: form.control, name: "logoDataUrl", defaultValue: "" })
  const logoFileName = useWatch({ control: form.control, name: "logoFileName", defaultValue: "" })
  const taglineValue = useWatch({ control: form.control, name: "tagline", defaultValue: "" })
  const positioningValue = useWatch({ control: form.control, name: "positioning", defaultValue: "" })
  const brandName = useWatch({ control: form.control, name: "brandName", defaultValue: "" })
  const sector = useWatch({ control: form.control, name: "sector", defaultValue: "" })

  const typographyValue = useWatch({ control: form.control, name: "typography" }) as Typography | undefined

  const aiContext = { brandName, sector, objectifCognitif }

  return (
    <div className="space-y-4">
      <PrefillSectionButton section="identite" context={aiContext} setValue={setValue} getValues={getValues} />

      {/* Row 1: Logo + (Brand name / Tagline) as a group */}
      <div className="flex gap-4 items-start">
        <div className="shrink-0 w-[100px]">
          <p className="text-xs font-medium text-foreground/60 mb-1.5">Logo</p>
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
            compact
          />
        </div>
        <div className="flex-1 space-y-3">
          <FormField label={tForm("brandNameLabel")} required error={errors.brandName?.message}>
            <Input
              {...register("brandName")}
              placeholder={tForm("brandNamePlaceholder")}
              aria-invalid={!!errors.brandName}
            />
          </FormField>
          <FormField label={tForm("taglineWithSlogan")} error={errors.tagline?.message} optional>
            <div className="flex items-center gap-2">
              <Input {...register("tagline")} placeholder={tForm("taglinePlaceholder")} aria-invalid={!!errors.tagline} className="flex-1" />
              <AiAssistButton
                value={taglineValue ?? ""}
                field="tagline"
                context={aiContext}
                onApply={(text) => setValue("tagline", text, { shouldDirty: true, shouldValidate: true })}
              />
            </div>
          </FormField>
        </div>
      </div>

      {/* Row 2: Sector (1/3) + Positioning (2/3) */}
      <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
        <FormField label={tForm("sectorLabel")} required error={errors.sector?.message}>
          <select
            {...register("sector")}
            aria-invalid={!!errors.sector}
            className={cn(
              "flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground shadow-sm transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent",
              errors.sector && "border-destructive ring-2 ring-destructive/20"
            )}
          >
            <option value="">{tForm("sectorPlaceholder")}</option>
            {SECTORS.map((s) => (
              <option key={s} value={s}>{tSectors(s)}</option>
            ))}
          </select>
        </FormField>

        <FormField
          label={t("positioning")}
          required
          error={errors.positioning?.message}
          hint={tForm("positioningUspHint")}
        >
          <div className="flex gap-2 items-start">
            <textarea
              {...register("positioning")}
              placeholder={tForm("positioningPlaceholderShort")}
              rows={3}
              aria-invalid={!!errors.positioning}
              className={cn(
                "flex-1 min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors resize-y",
                "placeholder:text-muted-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent",
                errors.positioning && "border-destructive ring-2 ring-destructive/20"
              )}
            />
            <AiAssistButton
              value={positioningValue ?? ""}
              field="positioning"
              context={aiContext}
              onApply={(text) => setValue("positioning", text, { shouldDirty: true, shouldValidate: true })}
            />
          </div>
        </FormField>
      </div>

      {/* Row 3: Objectifs cognitifs — choix multiple, grid 3 cols */}
      <div className="space-y-2">
        <div>
          <p className="text-xs font-semibold text-foreground">{tForm("cognitiveObjectiveLabel")}</p>
          <p className="text-[11px] text-muted-foreground">
            {tForm("cognitiveObjectivesMultiHint")}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {COGNITIVE_OBJECTIVES.map((obj) => {
            const selectedIds: string[] = (() => {
              const multi = form.getValues("objectifsCognitifs")
              if (Array.isArray(multi) && multi.length > 0) return multi
              const single = objectifCognitif
              return single ? [single] : []
            })()
            const isSelected = selectedIds.includes(obj.id)
            return (
              <button
                key={obj.id}
                type="button"
                role="checkbox"
                aria-checked={isSelected}
                onClick={() => {
                  const current = (() => {
                    const multi = form.getValues("objectifsCognitifs")
                    if (Array.isArray(multi) && multi.length > 0) return multi
                    const single = form.getValues("objectifCognitif")
                    return single ? [single] : []
                  })()
                  const next = isSelected
                    ? current.filter((id: string) => id !== obj.id)
                    : [...current, obj.id]
                  setValue("objectifsCognitifs", next, { shouldDirty: true })
                  setValue("objectifCognitif", next[0] ?? "", { shouldDirty: true })
                }}
                className={cn(
                  "flex items-start gap-2 rounded-lg border-2 p-2.5 text-left transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40 hover:bg-muted/50"
                )}
              >
                <span className="text-lg" aria-hidden="true">{obj.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-xs font-medium leading-tight", isSelected ? "text-primary" : "text-foreground")}>
                    {tObjectives(`${obj.id}.label`)}
                  </p>
                  {isSelected && (
                    <div className="mt-1 flex flex-wrap gap-0.5">
                      {obj.visualStyles.slice(0, 2).map((style) => (
                        <span key={style} className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[8px] font-medium text-primary">
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
      </div>

      {/* Row 4: Typographie — hiérarchie visuelle */}
      <TypographyPicker
        value={typographyValue ?? {
          heading: { family: "Inter", size: 32, weight: "bold" },
          subheading: { family: "Inter", size: 20, weight: "semibold" },
          body: { family: "Inter", size: 16, weight: "normal" },
        }}
        onChange={(typo) => setValue("typography", typo, { shouldDirty: true })}
      />
    </div>
  )
}

/* ─── Étape 1 — Palette ──────────────────────────── */

function StepPalette({ form }: { form: ReturnType<typeof useForm<BrandDnaFormData>> }) {
  const tForm = useTranslations("brandDna.form")
  const { setValue, formState: { errors } } = form
  const colorPrimary = useWatch({ control: form.control, name: "colorPrimary", defaultValue: "" })
  const colorSecondary = useWatch({ control: form.control, name: "colorSecondary", defaultValue: "" })
  const colorAccent = useWatch({ control: form.control, name: "colorAccent", defaultValue: "" })
  const sector = useWatch({ control: form.control, name: "sector", defaultValue: "" })
  const primaryCulture = useWatch({ control: form.control, name: "primaryCulture", defaultValue: "" })

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/30">
        <p className="text-xs text-amber-700/90 dark:text-amber-400/90 leading-relaxed">
          🎨 <strong>{tForm("causseBannerTitle")}</strong> — {tForm("causseBannerDesc")}
          {sector && tForm("causseBannerSectorNote")}
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
  const tForm = useTranslations("brandDna.form")
  const { setValue, getValues, formState: { errors } } = form
  const voiceTone = useWatch({ control: form.control, name: "voiceTone", defaultValue: "" })
  const brandName = useWatch({ control: form.control, name: "brandName", defaultValue: "" })
  const sector = useWatch({ control: form.control, name: "sector", defaultValue: "" })
  const objectifCognitif = useWatch({ control: form.control, name: "objectifCognitif", defaultValue: "" })

  return (
    <div className="space-y-3">
      <PrefillSectionButton
        section="style"
        context={{ brandName, sector, objectifCognitif, voiceTone }}
        setValue={setValue}
        getValues={getValues}
      />
      <p className="text-xs text-muted-foreground">
        {tForm("voiceToneDesc")}
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
  const tForm = useTranslations("brandDna.form")
  const tCultures = useTranslations("brandDna.cultures")
  const { register, setValue, getValues, formState: { errors } } = form
  const primaryCulture = useWatch({ control: form.control, name: "primaryCulture", defaultValue: "" })
  const brandName = useWatch({ control: form.control, name: "brandName", defaultValue: "" })
  const sector = useWatch({ control: form.control, name: "sector", defaultValue: "" })
  const tagline = useWatch({ control: form.control, name: "tagline", defaultValue: "" })
  const positioning = useWatch({ control: form.control, name: "positioning", defaultValue: "" })
  const objectifCognitif = useWatch({ control: form.control, name: "objectifCognitif", defaultValue: "" })
  const audienceDescValue = useWatch({ control: form.control, name: "audienceDescription", defaultValue: "" })
  const painPointsValue = useWatch({ control: form.control, name: "audiencePainPoints", defaultValue: "" })
  const aiContext = { brandName, sector, objectifCognitif }

  return (
    <div className="space-y-4">
      <PrefillSectionButton
        section="audience"
        context={{ brandName, sector, objectifCognitif, tagline, positioning, primaryCulture }}
        setValue={setValue}
        getValues={getValues}
      />

      {/* Culture — compact 3-col grid */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-foreground">{tForm("targetCulture")}</p>
        <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
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
                  "flex items-center gap-1.5 rounded-lg border-2 px-2 py-2 text-left text-xs transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isSelected
                    ? "border-primary bg-primary/5 font-medium text-foreground"
                    : "border-border hover:border-primary/40 text-muted-foreground"
                )}
              >
                <span aria-hidden="true">{culture.flag}</span>
                <span className="text-[11px] truncate">{tCultures(culture.id)}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Audience description + side fields */}
      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <FormField
          label={tForm("audienceLabel")}
          required
          error={errors.audienceDescription?.message}
          hint={tForm("audienceHintShort")}
        >
          <div className="flex gap-2 items-start">
            <textarea
              {...register("audienceDescription")}
              placeholder={tForm("audiencePlaceholderShort")}
              rows={4}
              aria-invalid={!!errors.audienceDescription}
              className={cn(
                "flex-1 min-h-[100px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors resize-y",
                "placeholder:text-muted-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent",
                errors.audienceDescription && "border-destructive ring-2 ring-destructive/20"
              )}
            />
            <AiAssistButton
              value={audienceDescValue ?? ""}
              field="audienceDescription"
              context={aiContext}
              onApply={(text) => setValue("audienceDescription", text, { shouldDirty: true, shouldValidate: true })}
            />
          </div>
        </FormField>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 lg:w-[200px]">
          <FormField label={tForm("ageRange")} error={errors.audienceAge?.message} optional>
            <Input {...register("audienceAge")} placeholder={tForm("ageRangePlaceholder")} aria-invalid={!!errors.audienceAge} />
          </FormField>
          <FormField label={tForm("geoZone")} error={errors.audienceLocation?.message} optional>
            <Input {...register("audienceLocation")} placeholder={tForm("geoZonePlaceholder")} aria-invalid={!!errors.audienceLocation} />
          </FormField>
        </div>
      </div>

      <FormField
        label={tForm("painPointsLabel")}
        error={errors.audiencePainPoints?.message}
        hint={tForm("painPointsHint")}
        optional
      >
        <div className="flex gap-2 items-start">
          <textarea
            {...register("audiencePainPoints")}
            placeholder={tForm("painPointsPlaceholderShort")}
            rows={2}
            aria-invalid={!!errors.audiencePainPoints}
            className={cn(
              "flex-1 min-h-[60px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors resize-y",
              "placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent",
              errors.audiencePainPoints && "border-destructive ring-2 ring-destructive/20"
            )}
          />
          <AiAssistButton
            value={painPointsValue ?? ""}
            field="audiencePainPoints"
            context={aiContext}
            onApply={(text) => setValue("audiencePainPoints", text, { shouldDirty: true, shouldValidate: true })}
          />
        </div>
      </FormField>
    </div>
  )
}

/* ─── Récap finale (compact 2x2 grid) ───────────── */

function StepRecap({ data }: { data: BrandDnaFormData }) {
  const tForm = useTranslations("brandDna.form")
  const tCultures = useTranslations("brandDna.cultures")
  const tSectors = useTranslations("brandDna.sectors")
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-500/20 dark:bg-green-500/5">
        <CheckCircle2 className="size-4 shrink-0 text-green-600 dark:text-green-400" />
        <p className="text-xs font-semibold text-green-800 dark:text-green-300">
          {tForm("readyToSave")}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* Identité */}
        <div className="rounded-lg border border-border dark:border-white/5 bg-muted/20 dark:bg-white/[0.03] p-3">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{tForm("identityRecap")}</p>
          <div className="flex items-start gap-2">
            {data.logoDataUrl && (
              <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted/30 dark:bg-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={data.logoDataUrl} alt="Logo" className="size-full object-contain p-0.5" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{data.brandName}</p>
              {data.tagline && <p className="text-[11px] text-muted-foreground italic truncate">&ldquo;{data.tagline}&rdquo;</p>}
              <p className="text-[10px] text-muted-foreground">{data.sector ? tSectors(data.sector) : ""}</p>
            </div>
          </div>
        </div>

        {/* Palette */}
        <div className="rounded-lg border border-border dark:border-white/5 bg-muted/20 dark:bg-white/[0.03] p-3">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{tForm("paletteRecap")}</p>
          <ColorPaletteSummary primaryId={data.colorPrimary} secondaryId={data.colorSecondary} accentId={data.colorAccent} />
        </div>

        {/* Ton */}
        <div className="rounded-lg border border-border dark:border-white/5 bg-muted/20 dark:bg-white/[0.03] p-3">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{tForm("voiceToneRecap")}</p>
          {data.voiceTone && <VoiceToneBadge toneId={data.voiceTone} />}
        </div>

        {/* Audience */}
        <div className="rounded-lg border border-border dark:border-white/5 bg-muted/20 dark:bg-white/[0.03] p-3">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{tForm("audienceRecap")}</p>
          {data.primaryCulture && (() => {
            const cult = CULTURES.find((c) => c.id === (data.primaryCulture as CultureId))
            return cult ? (
              <span className="mb-1 inline-flex items-center gap-1 rounded-full border border-blue-200/60 bg-blue-50/60 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:border-blue-800/40 dark:bg-blue-950/30 dark:text-blue-300">
                {cult.flag} {tCultures(cult.id)}
              </span>
            ) : null
          })()}
          <p className="line-clamp-2 text-[11px] text-foreground/80">{data.audienceDescription}</p>
        </div>
      </div>
    </div>
  )
}

/* ─── Expert: Accordion Section ─────────────────── */

function ExpertAccordionSection({
  icon: Icon,
  label,
  children,
  defaultOpen = false,
}: {
  icon: typeof Dna
  label: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={cn(
      "rounded-xl border transition-all",
      open ? "border-primary/20 bg-card" : "border-border bg-card/50"
    )}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors rounded-xl"
      >
        <div className={cn(
          "flex size-8 items-center justify-center rounded-lg transition-colors",
          open ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
        )}>
          <Icon className="size-4" />
        </div>
        <span className={cn(
          "text-sm font-semibold flex-1",
          open ? "text-foreground" : "text-foreground/70"
        )}>
          {label}
        </span>
        <ChevronDown className={cn(
          "size-4 text-muted-foreground transition-transform",
          open && "rotate-180"
        )} />
      </button>
      {open && (
        <div className="px-4 pb-4 pt-0">
          {children}
        </div>
      )}
    </div>
  )
}

/* ─── Expert: Brand Guidelines Upload ───────────── */

/**
 * Trouve la couleur Causse la plus proche d'un HEX donné par distance RGB euclidienne.
 * Retourne l'id si la distance est inférieure à 150, sinon null.
 */
function findClosestCausseColor(hex: string): string | null {
  if (!hex || !hex.startsWith("#") || hex.length < 7) return null
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)

  let closest = { id: "", distance: Infinity }
  for (const color of CAUSSE_COLORS) {
    const cr = parseInt(color.hex.slice(1, 3), 16)
    const cg = parseInt(color.hex.slice(3, 5), 16)
    const cb = parseInt(color.hex.slice(5, 7), 16)
    const d = Math.sqrt((r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2)
    if (d < closest.distance) closest = { id: color.id, distance: d }
  }
  return closest.distance < 150 ? closest.id : null
}

interface ExtractedBrandData {
  colors?: string[]
  tagline?: string
  positioning?: string
  sector?: string
  toneIndicators?: string[]
  fontFamilies?: string[]
  brandName?: string
}

function ExpertBrandUpload({ form }: { form: ReturnType<typeof useForm<BrandDnaFormData>> }) {
  const tForm = useTranslations("brandDna.form")
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [extractionResult, setExtractionResult] = useState<ExtractedBrandData | null>(null)
  const [extractionError, setExtractionError] = useState<string | null>(null)
  const fileRef = React.useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    if (!file) return
    const validTypes = [
      "application/pdf",
      "image/png", "image/jpeg", "image/svg+xml", "image/webp",
    ]
    if (!validTypes.includes(file.type)) return
    if (file.size > 50 * 1024 * 1024) return

    setUploadedFile(file.name)
    setExtractionError(null)
    setExtractionResult(null)

    // Si c'est une image, l'utiliser aussi comme logo
    if (file.type.startsWith("image/")) {
      const logoReader = new FileReader()
      logoReader.onload = (e) => {
        const dataUrl = e.target?.result as string
        form.setValue("logoDataUrl", dataUrl, { shouldDirty: true })
        form.setValue("logoFileName", file.name, { shouldDirty: true })
      }
      logoReader.readAsDataURL(file)
    }

    // Lire le fichier en base64 pour l'envoi à l'API d'extraction
    const reader = new FileReader()
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string
      if (!dataUrl) return

      setIsAnalyzing(true)
      try {
        const response = await fetch("/api/brand-dna/extract-guidelines", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dataUrl, fileType: file.type }),
        })

        if (!response.ok) {
          const err = await response.json().catch(() => ({}))
          throw new Error((err as { error?: string }).error || tForm("guidelinesError"))
        }

        const data = await response.json() as { success: boolean; extracted: ExtractedBrandData }
        if (!data.success || !data.extracted) {
          throw new Error(tForm("guidelinesError"))
        }

        const extracted = data.extracted
        setExtractionResult(extracted)

        // Pré-remplir les champs du formulaire
        if (extracted.brandName) {
          form.setValue("brandName", extracted.brandName, { shouldDirty: true })
        }
        if (extracted.tagline) {
          form.setValue("tagline", extracted.tagline, { shouldDirty: true })
        }
        if (extracted.positioning) {
          form.setValue("positioning", extracted.positioning, { shouldDirty: true })
        }

        // Mapper les couleurs extraites vers les couleurs Causse
        if (extracted.colors && extracted.colors.length > 0) {
          const matchedPrimary = findClosestCausseColor(extracted.colors[0])
          if (matchedPrimary) {
            form.setValue("colorPrimary", matchedPrimary, { shouldDirty: true })
          }
          if (extracted.colors.length > 1) {
            const matchedSecondary = findClosestCausseColor(extracted.colors[1])
            if (matchedSecondary && matchedSecondary !== matchedPrimary) {
              form.setValue("colorSecondary", matchedSecondary, { shouldDirty: true })
            }
          }
          if (extracted.colors.length > 2) {
            const matchedAccent = findClosestCausseColor(extracted.colors[2])
            if (matchedAccent) {
              form.setValue("colorAccent", matchedAccent, { shouldDirty: true })
            }
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur inconnue"
        setExtractionError(message)
      } finally {
        setIsAnalyzing(false)
      }
    }
    reader.readAsDataURL(file)
  }, [form])

  return (
    <div className="space-y-2">
      <div
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          const file = e.dataTransfer.files?.[0]
          if (file) void handleFile(file)
        }}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        className={cn(
          "rounded-xl border-2 border-dashed p-3 transition-all",
          isDragging
            ? "border-primary bg-primary/5"
            : isAnalyzing
              ? "border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/10"
              : uploadedFile && !extractionError
                ? "border-green-500/30 bg-green-50/50 dark:bg-green-950/10"
                : extractionError
                  ? "border-destructive/30 bg-destructive/5"
                  : "border-border/50 bg-muted/20 hover:border-primary/30 hover:bg-muted/30"
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg",
            isAnalyzing
              ? "bg-blue-500/10 text-blue-600"
              : uploadedFile && !extractionError
                ? "bg-green-500/10 text-green-600"
                : extractionError
                  ? "bg-destructive/10 text-destructive"
                  : "bg-muted text-muted-foreground"
          )}>
            {isAnalyzing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : uploadedFile && !extractionError ? (
              <CheckCircle2 className="size-4" />
            ) : extractionError ? (
              <AlertCircle className="size-4" />
            ) : (
              <Upload className="size-4" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            {isAnalyzing ? (
              <p className="text-xs font-medium text-blue-600">
                {tForm("guidelinesAnalyzing")}
              </p>
            ) : uploadedFile ? (
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium text-foreground truncate">{uploadedFile}</p>
                <button
                  type="button"
                  onClick={() => {
                    setUploadedFile(null)
                    setExtractionResult(null)
                    setExtractionError(null)
                  }}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="size-3" />
                </button>
              </div>
            ) : (
              <>
                <p className="text-xs font-medium text-foreground">
                  {tForm("importGuidelines")}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {tForm("importGuidelinesDesc")}
                </p>
              </>
            )}
          </div>
          {!uploadedFile && !isAnalyzing && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="shrink-0 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              {tForm("browse")}
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,image/png,image/jpeg,image/svg+xml,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleFile(file)
          }}
        />
      </div>

      {/* Résultat de l'extraction */}
      {extractionResult && !isAnalyzing && (
        <div className="rounded-lg border border-green-500/20 bg-green-50/50 dark:bg-green-950/10 p-3 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-green-600" />
            <p className="text-xs font-semibold text-green-700 dark:text-green-400">
              {tForm("guidelinesExtracted")}
            </p>
          </div>
          <ul className="text-[11px] text-muted-foreground space-y-0.5 pl-5 list-disc">
            {extractionResult.brandName && (
              <li>{tForm("guidelinesFieldBrand")}{extractionResult.brandName}</li>
            )}
            {extractionResult.colors && extractionResult.colors.length > 0 && (
              <li>
                {tForm("guidelinesFieldColors")}
                {extractionResult.colors.map((c, i) => (
                  <span
                    key={i}
                    className="inline-block size-3 rounded-sm border border-border/50 ml-1 align-middle"
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </li>
            )}
            {extractionResult.tagline && (
              <li>{tForm("guidelinesFieldTagline")}{extractionResult.tagline}</li>
            )}
            {extractionResult.positioning && (
              <li>{tForm("guidelinesFieldPositioning")}{extractionResult.positioning}</li>
            )}
            {extractionResult.sector && (
              <li>{tForm("guidelinesFieldSector")}{extractionResult.sector}</li>
            )}
            {extractionResult.toneIndicators && extractionResult.toneIndicators.length > 0 && (
              <li>{tForm("guidelinesFieldTone")}{extractionResult.toneIndicators.join(", ")}</li>
            )}
            {extractionResult.fontFamilies && extractionResult.fontFamilies.length > 0 && (
              <li>{tForm("guidelinesFieldFonts")}{extractionResult.fontFamilies.join(", ")}</li>
            )}
          </ul>
        </div>
      )}

      {/* Erreur d'extraction */}
      {extractionError && !isAnalyzing && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="size-3.5 text-destructive" />
            <p className="text-xs text-destructive">
              {tForm("guidelinesError")}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Composant principal ────────────────────────── */

interface BrandDnaFormProps {
  initialData?: BrandDnaFormData | null
}

export function BrandDnaForm({ initialData }: BrandDnaFormProps) {
  const t = useTranslations("brandDna")
  const tForm = useTranslations("brandDna.form")
  const tCommon = useTranslations("common")
  const router = useRouter()
  const { isExpert } = useExpertMode()
  const [currentStep, setCurrentStep] = useState(0)
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
      objectifCognitif: "",
      objectifsCognitifs: [],
      typography: {
        heading: { family: "Inter", size: 32, weight: "bold" },
        subheading: { family: "Inter", size: 20, weight: "semibold" },
        body: { family: "Inter", size: 16, weight: "normal" },
      },
      primaryCulture: "",
      audienceDescription: "",
      audienceAge: "",
      audienceLocation: "",
      audiencePainPoints: "",
    },
  })

  const STEP_FIELDS: (keyof BrandDnaFormData)[][] = [
    ["brandName", "sector", "positioning"],
    ["colorPrimary", "colorSecondary", "colorAccent"],
    ["voiceTone"],
    ["audienceDescription"],
  ]

  const validateCurrentStep = useCallback(async () => {
    const fields = STEP_FIELDS[currentStep]
    return await form.trigger(fields)
  }, [currentStep, form]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleNext = useCallback(async () => {
    const valid = await validateCurrentStep()
    if (!valid) return
    setCompletedSteps((prev) => new Set([...prev, currentStep]))
    setCurrentStep((s) => Math.min(s + 1, TOTAL_STEPS - 1))
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
        router.refresh()
      }
    })
  })

  const watchedValues = useWatch({ control: form.control })
  const isLastStep = currentStep === TOTAL_STEPS - 1

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center gap-4 glass-card rounded-xl p-8 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-950">
          <CheckCircle2 className="size-7 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">{tForm("savedTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {tForm("calibrationDesc")}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => router.push("/dashboard/brand-dna")}
            className="rami-btn-gradient px-5 py-2.5 rounded-lg font-bold text-white shadow-lg shadow-primary/20 inline-flex items-center gap-2 text-sm"
          >
            <Sparkles className="size-3.5" />
            {tForm("viewBrandDna")}
          </button>
          <Button
            onClick={() => {
              setIsSubmitted(false)
              setCurrentStep(0)
              setCompletedSteps(new Set([0, 1, 2]))
            }}
            variant="outline"
            size="sm"
          >
            {tCommon("edit")}
          </Button>
        </div>
      </div>
    )
  }

  /* ── Mode Expert : accordéons accessibles + upload guidelines ── */
  if (isExpert) {
    return (
      <form onSubmit={handleSubmit} noValidate className="space-y-3">
        {/* Header + toggle + score inline */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-foreground">Brand DNA</h2>
            <DnaScoreBadge data={watchedValues as Partial<BrandDnaFormData>} />
          </div>
          <div className="flex items-center gap-2">
            <ExpertModeToggle />
            <button
              type="submit"
              disabled={isPending}
              className={cn(
                "rami-btn-gradient font-semibold py-2 px-5 rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center gap-2 text-sm",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isPending ? (
                <><Loader2 className="size-4 animate-spin" /> {tForm("saving")}</>
              ) : (
                <><CheckCircle2 className="size-4" /> {tForm("finalizeShort")}</>
              )}
            </button>
          </div>
        </div>

        {serverError && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-2.5">
            <AlertCircle className="size-4 shrink-0 text-destructive" />
            <p className="text-xs text-destructive">{serverError}</p>
          </div>
        )}

        {/* Upload brand guidelines — expert feature */}
        <ExpertBrandUpload form={form} />

        {/* Accordéons — tous accessibles librement */}
        <ExpertAccordionSection
          icon={Dna}
          label={tForm("stepIdentity")}
          defaultOpen
        >
          <StepIdentite form={form} />
        </ExpertAccordionSection>

        <ExpertAccordionSection
          icon={Palette}
          label={tForm("stepPalette")}
        >
          <StepPalette form={form} />
        </ExpertAccordionSection>

        <ExpertAccordionSection
          icon={User}
          label={tForm("stepVoice")}
        >
          <StepTonDeVoix form={form} />
        </ExpertAccordionSection>

        <ExpertAccordionSection
          icon={Target}
          label={tForm("stepAudience")}
        >
          <StepAudience form={form} />
        </ExpertAccordionSection>
      </form>
    )
  }

  /* ── Mode Guidé (wizard step-by-step) ── */
  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <CompactStepper currentStep={currentStep} completedSteps={completedSteps} />
        </div>
        <ExpertModeToggle className="mt-1" />
      </div>

      <AiTipBanner step={currentStep} />

      <div className="glass-card rounded-xl p-5 sm:p-6">
        {currentStep === 0 && <StepIdentite form={form} />}
        {currentStep === 1 && <StepPalette form={form} />}
        {currentStep === 2 && <StepTonDeVoix form={form} />}
        {currentStep === 3 && <StepAudience form={form} />}

        {isLastStep && (
          <div className="mt-4">
            <DnaScoreBadge data={watchedValues as Partial<BrandDnaFormData>} />
          </div>
        )}

        {isLastStep && completedSteps.size >= 3 && (
          <div className="mt-4">
            <StepRecap data={watchedValues as BrandDnaFormData} />
          </div>
        )}

        {serverError && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <AlertCircle className="size-4 shrink-0 text-destructive" />
            <p className="text-xs text-destructive">{serverError}</p>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-3 pt-4 border-t border-border dark:border-white/5">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 0 || isPending}
            className={cn(
              "text-muted-foreground text-sm font-medium hover:text-foreground transition-colors flex items-center gap-1",
              currentStep === 0 && "invisible"
            )}
          >
            <ArrowLeft className="size-3.5 rtl:rotate-180" />
            {tCommon("back")}
          </button>

          {isLastStep ? (
            <button
              type="submit"
              disabled={isPending}
              className={cn(
                "rami-btn-gradient font-bold py-2.5 px-6 rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center gap-2 text-sm",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isPending ? (
                <><Loader2 className="size-4 animate-spin" /> {tForm("saving")}</>
              ) : (
                <>{tForm("finalize")} <CheckCircle2 className="size-4" /></>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              disabled={isPending}
              className={cn(
                "rami-btn-gradient font-bold py-2.5 px-6 rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center gap-2 text-sm",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {tCommon("next")}
              <ArrowRight className="size-4 rtl:rotate-180" />
            </button>
          )}
        </div>
      </div>
    </form>
  )
}
