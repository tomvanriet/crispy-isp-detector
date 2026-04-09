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
        <YAxis unit=" Mbps" tick={{ fill: '#71717a', fontSize: 11 }} width={70} />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const point = (payload[0] as any).payload as SpeedChartPoint
            return (
              <div className="rounded-lg border border-white/10 bg-zinc-900 p-3 text-xs shadow-xl min-w-[180px]">
                <p className="mb-2 font-medium text-zinc-300">{label}</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    Download
                  </span>
                  <span className="text-zinc-200 tabular-nums">{point.download} Mbps</span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-sky-400" />
                    Upload
                  </span>
                  <span className="text-zinc-200 tabular-nums">{point.upload} Mbps</span>
                  <span>Latency</span>
                  <span className="text-zinc-200 tabular-nums">{point.ping} ms</span>
                  {point.server && (
                    <>
                      <span>Server</span>
                      <span className="text-zinc-200 truncate max-w-[120px]">{point.server}</span>
                    </>
                  )}
                </div>
              </div>
            )
          }}
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
