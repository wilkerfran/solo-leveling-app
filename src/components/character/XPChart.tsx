"use client"

import { useMemo } from "react"
import { XPEvent } from "@/types"
import {
  AreaChart, Area, XAxis, YAxis,
  Tooltip, ResponsiveContainer,
} from "recharts"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface TooltipProps {
  active?: boolean
  payload?: Array<{ value: number; payload: { gained: number } }>
  label?: string
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      backgroundColor: "#111827",
      border: "1px solid #1F2937",
      borderRadius: "8px",
      padding: "10px 14px",
    }}>
      <p style={{ color: "#94A3B8", fontSize: "12px", marginBottom: "4px" }}>{label}</p>
      <p style={{ color: "#A78BFA", fontSize: "14px", fontWeight: 600 }}>
        {payload[0].value} XP total
      </p>
      <p style={{ color: "#64748B", fontSize: "12px" }}>
        +{payload[0].payload.gained} XP nessa quest
      </p>
    </div>
  )
}

interface XPChartProps {
  events: XPEvent[]
}

export function XPChart({ events }: XPChartProps) {
  // useMemo garante que o cálculo só roda quando events muda
  // e evita o erro de reassign durante render
  const data = useMemo(() => {
  return events.reduce<Array<{ date: string; xp: number; gained: number }>>(
    (acc, event) => {
      const previous = acc[acc.length - 1]?.xp ?? 0
      acc.push({
        date: format(new Date(event.$createdAt), "dd/MM", { locale: ptBR }),
        xp: previous + event.xpGained,
        gained: event.xpGained,
      })
      return acc
    },
    []
  )
}, [events])

  if (events.length === 0) {
    return (
      <div style={{
        padding: "32px 20px",
        textAlign: "center",
        border: "1px dashed #1F2937",
        borderRadius: "12px",
      }}>
        <p style={{ color: "#64748B", fontSize: "14px" }}>
          Complete quests para ver seu progresso aqui
        </p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="xp"
          stroke="#7C3AED"
          strokeWidth={2}
          fill="url(#xpGradient)"
          dot={{ fill: "#7C3AED", strokeWidth: 0, r: 3 }}
          activeDot={{ fill: "#A78BFA", strokeWidth: 0, r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}