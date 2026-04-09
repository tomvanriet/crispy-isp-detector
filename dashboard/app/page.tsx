export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { createServerClient } from '@/lib/supabase'
import type { PingResult, SpeedResult, PingChartPoint, SpeedChartPoint } from '@/lib/types'
import StatCard from '@/app/components/StatCard'
import PingChart from '@/app/components/PingChart'
import SpeedChart from '@/app/components/SpeedChart'

function toDateTimeLabel(iso: string): string {
  const d = new Date(iso)
  return `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} ${String(d.getHours()).padStart(2, '0')}:00`
}

function buildPingChartData(rows: PingResult[]): { data: PingChartPoint[]; regions: string[] } {
  const regions = [...new Set(rows.map((r) => r.target_region))].sort()
  const buckets = new Map<string, Map<string, number[]>>()

  for (const row of rows) {
    const bucket = toDateTimeLabel(row.created_at)
    if (!buckets.has(bucket)) buckets.set(bucket, new Map())
    const regionMap = buckets.get(bucket)!
    if (!regionMap.has(row.target_region)) regionMap.set(row.target_region, [])
    regionMap.get(row.target_region)!.push(row.rtt_avg)
  }

  const data: PingChartPoint[] = [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([time, regionMap]) => {
      const point: PingChartPoint = { time }
      for (const region of regions) {
        const vals = regionMap.get(region)
        if (vals && vals.length > 0) {
          point[region] = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
        }
      }
      return point
    })

  return { data, regions }
}

function buildSpeedChartData(rows: SpeedResult[]): SpeedChartPoint[] {
  return rows
    .slice()
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((r) => ({
      time: toDateTimeLabel(r.created_at),
      download: Math.round(r.download_mbps * 10) / 10,
      upload: Math.round(r.upload_mbps * 10) / 10,
    }))
}

async function DashboardContent() {
  const supabase = createServerClient()
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [pingRes, speedRes, collectorsRes] = await Promise.all([
    supabase
      .from('ping_results')
      .select('*')
      .gte('created_at', since24h)
      .order('created_at', { ascending: true }),
    supabase
      .from('speed_results')
      .select('*')
      .gte('created_at', since7d)
      .order('created_at', { ascending: false })
      .limit(200),
    supabase.from('collectors').select('*'),
  ])

  const pings: PingResult[] = pingRes.data ?? []
  const speeds: SpeedResult[] = speedRes.data ?? []
  const collectors = collectorsRes.data ?? []

  const avgRtt = pings.length
    ? Math.round(pings.reduce((s, r) => s + r.rtt_avg, 0) / pings.length)
    : null
  const avgLoss = pings.length
    ? (pings.reduce((s, r) => s + r.packet_loss, 0) / pings.length).toFixed(1)
    : null
  const latestSpeed = speeds[0]
  const avgDownload = speeds.length
    ? (speeds.reduce((s, r) => s + r.download_mbps, 0) / speeds.length).toFixed(1)
    : null
  const avgUpload = speeds.length
    ? (speeds.reduce((s, r) => s + r.upload_mbps, 0) / speeds.length).toFixed(1)
    : null

  const { data: pingChartData, regions } = buildPingChartData(pings)
  const speedChartData = buildSpeedChartData(speeds)

  return (
    <>
      {collectors.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {collectors.map((c) => (
            <span
              key={c.id}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-400"
            >
              {c.name} · {c.isp} · {c.location}
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        <StatCard
          label="Avg RTT (24h)"
          value={avgRtt != null ? `${avgRtt} ms` : '—'}
          sub="across all targets"
          color="blue"
        />
        <StatCard
          label="Packet Loss (24h)"
          value={avgLoss != null ? `${avgLoss}%` : '—'}
          sub="avg across all probes"
          color={avgLoss != null && parseFloat(avgLoss) > 1 ? 'red' : 'green'}
        />
        <StatCard
          label="Avg Download"
          value={avgDownload != null ? `${avgDownload} Mbps` : '—'}
          sub="last 7 days"
          color="green"
        />
        <StatCard
          label="Avg Upload"
          value={avgUpload != null ? `${avgUpload} Mbps` : '—'}
          sub="last 7 days"
          color="blue"
        />
      </div>

      <section className="mb-8 rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-semibold text-zinc-200">Ping RTT by Region</h2>
          <span className="text-xs text-zinc-500">last 24 hours · hourly avg</span>
        </div>
        {pingChartData.length > 0 ? (
          <PingChart data={pingChartData} regions={regions} />
        ) : (
          <p className="py-16 text-center text-sm text-zinc-600">No ping data in the last 24 hours</p>
        )}
      </section>

      <section className="rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-semibold text-zinc-200">Speed Tests</h2>
          <span className="text-xs text-zinc-500">
            last 7 days
            {latestSpeed &&
              ` · latest: ↓${latestSpeed.download_mbps.toFixed(1)} / ↑${latestSpeed.upload_mbps.toFixed(1)} Mbps`}
          </span>
        </div>
        {speedChartData.length > 0 ? (
          <SpeedChart data={speedChartData} />
        ) : (
          <p className="py-16 text-center text-sm text-zinc-600">No speed test data in the last 7 days</p>
        )}
      </section>
    </>
  )
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-32 text-sm text-zinc-500">
          Loading dashboard…
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  )
}
