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
import type { SpeedChartPoint } from '@/lib/types'

interface Props {
  data: SpeedChartPoint[]
}

export default function SpeedChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0f" />
        <XAxis dataKey="time" tick={{ fill: '#71717a', fontSize: 11 }} />
        <YAxis
          unit=" Mbps"
          tick={{ fill: '#71717a', fontSize: 11 }}
          width={70}
        />
        <Tooltip
          contentStyle={{ background: '#18181b', border: '1px solid #ffffff1a', borderRadius: 8 }}
          labelStyle={{ color: '#a1a1aa' }}
          itemStyle={{ color: '#e4e4e7' }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: '#a1a1aa' }} />
        <Line
          type="monotone"
          dataKey="download"
          stroke="#34d399"
          dot={{ r: 3, fill: '#34d399' }}
          strokeWidth={2}
          name="Download"
        />
        <Line
          type="monotone"
          dataKey="upload"
          stroke="#60a5fa"
          dot={{ r: 3, fill: '#60a5fa' }}
          strokeWidth={2}
          name="Upload"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
