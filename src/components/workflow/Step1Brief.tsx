"use client"

import { useState, useTransition } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { step1Schema, type Step1Data } from "@/lib/schemas/workflow.schema"
import { cn } from "@/lib/utils"
import { ArrowRight, Sparkles, ShieldCheck, AlertTriangle, TrendingUp, Settings, Users, Smile, Heart, Loader2, Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import { TranslatedFieldError } from "@/components/ui/field-error-i18n"
import { enrichBriefAction } from "@/lib/actions/workflow.actions"

interface Step1BriefProps {
  defaultValues?: Step1Data | null
  onNext: (data: Step1Data) => void
}

export function Step1Brief({ defaultValues, onNext }: Step1BriefProps) {
  const t = useTranslations("workflow.brief")
  const tc = useTranslations("common")

  const OBJECTIFS = [
    { value: "confiance", label: t("confiance"), icon: ShieldCheck, activeColor: "border-violet-500 bg-violet-500/5 shadow-[0_0_15px_rgba(124,58,237,0.15)]" },
    { value: "urgence", label: t("urgence"), icon: AlertTriangle, activeColor: "border-violet-500 bg-violet-500/5 shadow-[0_0_15px_rgba(124,58,237,0.15)]" },
    { value: "aspiration", label: t("aspiration"), icon: TrendingUp, activeColor: "border-violet-500 bg-violet-500/5 shadow-[0_0_15px_rgba(124,58,237,0.15)]" },
    { value: "expertise", label: t("expertise"), icon: Settings, activeColor: "border-violet-500 bg-violet-500/5 shadow-[0_0_15px_rgba(124,58,237,0.15)]" },
    { value: "communauté", label: t("communaute"), icon: Users, activeColor: "border-violet-500 bg-violet-500/5 shadow-[0_0_15px_rgba(124,58,237,0.15)]" },
    { value: "joie", label: t("joie"), icon: Smile, activeColor: "border-violet-500 bg-violet-500/5 shadow-[0_0_15px_rgba(124,58,237,0.15)]" },
    { value: "sérénité", label: t("serenite"), icon: Heart, activeColor: "border-violet-500 bg-violet-500/5 shadow-[0_0_15px_rgba(124,58,237,0.15)]" },
  ] as const

  const ANGLES = [
    t("caseStudy"),
    t("keyStat"),
    t("behindTheScenes"),
    t("userTestimonial"),
    t("industryNews"),
  ]

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: defaultValues ?? {
      titre: "",
      description: "",
      objectif: undefined,
      cible: "",
      angle: "",
    },
  })

  const selectedObjectif = useWatch({ control, name: "objectif" })
  const description = useWatch({ control, name: "description", defaultValue: "" })
  const selectedAngle = useWatch({ control, name: "angle", defaultValue: "" })

  const [isEnriching, startEnrich] = useTransition()
  const [enrichError, setEnrichError] = useState<string | null>(null)
  const [showCustomAngle, setShowCustomAngle] = useState(false)

  const handleEnrich = () => {
    setEnrichError(null)
    const { titre, description: desc, objectif, angle } = getValues()
    if ((desc ?? "").trim().length < 10) {
      setEnrichError(t("enrichNeedDescription"))
      return
    }
    startEnrich(async () => {
      const result = await enrichBriefAction({ titre: titre ?? "", description: desc ?? "", objectif, angle })
      if (result.success) {
        setValue("description", result.description, { shouldValidate: true })
      } else {
        setEnrichError(result.error)
      }
    })
  }

  // L'angle sélectionné peut être l'une des suggestions OU une saisie libre.
  const isSuggestionSelected = (angle: string) => selectedAngle === angle
  const isCustomAngle = Boolean(selectedAngle) && !ANGLES.includes(selectedAngle ?? "")

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-10">
      {/* Section A: Brief du contenu */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-violet-500 dark:text-violet-400">
            {t("sectionA")}
          </h3>
          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-600">BRIEF_ENGINE_V2</span>
        </div>

        {/* Titre */}
        <div className="mb-4">
          <input
            id="titre"
            {...register("titre")}
            placeholder={t("titlePlaceholder")}
            className={cn(
              "w-full bg-slate-100 dark:bg-white/[0.06] border-0 rounded-xl px-4 py-3 text-sm",
              "text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600",
              "focus:ring-2 focus:ring-violet-500/40 outline-none transition-all",
              errors.titre && "ring-2 ring-red-500/40"
            )}
          />
          {errors.titre && (
            <TranslatedFieldError message={errors.titre.message} className="mt-1.5 text-xs text-red-500" />
          )}
        </div>

        {/* Description textarea */}
        <div className="relative">
          <textarea
            id="description"
            {...register("description")}
            placeholder={t("descriptionPlaceholder")}
            rows={6}
            className={cn(
              "w-full bg-slate-100 dark:bg-white/[0.06] border-0 rounded-xl p-4 text-base resize-none",
              "text-slate-900 dark:text-slate-100 placeholder:text-slate-400/40 dark:placeholder:text-slate-500/40",
              "focus:ring-2 focus:ring-violet-500/40 outline-none transition-all",
              errors.description && "ring-2 ring-red-500/40"
            )}
          />
          <div className={cn(
            "absolute bottom-4 right-4 text-xs",
            description.length > 1800 ? "text-red-500" : "text-slate-400 dark:text-slate-600"
          )}>
            {description.length}/2000
          </div>
        </div>
        {errors.description && (
          <TranslatedFieldError message={errors.description.message} className="mt-1.5 text-xs text-red-500" />
        )}

        {/* Enrichir avec l'IA button */}
        <div className="mt-4 flex flex-col items-end gap-2">
          {enrichError && (
            <p className="text-xs text-red-500 dark:text-red-400">{enrichError}</p>
          )}
          <button
            type="button"
            onClick={handleEnrich}
            disabled={isEnriching}
            className={cn(
              "flex items-center gap-2 px-4 py-2",
              "bg-violet-500/20 hover:bg-violet-500/30 text-violet-500 dark:text-violet-400",
              "border border-violet-500/30 rounded-lg text-sm font-semibold transition-all",
              "disabled:opacity-60 disabled:cursor-not-allowed"
            )}
          >
            {isEnriching ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t("enriching")}
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                {t("enrichWithAI")}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Section B: Objectif cognitif */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-violet-500 dark:text-violet-400 mb-4">
          {t("sectionB")}
        </h3>
        {errors.objectif && (
          <TranslatedFieldError message={errors.objectif.message} className="mb-3 text-xs text-red-500" />
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {OBJECTIFS.map((obj) => {
            const Icon = obj.icon
            const isSelected = selectedObjectif === obj.value
            return (
              <button
                key={obj.value}
                type="button"
                onClick={() => setValue("objectif", obj.value as Step1Data["objectif"], { shouldValidate: true })}
                className={cn(
                  "relative flex flex-col items-center justify-center p-4 rounded-xl transition-all",
                  isSelected
                    ? cn("border-2", obj.activeColor)
                    : "border border-slate-200 dark:border-white/10 bg-white dark:bg-transparent hover:border-violet-500/50 cursor-pointer"
                )}
              >
                <Icon className={cn(
                  "size-6 mb-2",
                  isSelected ? "text-violet-500" : "text-slate-400 dark:text-slate-500"
                )} />
                <span className={cn(
                  "text-sm font-bold",
                  isSelected ? "text-slate-900 dark:text-slate-100" : "text-slate-600 dark:text-slate-400"
                )}>
                  {obj.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Section C: Angle editorial */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-violet-500 dark:text-violet-400 mb-4">
          {t("sectionC")}
        </h3>
        <div className="flex flex-wrap gap-3">
          {ANGLES.map((angle) => {
            const active = isSuggestionSelected(angle)
            return (
              <button
                key={angle}
                type="button"
                onClick={() => {
                  setShowCustomAngle(false)
                  // Toggle : recliquer l'angle actif le désélectionne.
                  setValue("angle", active ? "" : angle, { shouldValidate: true })
                }}
                aria-pressed={active}
                className={cn(
                  "px-4 py-2 rounded-full border text-sm font-medium transition-all",
                  active
                    ? "bg-violet-600 text-white border-violet-600"
                    : "border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.05] text-slate-700 dark:text-slate-300 hover:bg-violet-600 hover:text-white hover:border-violet-600"
                )}
              >
                {angle}
              </button>
            )
          })}
          <button
            type="button"
            onClick={() => setShowCustomAngle((v) => !v)}
            className={cn(
              "px-3 py-2 rounded-full border border-dashed text-sm flex items-center gap-1 transition-all",
              isCustomAngle || showCustomAngle
                ? "border-violet-500 text-violet-500 dark:text-violet-400"
                : "border-slate-300 dark:border-white/20 text-slate-400 dark:text-slate-500 hover:border-violet-500/60"
            )}
          >
            <Plus className="size-3.5" />
            {t("customAngle")}
          </button>
        </div>
        {(showCustomAngle || isCustomAngle) && (
          <input
            type="text"
            value={isCustomAngle ? selectedAngle ?? "" : (showCustomAngle ? selectedAngle ?? "" : "")}
            onChange={(e) => setValue("angle", e.target.value.slice(0, 120), { shouldValidate: true })}
            placeholder={t("customAnglePlaceholder")}
            maxLength={120}
            className={cn(
              "mt-3 w-full bg-slate-100 dark:bg-white/[0.06] border-0 rounded-xl px-4 py-2.5 text-sm",
              "text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600",
              "focus:ring-2 focus:ring-violet-500/40 outline-none transition-all"
            )}
          />
        )}
      </div>

      {/* Audience cible */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-violet-500 dark:text-violet-400 mb-4">
          {t("targetAudience")} <span className="text-slate-400 dark:text-slate-600 font-normal lowercase">({t("targetAudienceOptional")})</span>
        </h3>
        <input
          id="cible"
          {...register("cible")}
          placeholder={t("targetAudiencePlaceholder")}
          className={cn(
            "w-full bg-slate-100 dark:bg-white/[0.06] border-0 rounded-xl px-4 py-3 text-sm",
            "text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600",
            "focus:ring-2 focus:ring-violet-500/40 outline-none transition-all"
          )}
        />
      </div>

      {/* Bottom Actions */}
      <div className="flex items-center justify-end pt-6 border-t border-slate-200 dark:border-white/10">
        <button
          type="submit"
          className={cn(
            "px-8 py-2.5 rounded-xl",
            "bg-gradient-to-r from-violet-600 to-blue-600",
            "text-white text-sm font-bold",
            "shadow-lg shadow-violet-500/20",
            "hover:scale-[1.02] active:scale-[0.98] transition-all",
            "flex items-center gap-2"
          )}
        >
          {tc("next")}
          <ArrowRight className="size-4" />
        </button>
      </div>
    </form>
  )
}
