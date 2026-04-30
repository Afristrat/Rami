"use client"

import { useState, useCallback, useRef } from "react"
import { useTranslations } from "next-intl"
import { BookOpen, Heart, Shield, Save, Loader2, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  saveGuidelinesAction,
  type BrandGuidelines,
} from "@/lib/actions/brand-dna.actions"

interface Props {
  initialGuidelines: BrandGuidelines
}

export function BrandGuidelinesEditor({ initialGuidelines }: Props) {
  const t = useTranslations("brandDna.guidelines")
  const [guidelines, setGuidelines] = useState<BrandGuidelines>(initialGuidelines)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSave = useCallback(async (data: BrandGuidelines) => {
    setSaving(true)
    setSaved(false)
    try {
      const result = await saveGuidelinesAction(data)
      if ("success" in result) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } finally {
      setSaving(false)
    }
  }, [])

  const handleChange = useCallback(
    (field: keyof BrandGuidelines, value: string) => {
      const updated = { ...guidelines, [field]: value }
      setGuidelines(updated)

      // Auto-save debounced on change
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        handleSave(updated)
      }, 1500)
    },
    [guidelines, handleSave]
  )

  const handleBlur = useCallback(() => {
    // Sauvegarde immédiate au blur
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    handleSave(guidelines)
  }, [guidelines, handleSave])

  const sections = [
    {
      key: "brandStory" as const,
      icon: BookOpen,
      label: t("brandStory"),
      placeholder: t("brandStoryPlaceholder"),
      rows: 6,
    },
    {
      key: "coreValues" as const,
      icon: Heart,
      label: t("coreValues"),
      placeholder: t("coreValuesPlaceholder"),
      rows: 5,
    },
    {
      key: "usageRules" as const,
      icon: Shield,
      label: t("usageRules"),
      placeholder: t("usageRulesPlaceholder"),
      rows: 6,
    },
  ]

  return (
    <div className="space-y-6">
      {sections.map(({ key, icon: Icon, label, placeholder, rows }) => (
        <div key={key} className="glass-card rounded-xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="size-5 text-primary" />
            </div>
            <h3 className="text-sm font-bold text-foreground">{label}</h3>
          </div>
          <textarea
            value={guidelines[key]}
            onChange={(e) => handleChange(key, e.target.value)}
            onBlur={handleBlur}
            placeholder={placeholder}
            rows={rows}
            className={cn(
              "w-full rounded-lg border border-border dark:border-white/10 bg-background/50 dark:bg-white/5",
              "px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60",
              "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50",
              "resize-y transition-all"
            )}
          />
        </div>
      ))}

      {/* Save button + status */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => handleSave(guidelines)}
          disabled={saving}
          className={cn(
            "inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm transition-all",
            "bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed",
            "shadow-lg shadow-primary/20"
          )}
        >
          {saving ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {t("saving")}
            </>
          ) : (
            <>
              <Save className="size-4" />
              {t("save")}
            </>
          )}
        </button>

        {saved && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400">
            <Check className="size-3.5" />
            {t("saved")}
          </span>
        )}
      </div>
    </div>
  )
}
