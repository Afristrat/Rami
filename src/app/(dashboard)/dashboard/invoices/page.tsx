import { getTranslations } from "next-intl/server"
import {
  Search,
  Plus,
  Calendar,
  MoreVertical,
  TrendingUp,
} from "lucide-react"
import { cn } from "@/lib/utils"

export async function generateMetadata() {
  const t = await getTranslations("metadata")
  return {
    title: t("invoices"),
    description: t("invoicesDescription"),
  }
}

/* ── Mock data ────────────────────────────────────────────────── */

type InvoiceStatus = "payee" | "envoyee" | "en_retard" | "brouillon"

interface MockInvoice {
  id: string
  number: string
  client: string
  clientAvatar: string
  amount: string
  date: string
  status: InvoiceStatus
}

const MOCK_INVOICES: MockInvoice[] = [
  { id: "1", number: "#INV-2023-001", client: "Acme Corp", clientAvatar: "AC", amount: "$12,450.00", date: "24 Oct 2023", status: "payee" },
  { id: "2", number: "#INV-2023-002", client: "Global Tech", clientAvatar: "GT", amount: "$8,200.00", date: "28 Oct 2023", status: "envoyee" },
  { id: "3", number: "#INV-2023-003", client: "Stellar Design", clientAvatar: "SD", amount: "$4,300.50", date: "15 Oct 2023", status: "en_retard" },
  { id: "4", number: "#INV-2023-004", client: "Lunar Agency", clientAvatar: "LA", amount: "$15,700.00", date: "02 Nov 2023", status: "brouillon" },
]

/* ── Page ──────────────────────────────────────────────────────── */

