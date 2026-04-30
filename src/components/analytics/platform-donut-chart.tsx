"use client"

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import { PLATFORM_CONFIG } from "@/lib/scheduler/platform-config"
import { useIntlLocale } from "@/lib/utils/format-locale"
import type { Platform } from "@/lib/scheduler/platform-config"
import type { DailyEngagement } from "@/app/actions/analytics"

interface PlatformDonutChartProps {
  data: DailyEngagement[]
}

interface PlatformSlice {
  platform: string
  label: string
  value: number
  color: string
  percent: number
}

interface TooltipPayloadEntry {
  name: string
  value: number
  payload: PlatformSlice
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: TooltipPayloadEntry[]
}) {
  const intlLocale = useIntlLocale()
  if (!active || !payload?.length) return null
  const item = payload[0]
  if (!item) return null
  return (
    <div className="rounded-lg border border-gray-200 dark:border-white/[0.12] bg-white dark:bg-zinc-900/95 p-3 shadow-xl backdrop-blur-sm">
      <div className="flex items-center gap-2 text-xs">
        <span
          className="inline-block size-2.5 rounded-full"
          style={{ backgroundColor: item.payload.color }}
        />
        <span className="font-semibold text-foreground">{item.payload.label}</span>
        <span className="text-muted-foreground">
          {item.value.toLocaleString(intlLocale)} ({item.payload.percent}%)
        </span>
      </div>
    </div>
  )
}

/** Aggregate engagement data by platform */
function aggregateByPlatform(data: DailyEngagement[]): PlatformSlice[] {
  const totals: Record<string, number> = {}

  for (const entry of data) {
    for (const key of Object.keys(entry)) {
      if (key === "date") continue
      const val = typeof entry[key] === "number" ? (entry[key] as number) : 0
      totals[key] = (totals[key] ?? 0) + val
    }
  }

  const grandTotal = Object.values(totals).reduce((sum, v) => sum + v, 0) || 1

  const slices = Object.entries(totals)
    .map(([platform, value]) => ({
      platform,
      label: PLATFORM_CONFIG[platform as Platform]?.label ?? platform,
      value,
      color: PLATFORM_CONFIG[platform as Platform]?.color ?? "#6B7280",
      percent: Math.round((value / grandTotal) * 100),
    }))
    .sort((a, b) => b.value - a.value)

  // Group small slices into "Autre"
  const main: PlatformSlice[] = []
  let otherValue = 0
  let otherPercent = 0
  for (const s of slices) {
    if (s.percent >= 5) {
      main.push(s)
    } else {
      otherValue += s.value
      otherPercent += s.percent
    }
  }
  if (otherValue > 0) {
    main.push({
      platform: "other",
      label: "Autre",
      value: otherValue,
      color: "#4B5563",
      percent: otherPercent,
    })
  }

  return main
}

function formatTotal(n: number, locale: string): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString(locale)
}

export function PlatformDonutChart({ data }: PlatformDonutChartProps) {
  const intlLocale = useIntlLocale()
  const slices = aggregateByPlatform(data)
  const total = slices.reduce((sum, s) => sum + s.value, 0)

  if (slices.length === 0) {
    return (
      <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">
        Aucune donnée disponible
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="relative h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              dataKey="value"
              paddingAngle={2}
              stroke="none"
            >
              {slices.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-foreground">{formatTotal(total, intlLocale)}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total</span>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 mt-4 px-1">
        {slices.map((entry) => (
          <div key={entry.platform} className="flex items-center gap-2">
            <span
              className="inline-block size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-muted-foreground truncate">{entry.label}</span>
            <span className="ml-auto text-xs text-muted-foreground/60">({entry.percent}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}
