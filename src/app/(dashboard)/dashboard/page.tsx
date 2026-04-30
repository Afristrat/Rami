import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { users, tenants, posts } from "@/lib/db/schema"
import { eq, desc, count } from "drizzle-orm"
import { FileText, Palette, Plus } from "lucide-react"
import Link from "next/link"
import { getTranslations, getLocale } from "next-intl/server"
import { getIntlLocale } from "@/lib/utils/format-locale"
import { WelcomeToast } from "@/components/dashboard/WelcomeToast"
import { KpiCard } from "@/components/dashboard/KpiCard"
import { BrandDnaKpiCard } from "@/components/dashboard/BrandDnaKpiCard"
import { NextScheduledCard } from "@/components/dashboard/NextScheduledCard"
import { ActivityTable } from "@/components/dashboard/ActivityTable"
import type { ActivityRow } from "@/components/dashboard/ActivityTable"
import { PlatformDistribution } from "@/components/dashboard/platform-distribution"
import { CalendarStrip } from "@/components/dashboard/calendar-strip"
import { getDashboardStatsAction } from "@/lib/actions/dashboard.actions"

export async function generateMetadata() {
  const t = await getTranslations("metadata")
  return {
    title: t("dashboard"),
    description: t("dashboardDescription"),
  }
}

/* ── Helpers ── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TranslatorFn = (key: string, values?: Record<string, any>) => string

function formatRelativeDate(
  date: Date,
  t: TranslatorFn,
  locale: string
): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffH = Math.floor(diffMs / 3600000)
  const diffD = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return t("justNow")
  if (diffMin < 60) return t("minutesAgo", { count: diffMin })
  if (diffH < 24) return t("hoursAgo", { count: diffH })
  if (diffD < 2) return t("yesterday")
  if (diffD < 7) return t("daysAgo", { count: diffD })
  return date.toLocaleDateString(locale, { day: "numeric", month: "short" })
}

function formatScheduledDate(
  date: Date,
  tTime: TranslatorFn,
  locale: string
): string {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const isTomorrow =
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear()

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()

  const time = date.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  })

  if (isToday) return `${tTime("today")}, ${time}`
  if (isTomorrow) return `${tTime("tomorrow")}, ${time}`
  return `${date.toLocaleDateString(locale, { day: "numeric", month: "short" })}, ${time}`
}

/* ── Page ── */

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const t = await getTranslations("dashboard")
  const tTime = await getTranslations("time")
  const locale = await getLocale()
  const intlLocale = getIntlLocale(locale)

  const dbUser = await db.query.users
    .findFirst({ where: eq(users.id, user.id) })
    .catch(() => null)

  const tenant = dbUser?.tenant_id
    ? await db.query.tenants
        .findFirst({ where: eq(tenants.id, dbUser.tenant_id) })
        .catch(() => null)
    : null

  const tenantId = tenant?.id

  /* ── Fetch stats ── */
  const statsResult = await getDashboardStatsAction()
  const stats = statsResult.success ? statsResult.data : null

  const publishedCount = stats?.postsThisMonth ?? 0
  const generatedCount = stats?.visualsGenerated ?? 0
  const brandDnaScore = stats?.brandDnaScore ?? null

  /* ── Recent activity (5 derniers posts) ── */
  let activityRows: ActivityRow[] = []
  if (tenantId) {
    try {
      const recentPosts = await db
        .select()
        .from(posts)
        .where(eq(posts.tenant_id, tenantId))
        .orderBy(desc(posts.updated_at))
        .limit(5)

      activityRows = recentPosts.map((p) => ({
        id: p.id,
        project: p.title ?? p.content.slice(0, 40),
        platform: (p.platforms?.[0] as string) ?? "autre",
        status: p.status as ActivityRow["status"],
        updatedAt: formatRelativeDate(p.updated_at, tTime, intlLocale),
      }))
    } catch {
      // silently fail — empty table
    }
  }

  /* ── Fallback mock data if no real posts ── */
  if (activityRows.length === 0) {
    activityRows = [
      {
        id: "mock-1",
        project: t("mockProject1"),
        platform: "instagram",
        status: "published",
        updatedAt: tTime("hoursAgo", { count: 2 }),
      },
      {
        id: "mock-2",
        project: t("mockProject2"),
        platform: "linkedin",
        status: "review",
        updatedAt: tTime("hoursAgo", { count: 5 }),
      },
      {
        id: "mock-3",
        project: t("mockProject3"),
        platform: "tiktok",
        status: "draft",
        updatedAt: `${tTime("yesterday")}, 18:30`,
      },
    ]
  }

  /* ── Next scheduled post ── */
  let nextPostLabel = `${tTime("tomorrow")}, 10:00`
  let nextPostProject = t("mockNextProject")

  if (stats?.nextScheduledPost) {
    const scheduledDate = new Date(stats.nextScheduledPost.scheduledAt)
    nextPostLabel = formatScheduledDate(scheduledDate, tTime, intlLocale)
    nextPostProject = stats.nextScheduledPost.title
  }

  /* ── Platform distribution ── */
  let platformTotal = 0
  if (tenantId) {
    try {
      const [row] = await db
        .select({ n: count() })
        .from(posts)
        .where(eq(posts.tenant_id, tenantId))
      platformTotal = Number(row?.n ?? 0)
    } catch {
      // Table inexistante — reste à 0
    }
  }

  return (
    <div className="w-full space-y-8 p-6 lg:p-8">
      {/* Toast bienvenue post-onboarding */}
      <Suspense>
        <WelcomeToast tenantName={tenant?.name} />
      </Suspense>

      {/* ── Row 1 : KPI Cards ── */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label={t("postsThisMonth")}
          value={publishedCount}
          icon={FileText}
          iconBg="bg-violet-500/10"
          iconColor="text-violet-500"
        />
        <KpiCard
          label={t("visualsGenerated")}
          value={generatedCount}
          icon={Palette}
          iconBg="bg-blue-600/10"
          iconColor="text-blue-600"
        />
        <BrandDnaKpiCard score={brandDnaScore} />
        <NextScheduledCard
          dateLabel={nextPostLabel}
          projectName={nextPostProject}
        />
      </div>

      {/* ── Row 2 : Activity + Platform Distribution ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-10">
        <ActivityTable rows={activityRows} />

        <div className="glass-card flex flex-col rounded-2xl p-6 lg:col-span-4">
          <h3 className="mb-6 font-bold text-foreground">
            {t("platformDistribution")}
          </h3>
          <PlatformDistribution total={platformTotal} />
        </div>
      </div>

      {/* ── Row 3 : Calendar Strip ── */}
      <CalendarStrip />

      {/* ── CTA : Nouveau Projet ── */}
      <div className="flex justify-center pb-4">
        <Link
          href="/dashboard/create"
          className="rami-btn-gradient inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium shadow-lg shadow-violet-500/20"
        >
          <Plus className="size-4" />
          {t("newProject")}
        </Link>
      </div>
    </div>
  )
}
