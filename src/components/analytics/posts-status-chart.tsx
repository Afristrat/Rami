"use client"

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import type { PostStatusData } from "@/app/actions/analytics"

interface PostsStatusChartProps {
  data: PostStatusData[]
}

interface TooltipPayloadItem {
  name: string
  value: number
  payload: PostStatusData
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean
  payload?: TooltipPayloadItem[]
}) => {
  if (!active || !payload?.length) return null
  const item = payload[0]
  if (!item) return null
  return (
    <div className="rounded-lg border border-white/[0.12] bg-zinc-900/95 p-3 shadow-xl backdrop-blur-sm">
      <div className="flex items-center gap-2 text-xs">
        <span
          className="inline-block size-2 rounded-full"
          style={{ backgroundColor: item.payload.color }}
        />
        <span className="font-semibold">{item.payload.label}</span>
        <span className="text-muted-foreground">: {item.value}</span>
      </div>
    </div>
  )
}

const RADIAN = Math.PI / 180

import type { PieLabelRenderProps } from "recharts"

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: PieLabelRenderProps) => {
  const cxNum = Number(cx ?? 0)
  const cyNum = Number(cy ?? 0)
  const midAngleNum = Number(midAngle ?? 0)
  const innerR = Number(innerRadius ?? 0)
  const outerR = Number(outerRadius ?? 0)
  const pct = Number(percent ?? 0)
  if (pct < 0.05) return null
  const radius = innerR + (outerR - innerR) * 0.6
  const x = cxNum + radius * Math.cos(-midAngleNum * RADIAN)
  const y = cyNum + radius * Math.sin(-midAngleNum * RADIAN)
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={600}
    >
      {`${(pct * 100).toFixed(0)}%`}
    </text>
  )
}

export function PostsStatusChart({ data }: PostsStatusChartProps) {
  if (!data.length) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Aucune donnée disponible
      </div>
    )
  }

  const total = data.reduce((sum, d) => sum + d.count, 0)

  return (
    <div className="flex flex-col gap-3">
      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              dataKey="count"
              paddingAngle={2}
              labelLine={false}
              label={renderCustomLabel}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Légende personnalisée */}
      <div className="grid grid-cols-2 gap-1.5 px-1">
        {data.map((entry) => (
          <div key={entry.status} className="flex items-center justify-between gap-2 rounded-md px-2 py-1 hover:bg-white/[0.03]">
            <div className="flex items-center gap-1.5">
              <span
                className="inline-block size-2 shrink-0 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-muted-foreground">{entry.label}</span>
            </div>
            <span className="text-xs font-semibold">
              {entry.count}
              <span className="ml-1 text-[10px] text-muted-foreground/60">
                ({total > 0 ? Math.round((entry.count / total) * 100) : 0}%)
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
