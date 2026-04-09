'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { PingChartPoint } from '@/lib/types'

const REGION_COLORS: Record<string, string> = {
  Africa: '#f97316',
  Europe: '#60a5fa',
  'North America': '#34d399',
  'South America': '#fbbf24',
  Asia: '#a78bfa',
  Oceania: '#2dd4bf',
  Global: '#f472b6',
}

function regionColor(region: string): string {
  return REGION_COLORS[region] ?? '#94a3b8'
}

interface Props {
  data: PingChartPoint[]
  regions: string[]
}

export default function PacketLossChart({ data, regions }: Props) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0f" />
        <XAxis dataKey="time" tick={{ fill: '#71717a', fontSize: 11 }} />
        <YAxis unit="%" tick={{ fill: '#71717a', fontSize: 11 }} width={45} />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const point = (payload[0] as any).payload as PingChartPoint
            return (
              <div className="rounded-lg border border-white/10 bg-zinc-900 p-3 text-xs shadow-xl min-w-[160px]">
                <p className="mb-2 font-medium text-zinc-300">{label}</p>
                {regions.map((region) => {
                  const loss = point[`${region}_loss`]
                  if (loss == null) return null
                  return (
                    <div key={region} className="flex items-center justify-between gap-4 mb-1 last:mb-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="h-2 w-2 rounded-full flex-shrink-0"
                          style={{ background: regionColor(region) }}
                        />
                        <span style={{ color: regionColor(region) }}>{region}</span>
                      </div>
                      <span className="text-zinc-200 tabular-nums">{loss}%</span>
                    </div>
                  )
                })}
              </div>
            )
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: '#a1a1aa' }} />
        {regions.map((region) => (
          <Line
            key={region}
            type="monotone"
            dataKey={`${region}_loss`}
            name={region}
            stroke={regionColor(region)}
            dot={false}
            strokeWidth={2}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
