import Link from "next/link"
import { getTranslations, getLocale } from "next-intl/server"
import { Presentation, Plus } from "lucide-react"
import { requireFeature } from "@/lib/billing/require-feature"
import { listPresentationsAction } from "@/lib/actions/presentation.actions"

export async function generateMetadata() {
  const t = await getTranslations("metadata")
  return {
    title: t("presentations"),
    description: t("presentationsDescription"),
  }
}

export default async function PresentationsListPage() {
  await requireFeature("document_engine")
  const t = await getTranslations("presentations")
  const locale = await getLocale()
  const { items } = await listPresentationsAction()

  // État vide honnête (aucune présentation générée).
  if (items.length === 0) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="flex size-20 items-center justify-center rounded-2xl border border-border bg-muted/50">
          <Presentation className="size-10 text-primary" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("title")}</h1>
          <p className="mt-2 max-w-sm text-muted-foreground">{t("subtitleFull")}</p>
        </div>
        <Link
          href="/presentations/new"
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-indigo-600 px-6 font-semibold text-white hover:opacity-90"
        >
          <Plus className="size-4" />
          {t("newPresentation")}
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Link
          href="/presentations/new"
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-indigo-600 px-5 font-semibold text-white hover:opacity-90"
        >
          <Plus className="size-4" />
          {t("newPresentation")}
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => (
          <Link
            key={p.id}
            href={`/presentations/${p.id}`}
            className="group rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-md"
          >
            <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <Presentation className="size-5 text-primary" />
            </div>
            <h3 className="line-clamp-2 font-semibold text-foreground group-hover:text-primary">{p.title}</h3>
            <p className="mt-2 text-xs text-muted-foreground">
              {t("slidesCount", { count: p.slideCount })} ·{" "}
              {new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(new Date(p.created_at))}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
