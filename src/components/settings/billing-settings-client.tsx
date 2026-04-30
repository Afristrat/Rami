"use client"

import {
  CreditCard,
  Download,
  Check,
  X,
  Shield,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"

// ─── Mock data (replace with real data from server actions) ──────────────────

const CURRENT_PLAN = "pro" as const

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    featureKeys: [
      { key: "freeTenant", included: true },
      { key: "freeGenerations", included: true },
      { key: "freeNoApi", included: false },
    ],
  },
  {
    id: "solo",
    name: "Solo",
    price: 49,
    featureKeys: [
      { key: "soloTenants", included: true },
      { key: "soloGenerations", included: true },
      { key: "soloNoWatermark", included: true },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 149,
    featureKeys: [
      { key: "proTenants", included: true },
      { key: "proGenerations", included: true },
      { key: "proApi", included: true },
    ],
  },
  {
    id: "agency",
    name: "Agency",
    price: 399,
    popular: true,
    featureKeys: [
      { key: "agencyTenants", included: true, bold: true },
      { key: "agencyGenerations", included: true },
      { key: "agencyWhiteLabel", included: true },
      { key: "agencyVip", included: true },
    ],
  },
  {
    id: "agency_plus",
    name: "Agency +",
    price: 899,
    featureKeys: [
      { key: "agencyPlusEnterprise", included: true },
      { key: "agencyPlusOnPremise", included: true },
      { key: "agencyPlusSla", included: true },
    ],
  },
]

// Feature text map — translations will be used
const FEATURE_TEXTS: Record<string, string> = {
  freeTenant: "1 Tenant",
  freeGenerations: "50 Générations",
  freeNoApi: "Pas d'API",
  soloTenants: "3 Tenants",
  soloGenerations: "150 Générations",
  soloNoWatermark: "No watermark",
  proTenants: "10 Tenants",
  proGenerations: "500 Générations",
  proApi: "Accès API complet",
  agencyTenants: "Tenants Illimités",
  agencyGenerations: "2500 Générations",
  agencyWhiteLabel: "Marque Blanche",
  agencyVip: "Support VIP 24/7",
  agencyPlusEnterprise: "Enterprise OS",
  agencyPlusOnPremise: "On-premise option",
  agencyPlusSla: "SLA Garantie",
}

const INVOICES = [
  { date: "11 Mars 2024", desc: "RAMI Pro Plan — Mensuel", amount: "$149.00", status: "paid" as const },
  { date: "11 Fév. 2024", desc: "RAMI Pro Plan — Mensuel", amount: "$149.00", status: "paid" as const },
  { date: "11 Janv. 2024", desc: "RAMI Pro Plan — Mensuel", amount: "$149.00", status: "pending" as const },
  { date: "11 Déc. 2023", desc: "RAMI Pro Plan — Mensuel", amount: "$149.00", status: "failed" as const },
]

// ─── Component ──────────────────────────────────────────────────────────────

