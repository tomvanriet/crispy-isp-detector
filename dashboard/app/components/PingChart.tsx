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

export default function PingChart({ data, regions }: Props) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0f" />
        <XAxis dataKey="time" tick={{ fill: '#71717a', fontSize: 11 }} />
        <YAxis
          unit=" ms"
          tick={{ fill: '#71717a', fontSize: 11 }}
          width={60}
        />
        <Tooltip
          contentStyle={{ background: '#18181b', border: '1px solid #ffffff1a', borderRadius: 8 }}
          labelStyle={{ color: '#a1a1aa' }}
          itemStyle={{ color: '#e4e4e7' }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: '#a1a1aa' }} />
        {regions.map((region) => (
          <Line
            key={region}
            type="monotone"
            dataKey={region}
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
