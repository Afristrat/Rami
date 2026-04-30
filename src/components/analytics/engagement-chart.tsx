"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { PLATFORM_CONFIG } from "@/lib/scheduler/platform-config"
import { useIntlLocale } from "@/lib/utils/format-locale"
import type { DailyEngagement } from "@/app/actions/analytics"
import type { Platform } from "@/lib/scheduler/platform-config"

interface EngagementChartProps {
  data: DailyEngagement[]
}

/** Map day-of-week index to French short name */
const DAY_NAMES_FR: Record<number, string> = {
  0: "DIM",
  1: "LUN",
  2: "MAR",
  3: "MER",
  4: "JEU",
  5: "VEN",
  6: "SAM",
}

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00")
  return DAY_NAMES_FR[d.getDay()] ?? dateStr
}

interface TooltipPayloadItem {
  color: string
  name: string
  value: number
  dataKey: string
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
}) {
  const intlLocale = useIntlLocale()
  if (!active || !payload?.length) return null
  const total = payload.reduce((sum, entry) => sum + (entry.value ?? 0), 0)
  return (
    <div className="rounded-lg border border-gray-200 dark:border-white/[0.12] bg-white dark:bg-zinc-900/95 p-3 shadow-xl backdrop-blur-sm">
      <p className="mb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-gray-100 dark:border-white/10 pb-1.5">
        {label ?? ""}
      </p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span
                className="inline-block size-2.5 rounded-sm"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">
                {PLATFORM_CONFIG[entry.dataKey as Platform]?.label ?? entry.name}
              </span>
            </div>
            <span className="font-bold text-foreground">
              {entry.value.toLocaleString(intlLocale)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-1.5 pt-1.5 border-t border-gray-100 dark:border-white/10 flex justify-between text-xs">
        <span className="text-muted-foreground">Total</span>
        <span className="font-bold text-foreground">{total.toLocaleString(intlLocale)}</span>
      </div>
    </div>
  )
}

/** Aggregate daily data into 7 day-of-week buckets */
function aggregateByDayOfWeek(data: DailyEngagement[], platformKeys: Platform[]): Array<Record<string, string | number>> {
  const buckets: Record<string, Record<string, number>> = {}
  const counts: Record<string, number> = {}

  for (const entry of data) {
    const dayLabel = formatDayLabel(entry.date as string)
    if (!buckets[dayLabel]) {
      buckets[dayLabel] = {}
      counts[dayLabel] = 0
    }
    counts[dayLabel]++
    for (const p of platformKeys) {
      const val = typeof entry[p] === "number" ? (entry[p] as number) : 0
      buckets[dayLabel][p] = (buckets[dayLabel][p] ?? 0) + val
    }
  }

  // Average per day-of-week
  const dayOrder = ["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"]
  return dayOrder
    .filter(day => buckets[day])
    .map(day => {
      const result: Record<string, string | number> = { day }
      const c = counts[day] ?? 1
      for (const p of platformKeys) {
        result[p] = Math.round((buckets[day]?.[p] ?? 0) / c)
      }
      return result
    })
}

export function EngagementChart({ data }: EngagementChartProps) {
  if (!data.length) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
        {/* No data available */}
      </div>
    )
  }

  const platformKeys = Object.keys(data[0] ?? {}).filter(k => k !== "date") as Platform[]
  const chartData = aggregateByDayOfWeek(data, platformKeys)

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
          barCategoryGap="20%"
          barGap={2}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(128,128,128,0.1)"
            vertical={false}
          />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 10, fill: "var(--color-muted-foreground)", fontWeight: 600 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) =>
              v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toString()
            }
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "rgba(128,128,128,0.05)" }}
          />
          <Legend
            wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }}
            formatter={(value: string) =>
              PLATFORM_CONFIG[value as Platform]?.label ?? value
            }
            iconType="square"
            iconSize={10}
          />
          {platformKeys.map((platform) => (
            <Bar
              key={platform}
              dataKey={platform}
              name={platform}
              fill={PLATFORM_CONFIG[platform]?.color ?? "#8B5CF6"}
              radius={[3, 3, 0, 0]}
              maxBarSize={14}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
