export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { createServerClient } from '@/lib/supabase'
import type { Collector, PingResult, SpeedResult, PingChartPoint, SpeedChartPoint } from '@/lib/types'
import StatCard from '@/app/components/StatCard'
import PingChart from '@/app/components/PingChart'
import SpeedChart from '@/app/components/SpeedChart'
import LocationFilter from '@/app/components/LocationFilter'
import RegionFilter from '@/app/components/RegionFilter'
import TimeframeFilter from '@/app/components/TimeframeFilter'
import { TIMEFRAMES, DEFAULT_TIMEFRAME } from '@/lib/timeframe'
import type { Timeframe } from '@/lib/timeframe'

const DEFAULT_REGION = 'Africa'

const TIMEFRAME_MS: Record<Timeframe, number> = {
  '1h': 1 * 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
}

function toDateTimeLabel(iso: string): string {
  const d = new Date(iso)
  const half = d.getMinutes() < 30 ? '00' : '30'
  return `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} ${String(d.getHours()).padStart(2, '0')}:${half}`
}

interface PingBucket {
  avg: number[]
  min: number[]
  max: number[]
  jitter: number[]
  loss: number[]
}

function buildPingChartData(rows: PingResult[]): { data: PingChartPoint[]; regions: string[] } {
  const regions = [...new Set(rows.map((r) => r.target_region))].sort()
  const buckets = new Map<string, Map<string, PingBucket>>()

  for (const row of rows) {
    const bucket = toDateTimeLabel(row.created_at)
    if (!buckets.has(bucket)) buckets.set(bucket, new Map())
    const regionMap = buckets.get(bucket)!
    if (!regionMap.has(row.target_region)) {
      regionMap.set(row.target_region, { avg: [], min: [], max: [], jitter: [], loss: [] })
    }
    const b = regionMap.get(row.target_region)!
    b.avg.push(row.rtt_avg)
    b.min.push(row.rtt_min)
    b.max.push(row.rtt_max)
    b.jitter.push(row.rtt_mdev)
    b.loss.push(row.packet_loss)
  }

  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length

  const data: PingChartPoint[] = [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([time, regionMap]) => {
      const point: PingChartPoint = { time }
      for (const region of regions) {
        const b = regionMap.get(region)
        if (b && b.avg.length > 0) {
          point[region] = Math.round(avg(b.avg))
          point[`${region}_min`] = Math.round(Math.min(...b.min))
          point[`${region}_max`] = Math.round(Math.max(...b.max))
          point[`${region}_jitter`] = Math.round(avg(b.jitter) * 10) / 10
          point[`${region}_loss`] = Math.round(avg(b.loss) * 10) / 10
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
      ping: Math.round(r.ping_ms),
      server: r.server_name ?? '',
    }))
}

async function DashboardContent({
  collectors,
  location,
  region,
  timeframe,
}: {
  collectors: Collector[]
  location?: string
  region: string
  timeframe: Timeframe
}) {
  const supabase = createServerClient()
  const since = new Date(Date.now() - TIMEFRAME_MS[timeframe]).toISOString()

  const filteredCollectors = location
    ? collectors.filter((c) => c.location === location)
    : collectors
  const collectorIds = filteredCollectors.map((c) => c.id)

  let pingQuery = supabase
    .from('ping_results')
    .select('*')
    .gte('created_at', since)
    .order('created_at', { ascending: true })

  let speedQuery = supabase
    .from('speed_results')
    .select('*')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(200)

  if (location && collectorIds.length > 0) {
    pingQuery = pingQuery.in('collector_id', collectorIds)
    speedQuery = speedQuery.in('collector_id', collectorIds)
  }

  if (region !== 'all') {
    pingQuery = pingQuery.eq('target_region', region)
  }

  const [pingRes, speedRes] = await Promise.all([pingQuery, speedQuery])

  const pings: PingResult[] = pingRes.data ?? []
  const speeds: SpeedResult[] = speedRes.data ?? []

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
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        <StatCard
          label={`Avg RTT (${timeframe})`}
          value={avgRtt != null ? `${avgRtt} ms` : '—'}
          sub="across all targets"
          color="blue"
        />
        <StatCard
          label={`Packet Loss (${timeframe})`}
          value={avgLoss != null ? `${avgLoss}%` : '—'}
          sub="avg across all probes"
          color={avgLoss != null && parseFloat(avgLoss) > 1 ? 'red' : 'green'}
        />
        <StatCard
          label="Avg Download"
          value={avgDownload != null ? `${avgDownload} Mbps` : '—'}
          sub={`last ${timeframe}`}
          color="green"
        />
        <StatCard
          label="Avg Upload"
          value={avgUpload != null ? `${avgUpload} Mbps` : '—'}
          sub={`last ${timeframe}`}
          color="blue"
        />
      </div>

      <section className="mb-8 rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-semibold text-zinc-200">Ping RTT by Region</h2>
          <span className="text-xs text-zinc-500">last {timeframe} · 30 min avg</span>
        </div>
        {pingChartData.length > 0 ? (
          <PingChart data={pingChartData} regions={regions} />
        ) : (
          <p className="py-16 text-center text-sm text-zinc-600">No ping data in the last {timeframe}</p>
        )}
      </section>

      <section className="rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-semibold text-zinc-200">Speed Tests</h2>
          <span className="text-xs text-zinc-500">
            last {timeframe}
            {latestSpeed &&
              ` · latest: ↓${latestSpeed.download_mbps.toFixed(1)} / ↑${latestSpeed.upload_mbps.toFixed(1)} Mbps`}
          </span>
        </div>
        {speedChartData.length > 0 ? (
          <SpeedChart data={speedChartData} />
        ) : (
          <p className="py-16 text-center text-sm text-zinc-600">No speed test data in the last {timeframe}</p>
        )}
      </section>
    </>
  )
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ location?: string; region?: string; timeframe?: string }>
}) {
  const { location, region: regionParam, timeframe: timeframeParam } = await searchParams
  const region = regionParam ?? DEFAULT_REGION
  const timeframe: Timeframe = TIMEFRAMES.some((tf) => tf === timeframeParam)
    ? (timeframeParam as Timeframe)
    : DEFAULT_TIMEFRAME

  const supabase = createServerClient()
  const { data } = await supabase.from('collectors').select('*')
  const collectors: Collector[] = data ?? []
  const locations = [...new Set(collectors.map((c) => c.location))].sort()

  return (
    <>
      <LocationFilter locations={locations} selected={location} />
      <RegionFilter selected={region} />
      <TimeframeFilter selected={timeframe} />
      <Suspense
        key={`${location}-${region}-${timeframe}`}
        fallback={
          <div className="flex items-center justify-center py-32 text-sm text-zinc-500">
            Loading…
          </div>
        }
      >
        <DashboardContent collectors={collectors} location={location} region={region} timeframe={timeframe} />
      </Suspense>
    </>
  )
}
