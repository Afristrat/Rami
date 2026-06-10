"use server"

import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { posts } from "@/lib/db/schema"
import { and, eq, gte, lte } from "drizzle-orm"
import { resolveUserTenant } from "@/lib/services/tenant/resolve"

export interface CalendarPost {
  id: string
  title: string | null
  content: string
  platforms: string[]
  status: string
  scheduledAt: string // ISO string
  /** Jour de la semaine (0=lundi … 6=dimanche) */
  weekDayIndex: number
  /** Heure formatée HH:MM */
  timeLabel: string
}

/**
 * Retourne les posts planifiés (status=scheduled) pour une semaine donnée.
 *
 * @param weekStart Date ISO du lundi de la semaine (00:00:00 UTC)
 * @param weekEnd   Date ISO du dimanche de la semaine (23:59:59 UTC)
 */
export async function getWeekPostsAction(
  weekStart: string,
  weekEnd: string
): Promise<{ data: CalendarPost[] } | { error: string }> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return { error: "Non authentifié." }

  const tenantId = await resolveUserTenant(supabase, user.id)
  if (!tenantId) return { error: "Tenant introuvable." }

  const start = new Date(weekStart)
  const end = new Date(weekEnd)

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { error: "Dates invalides." }
  }

  try {
    const rows = await db
      .select({
        id: posts.id,
        title: posts.title,
        content: posts.content,
        platforms: posts.platforms,
        status: posts.status,
        scheduled_at: posts.scheduled_at,
      })
      .from(posts)
      .where(
        and(
          eq(posts.tenant_id, tenantId),
          eq(posts.status, "scheduled"),
          gte(posts.scheduled_at, start),
          lte(posts.scheduled_at, end)
        )
      )

    const calendarPosts: CalendarPost[] = rows
      .filter((r) => r.scheduled_at !== null)
      .map((r) => {
        const date = r.scheduled_at as Date
        // getDay() : 0=dimanche … 6=samedi → convertir en 0=lundi … 6=dimanche
        const jsDay = date.getDay()
        const weekDayIndex = jsDay === 0 ? 6 : jsDay - 1
        const hh = String(date.getHours()).padStart(2, "0")
        const mm = String(date.getMinutes()).padStart(2, "0")
        return {
          id: r.id,
          title: r.title ?? null,
          content: r.content,
          platforms: (r.platforms ?? []) as string[],
          status: r.status,
          scheduledAt: date.toISOString(),
          weekDayIndex,
          timeLabel: `${hh}:${mm}`,
        }
      })

    return { data: calendarPosts }
  } catch (err) {
    // Table inexistante ou erreur réseau → liste vide (pas d'erreur visible)
    const code = (err as Record<string, unknown>)?.code
    if (code === "42P01") return { data: [] }
    return { data: [] }
  }
}