export default async function InvoicesPage() {
  const t = await getTranslations("invoices")

  const STATUS_CONFIG: Record<InvoiceStatus, { label: string; className: string }> = {
    payee: { label: t("statusPaid"), className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
    envoyee: { label: t("statusSent"), className: "bg-violet-500/20 text-violet-400 border-violet-500/30" },
    en_retard: { label: t("statusOverdue"), className: "bg-red-500/20 text-red-400 border-red-500/30" },
    brouillon: { label: t("statusDraft"), className: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
  }

  const FILTER_TABS = [
    t("filterAll"),
    t("filterDraft"),
    t("filterSent"),
    t("filterPaid"),
    t("filterOverdue"),
  ] as const

  const TABLE_HEADERS = [
    t("invoiceNumber"),
    t("client"),
    t("amount"),
    t("date"),
    t("status"),
    t("actions"),
  ]

  return (
    <div className="w-full px-4 sm:px-6 py-6 space-y-6">
      {/* Search + Filters + CTA */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            className={cn(
              "h-9 w-72 rounded-lg pl-9 pr-3 text-sm outline-none transition-colors",
              "bg-white border border-gray-200/60 text-foreground placeholder:text-muted-foreground",
              "dark:bg-white/[0.06] dark:border-white/[0.08] dark:text-white dark:placeholder:text-white/40",
              "focus-visible:ring-2 focus-visible:ring-violet-500/50"
            )}
          />
        </div>
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "inline-flex items-center gap-2 h-9 px-3 rounded-lg text-sm",
              "border border-gray-200/60 bg-white text-muted-foreground",
              "dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/50"
            )}
          >
            <Calendar className="size-4" />
            <span className="text-xs">Oct 2023 - Nov 2023</span>
          </div>
          <button
            className={cn(
              "inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold text-white",
              "bg-gradient-to-r from-violet-600 to-blue-600 hover:opacity-90 transition-opacity"
            )}
          >
            <Plus className="size-4" />
            {t("newInvoice")}
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 rounded-lg border border-gray-200/60 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] p-1 w-fit">
        {FILTER_TABS.map((tab, index) => (
          <button
            key={tab}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              index === 0
                ? "bg-violet-500/10 text-violet-400"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div
          className={cn(
            "rounded-2xl p-5",
            "bg-white border border-gray-200/60 shadow-sm",
            "dark:bg-white/[0.04] dark:backdrop-blur-xl dark:border-white/[0.08]"
          )}
        >
          <p className="text-xs text-muted-foreground mb-1">{t("totalThisMonth")}</p>
          <p className="text-3xl font-bold tracking-tight text-foreground dark:text-white">$124,500</p>
          <p className="text-xs mt-1 flex items-center gap-1 text-emerald-400">
            <TrendingUp className="size-3" />
            {t("vsLastMonth", { percent: "12.5" })}
          </p>
        </div>
        <div
          className={cn(
            "rounded-2xl p-5",
            "bg-white border border-gray-200/60 shadow-sm",
            "dark:bg-white/[0.04] dark:backdrop-blur-xl dark:border-white/[0.08]"
          )}
        >
          <p className="text-xs text-muted-foreground mb-1">{t("awaitingPayment")}</p>
          <p className="text-3xl font-bold tracking-tight text-foreground dark:text-white">$42,100</p>
          <p className="text-xs mt-1 text-muted-foreground">{t("unpaidInvoices", { count: 8 })}</p>
        </div>
        <div
          className={cn(
            "rounded-2xl p-5",
            "bg-white border border-gray-200/60 shadow-sm",
            "dark:bg-white/[0.04] dark:backdrop-blur-xl dark:border-white/[0.08]"
          )}
        >
          <p className="text-xs text-muted-foreground mb-1">{t("paidTotal")}</p>
          <p className="text-3xl font-bold tracking-tight text-foreground dark:text-white">$82,400</p>
          <p className="text-xs mt-1 text-muted-foreground">{t("settledInvoices", { count: 24 })}</p>
        </div>
      </div>

      {/* Invoice table */}
      <div
        className={cn(
          "rounded-2xl overflow-hidden",
          "bg-white border border-gray-200/60 shadow-sm",
          "dark:bg-white/[0.04] dark:backdrop-blur-xl dark:border-white/[0.08]"
        )}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200/60 dark:border-white/[0.06]">
                {TABLE_HEADERS.map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/60 dark:divide-white/[0.06]">
              {MOCK_INVOICES.map((inv) => {
                const statusCfg = STATUS_CONFIG[inv.status]
                return (
                  <tr
                    key={inv.id}
                    className="group transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-4 text-muted-foreground font-mono text-xs">{inv.number}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-blue-500/20 text-[10px] font-bold text-violet-400">
                          {inv.clientAvatar}
                        </div>
                        <span className="font-medium text-foreground dark:text-white">{inv.client}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-semibold text-foreground dark:text-white">{inv.amount}</td>
                    <td className="px-5 py-4 text-muted-foreground">{inv.date}</td>
                    <td className="px-5 py-4">
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium border uppercase tracking-wider",
                        statusCfg.className
                      )}>
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button className="p-1.5 rounded-md hover:bg-muted dark:hover:bg-white/[0.08] transition-colors text-muted-foreground">
                        <MoreVertical className="size-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-gray-200/60 dark:border-white/[0.06] px-5 py-3">
          <p className="text-xs text-muted-foreground">{t("showingInvoices", { from: 1, to: 4, total: 84 })}</p>
          <div className="flex items-center gap-2">
            <button
              className={cn(
                "inline-flex items-center gap-1 h-8 px-3 rounded-lg text-xs font-medium transition-colors",
                "border border-gray-200/60 bg-white text-muted-foreground hover:bg-gray-50",
                "dark:border-white/[0.08] dark:bg-white/[0.04] dark:hover:bg-white/[0.08]"
              )}
            >
              {t("previous")}
            </button>
            <button
              className={cn(
                "inline-flex items-center gap-1 h-8 px-3 rounded-lg text-xs font-medium transition-colors",
                "border border-gray-200/60 bg-white text-muted-foreground hover:bg-gray-50",
                "dark:border-white/[0.08] dark:bg-white/[0.04] dark:hover:bg-white/[0.08]"
              )}
            >
              {t("next")}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