export function BillingSettingsClient() {
  const t = useTranslations("billing")
  const tp = useTranslations("pricing")

  return (
    <div className="space-y-12">
      {/* ─── Current Plan Hero ────────────────────────────────────────── */}
      <section>
        <div className="relative p-[2px] rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 shadow-2xl shadow-violet-500/10">
          <div
            className={cn(
              "rounded-[calc(1rem+6px)] p-8",
              "bg-white dark:bg-[#0A0A0F]/95 dark:backdrop-blur-md"
            )}
          >
            <div className="flex flex-col lg:flex-row justify-between gap-8">
              <div className="space-y-4">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 text-[10px] font-bold tracking-widest uppercase">
                  {t("currentPlan")}
                </div>
                <h2 className="text-5xl font-black text-foreground dark:text-white">PRO</h2>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-foreground dark:text-white">
                    $149
                    <span className="text-lg text-muted-foreground dark:text-white/60 font-medium">
                      {t("perMonth")}
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground dark:text-white/40">
                    {t("billedMonthly", { date: "11 avril 2026" })}
                  </p>
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    className={cn(
                      "px-6 py-2.5 text-sm font-bold rounded-xl transition-transform",
                      "bg-gradient-to-r from-violet-600 to-blue-600 text-white",
                      "shadow-lg shadow-violet-500/20 hover:scale-105"
                    )}
                  >
                    {t("changePlan")}
                  </button>
                  <button className="px-6 py-2.5 text-red-500 text-sm font-semibold hover:underline decoration-red-500/30 underline-offset-4">
                    {t("cancelSubscription")}
                  </button>
                </div>
              </div>

              {/* Usage gauges */}
              <div
                className={cn(
                  "w-full lg:w-[400px] space-y-6 p-6 rounded-2xl border",
                  "bg-gray-50 border-gray-200",
                  "dark:bg-white/5 dark:border-white/5"
                )}
              >
                <UsageGauge label={t("generationsUsed")} current={320} max={500} gradient />
                <UsageGauge label={t("tenantsUsed")} current={7} max={10} gradient />
                <UsageGauge label={t("storageUsed")} current={12.4} max={50} suffix=" GB" green />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Pricing Grid ─────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-xl font-bold text-foreground dark:text-white">{t("allPlans")}</h2>
          <div className="h-px flex-1 bg-gray-200 dark:bg-white/5" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
          {PLANS.map((plan) => {
            const isCurrent = plan.id === CURRENT_PLAN
            const isPopular = plan.popular

            return (
              <div
                key={plan.id}
                className={cn(
                  "flex flex-col h-full rounded-2xl p-6 transition-colors",
                  isCurrent
                    ? "bg-violet-500/5 border-2 border-violet-500 dark:bg-violet-500/5 relative"
                    : isPopular
                      ? "bg-white dark:bg-white/[0.04] border border-gray-200/60 dark:border-white/10 relative shadow-2xl shadow-violet-500/5 transform lg:scale-105 z-10 ring-1 ring-gray-200 dark:ring-white/10"
                      : "bg-white dark:bg-white/[0.04] border border-gray-200/60 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10"
                )}
              >
                {/* Badge */}
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600 px-3 py-1 rounded-full text-[9px] font-black text-white uppercase tracking-widest">
                    {t("currentPlan")}
                  </div>
                )}
                {isPopular && !isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-1.5 rounded-full text-[10px] font-black text-white uppercase tracking-widest shadow-lg shadow-violet-500/20">
                    {tp("mostPopular")}
                  </div>
                )}

                <p
                  className={cn(
                    "text-xs font-bold uppercase tracking-widest mb-2",
                    isCurrent
                      ? "text-violet-600 dark:text-violet-400"
                      : "text-muted-foreground dark:text-slate-500",
                    isPopular && !isCurrent && "text-violet-600 dark:text-violet-400 mt-2"
                  )}
                >
                  {plan.name}
                </p>
                <p
                  className={cn(
                    "font-bold mb-6",
                    isPopular ? "text-3xl" : "text-2xl"
                  )}
                >
                  ${plan.price}
                  <span className="text-sm font-medium text-muted-foreground dark:text-slate-500">
                    {t("perMonth")}
                  </span>
                </p>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.featureKeys.map((feat) => (
                    <li
                      key={feat.key}
                      className={cn(
                        "text-xs flex items-center gap-2",
                        feat.included
                          ? ("bold" in feat && feat.bold)
                            ? "font-semibold text-foreground dark:text-white"
                            : ""
                          : "text-muted-foreground dark:text-slate-500"
                      )}
                    >
                      {feat.included ? (
                        <Check className="size-4 text-violet-500 shrink-0" />
                      ) : (
                        <X className="size-4 text-gray-300 dark:text-slate-700 shrink-0" />
                      )}
                      {FEATURE_TEXTS[feat.key]}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 text-xs font-bold text-muted-foreground cursor-not-allowed"
                  >
                    {t("current")}
                  </button>
                ) : isPopular ? (
                  <button
                    className={cn(
                      "w-full py-3 rounded-xl text-xs font-black text-white uppercase tracking-widest transition-all",
                      "bg-gradient-to-r from-violet-600 to-blue-600 hover:brightness-110"
                    )}
                  >
                    {t("switchToOffer")}
                  </button>
                ) : (
                  <button
                    className={cn(
                      "w-full py-2.5 rounded-xl text-xs font-bold transition-colors",
                      "border border-gray-200 text-muted-foreground hover:bg-gray-50",
                      "dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/5"
                    )}
                  >
                    {plan.price < 149 ? t("downgrade") : t("upgradeAction")}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* ─── Billing History + Payment ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Billing History */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-4 mb-2">
            <h2 className="text-xl font-bold text-foreground dark:text-white">
              {t("billingHistory")}
            </h2>
            <div className="h-px flex-1 bg-gray-200 dark:bg-white/5" />
          </div>

          <div
            className={cn(
              "rounded-2xl overflow-hidden",
              "bg-white border border-gray-200/60 shadow-sm",
              "dark:bg-white/[0.04] dark:border-white/5"
            )}
          >
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 dark:bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground dark:text-slate-500">
                    {t("date")}
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground dark:text-slate-500">
                    {t("description")}
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground dark:text-slate-500">
                    {t("amount")}
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground dark:text-slate-500">
                    {t("status")}
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground dark:text-slate-500">
                    {t("invoices")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                {INVOICES.map((inv, i) => (
                  <tr
                    key={i}
                    className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 text-xs font-medium">{inv.date}</td>
                    <td className="px-6 py-4 text-xs text-muted-foreground dark:text-slate-400">
                      {inv.desc}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold">{inv.amount}</td>
                    <td className="px-6 py-4">
                      <InvoiceStatus status={inv.status} />
                    </td>
                    <td className="px-6 py-4">
                      {inv.status !== "failed" ? (
                        <button className="text-[10px] font-black uppercase text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1">
                          PDF <Download className="size-3" />
                        </button>
                      ) : (
                        <span className="text-[10px] font-black uppercase text-gray-400 dark:text-slate-600">
                          {t("notAvailable")}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Method */}
        <div className="space-y-4">
          <div className="flex items-center gap-4 mb-2">
            <h2 className="text-xl font-bold text-foreground dark:text-white">{t("payment")}</h2>
            <div className="h-px flex-1 bg-gray-200 dark:bg-white/5" />
          </div>

          <div
            className={cn(
              "rounded-2xl p-6 space-y-6",
              "bg-white border border-gray-200/60 shadow-sm",
              "dark:bg-white/[0.04] dark:border-white/5"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "w-12 h-8 rounded flex items-center justify-center border",
                    "bg-gray-50 border-gray-200",
                    "dark:bg-slate-800 dark:border-white/10"
                  )}
                >
                  <CreditCard className="size-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-bold">Visa **** 4242</p>
                  <p className="text-[10px] text-muted-foreground dark:text-slate-500 uppercase font-bold tracking-widest">
                    {t("expires", { date: "12/26" })}
                  </p>
                </div>
              </div>
              <button className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline">
                {t("edit")}
              </button>
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-white/5">
              <p className="text-[10px] font-black text-muted-foreground dark:text-slate-500 uppercase tracking-widest mb-3">
                {t("billingAddress")}
              </p>
              <div className="text-xs text-muted-foreground dark:text-slate-400 leading-relaxed">
                <p className="font-bold text-foreground dark:text-white">Alex Rivier</p>
                <p>15 Avenue des Champs-Élysées</p>
                <p>75008 Paris, France</p>
              </div>
              <button className="inline-block mt-4 text-[10px] font-bold text-muted-foreground dark:text-slate-500 hover:text-foreground dark:hover:text-white transition-colors underline underline-offset-4 decoration-gray-200 dark:decoration-white/10">
                {t("accessClientPortal")}
              </button>
            </div>
          </div>

          {/* Security note */}
          <div
            className={cn(
              "rounded-2xl p-6 flex gap-4",
              "bg-violet-50 border border-violet-200/50",
              "dark:bg-violet-500/5 dark:border-violet-500/20"
            )}
          >
            <Shield className="size-5 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold mb-1">{t("securePayments")}</p>
              <p className="text-[10px] text-muted-foreground dark:text-slate-400 leading-normal">
                {t("securePaymentsDescription")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function UsageGauge({
  label,
  current,
  max,
  suffix = "",
  gradient: _gradient,
  green,
}: {
  label: string
  current: number
  max: number
  suffix?: string
  gradient?: boolean
  green?: boolean
}) {
  const percent = Math.round((current / max) * 100)

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
        <span className="text-muted-foreground dark:text-white/60">{label}</span>
        <span>
          {current}{suffix} / {max}{suffix}
        </span>
      </div>
      <div className="h-2 w-full rounded-full overflow-hidden bg-gray-200 dark:bg-white/5">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            green
              ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
              : "bg-gradient-to-r from-violet-600 to-blue-600 shadow-[0_0_12px_rgba(124,58,237,0.5)]"
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

function InvoiceStatus({ status }: { status: "paid" | "pending" | "failed" }) {
  const t = useTranslations("billing")

  const config = {
    paid: { label: t("paid"), color: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
    pending: { label: t("pending"), color: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
    failed: { label: t("failedStatus"), color: "text-red-600 dark:text-red-400", dot: "bg-red-500" },
  }
  const c = config[status]

  return (
    <div className={cn("flex items-center gap-1.5 text-[10px] font-bold", c.color)}>
      <span className={cn("size-1.5 rounded-full", c.dot)} />
      {c.label}
    </div>
  )
}
