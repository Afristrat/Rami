"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { createLeadAction } from "@/lib/actions/leads.actions"
import {
  createLeadSchema,
  CURRENCIES,
  type LeadStage,
  type LeadData,
} from "@/lib/schemas/lead.schema"

// ── Types ──────────────────────────────────────────────────────────────────────

interface AddLeadDialogProps {
  open: boolean
  onClose: () => void
  onCreated: (lead: LeadData) => void
  defaultStage?: LeadStage
}

// ── Composant ──────────────────────────────────────────────────────────────────

export function AddLeadDialog({
  open,
  onClose,
  onCreated,
  defaultStage = "lead",
}: AddLeadDialogProps) {
  const t = useTranslations("leads")
  const tCommon = useTranslations("common")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    company_name: "",
    contact_name: "",
    email: "",
    phone: "",
    linkedin_url: "",
    sector: "",
    company_size: "",
    location: "",
    deal_value: "0",
    currency: "MAD" as (typeof CURRENCIES)[number],
    stage: defaultStage,
  })

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const input = {
      ...form,
      deal_value: parseInt(form.deal_value, 10) || 0,
    }

    const parsed = createLeadSchema.safeParse(input)
    if (!parsed.success) {
      setError(parsed.error.issues.map((i) => i.message).join(", "))
      return
    }

    startTransition(async () => {
      const result = await createLeadAction(input)
      if (result.success) {
        onCreated(result.data)
        setForm({
          company_name: "",
          contact_name: "",
          email: "",
          phone: "",
          linkedin_url: "",
          sector: "",
          company_size: "",
          location: "",
          deal_value: "0",
          currency: "MAD",
          stage: defaultStage,
        })
        onClose()
      } else {
        setError(result.error)
      }
    })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        className="relative z-10 w-full max-w-lg mx-4 glass-card rounded-2xl p-6 space-y-5 shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground dark:text-white">
            {t("addLead")}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Entreprise + Contact */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                {t("companyRequired")}
              </label>
              <input
                type="text"
                required
                value={form.company_name}
                onChange={(e) => updateField("company_name", e.target.value)}
                placeholder="TechMoove SAS"
                className={cn(
                  "h-9 w-full rounded-lg px-3 text-sm outline-none transition-colors",
                  "bg-background border border-border text-foreground placeholder:text-muted-foreground",
                  "focus-visible:ring-2 focus-visible:ring-violet-500/50"
                )}
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                {t("contactRequired")}
              </label>
              <input
                type="text"
                required
                value={form.contact_name}
                onChange={(e) => updateField("contact_name", e.target.value)}
                placeholder="Thomas Muller"
                className={cn(
                  "h-9 w-full rounded-lg px-3 text-sm outline-none transition-colors",
                  "bg-background border border-border text-foreground placeholder:text-muted-foreground",
                  "focus-visible:ring-2 focus-visible:ring-violet-500/50"
                )}
              />
            </div>
          </div>

          {/* Email + Téléphone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                {t("email")}
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="contact@techmoove.io"
                className={cn(
                  "h-9 w-full rounded-lg px-3 text-sm outline-none transition-colors",
                  "bg-background border border-border text-foreground placeholder:text-muted-foreground",
                  "focus-visible:ring-2 focus-visible:ring-violet-500/50"
                )}
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                {t("phone")}
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="+212 6 00 00 00 00"
                className={cn(
                  "h-9 w-full rounded-lg px-3 text-sm outline-none transition-colors",
                  "bg-background border border-border text-foreground placeholder:text-muted-foreground",
                  "focus-visible:ring-2 focus-visible:ring-violet-500/50"
                )}
              />
            </div>
          </div>

          {/* LinkedIn */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              LinkedIn
            </label>
            <input
              type="url"
              value={form.linkedin_url}
              onChange={(e) => updateField("linkedin_url", e.target.value)}
              placeholder="https://linkedin.com/company/techmoove"
              className={cn(
                "h-9 w-full rounded-lg px-3 text-sm outline-none transition-colors",
                "bg-background border border-border text-foreground placeholder:text-muted-foreground",
                "focus-visible:ring-2 focus-visible:ring-violet-500/50"
              )}
            />
          </div>

          {/* Secteur + Taille */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                {t("sector")}
              </label>
              <input
                type="text"
                value={form.sector}
                onChange={(e) => updateField("sector", e.target.value)}
                placeholder="Software / SaaS"
                className={cn(
                  "h-9 w-full rounded-lg px-3 text-sm outline-none transition-colors",
                  "bg-background border border-border text-foreground placeholder:text-muted-foreground",
                  "focus-visible:ring-2 focus-visible:ring-violet-500/50"
                )}
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                {t("sizeLabel")}
              </label>
              <input
                type="text"
                value={form.company_size}
                onChange={(e) => updateField("company_size", e.target.value)}
                placeholder="50-200 employés"
                className={cn(
                  "h-9 w-full rounded-lg px-3 text-sm outline-none transition-colors",
                  "bg-background border border-border text-foreground placeholder:text-muted-foreground",
                  "focus-visible:ring-2 focus-visible:ring-violet-500/50"
                )}
              />
            </div>
          </div>

          {/* Localisation */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              {t("location")}
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => updateField("location", e.target.value)}
              placeholder="Casablanca, Maroc"
              className={cn(
                "h-9 w-full rounded-lg px-3 text-sm outline-none transition-colors",
                "bg-background border border-border text-foreground placeholder:text-muted-foreground",
                "focus-visible:ring-2 focus-visible:ring-violet-500/50"
              )}
            />
          </div>

          {/* Valeur deal + Devise */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                {t("dealValue")}
              </label>
              <input
                type="number"
                min={0}
                value={form.deal_value}
                onChange={(e) => updateField("deal_value", e.target.value)}
                placeholder="12000"
                className={cn(
                  "h-9 w-full rounded-lg px-3 text-sm outline-none transition-colors",
                  "bg-background border border-border text-foreground placeholder:text-muted-foreground",
                  "focus-visible:ring-2 focus-visible:ring-violet-500/50"
                )}
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                {t("currency")}
              </label>
              <select
                value={form.currency}
                onChange={(e) => updateField("currency", e.target.value)}
                className={cn(
                  "h-9 w-full rounded-lg px-3 text-sm outline-none transition-colors appearance-none",
                  "bg-background border border-border text-foreground",
                  "focus-visible:ring-2 focus-visible:ring-violet-500/50"
                )}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Erreur */}
          {error && (
            <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={cn(
                "h-9 px-4 rounded-lg text-sm font-medium transition-colors",
                "glass-card text-foreground hover:bg-muted/50"
              )}
            >
              {tCommon("cancel")}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={cn(
                "h-9 px-5 rounded-lg text-sm font-semibold text-white transition-opacity",
                "bg-gradient-to-r from-violet-600 to-blue-600",
                isPending ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"
              )}
            >
              {isPending ? t("creating") : t("createLead")}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
