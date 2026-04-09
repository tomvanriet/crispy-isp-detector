import { createServerClient } from '@/lib/supabase'
import type { Collector, PingResult, SpeedResult, PingChartPoint, SpeedChartPoint } from '@/lib/types'
import type { Timeframe } from '@/lib/timeframe'

export const TIMEFRAME_MS: Record<Timeframe, number> = {
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

export interface SpeedPayload {
  chartData: SpeedChartPoint[]
  stats: {
    latestDownload: number | null
    latestUpload: number | null
    avgDownload: string | null
    avgUpload: string | null
  }
}

export interface PingPayload {
  chartData: PingChartPoint[]
  regions: string[]
  stats: {
    avgRtt: number | null
    avgLoss: string | null
  }
}

export async function fetchSpeedPayload(
  location: string | undefined,
  timeframe: Timeframe,
  collectors: Collector[]
): Promise<SpeedPayload> {
  const supabase = createServerClient()
  const since = new Date(Date.now() - TIMEFRAME_MS[timeframe]).toISOString()

  const filteredCollectors = location ? collectors.filter((c) => c.location === location) : collectors
  const collectorIds = filteredCollectors.map((c) => c.id)

  let query = supabase
    .from('speed_results')
    .select('*')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(200)

  if (location && collectorIds.length > 0) {
    query = query.in('collector_id', collectorIds)
  }

  const { data } = await query
  const speeds: SpeedResult[] = data ?? []
  const latestSpeed = speeds[0]

  const chartData: SpeedChartPoint[] = speeds
    .slice()
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((r) => ({
      time: toDateTimeLabel(r.created_at),
      download: Math.round(r.download_mbps * 10) / 10,
      upload: Math.round(r.upload_mbps * 10) / 10,
      ping: Math.round(r.ping_ms),
      server: r.server_name ?? '',
    }))

  return {
    chartData,
    stats: {
      latestDownload: latestSpeed ? Math.round(latestSpeed.download_mbps * 10) / 10 : null,
      latestUpload: latestSpeed ? Math.round(latestSpeed.upload_mbps * 10) / 10 : null,
      avgDownload: speeds.length
        ? (speeds.reduce((s, r) => s + r.download_mbps, 0) / speeds.length).toFixed(1)
        : null,
      avgUpload: speeds.length
        ? (speeds.reduce((s, r) => s + r.upload_mbps, 0) / speeds.length).toFixed(1)
        : null,
    },
  }
}

export async function fetchPingPayload(
  location: string | undefined,
  region: string,
  timeframe: Timeframe,
  collectors: Collector[]
): Promise<PingPayload> {
  const supabase = createServerClient()
  const since = new Date(Date.now() - TIMEFRAME_MS[timeframe]).toISOString()

  const filteredCollectors = location ? collectors.filter((c) => c.location === location) : collectors
  const collectorIds = filteredCollectors.map((c) => c.id)

  let query = supabase
    .from('ping_results')
    .select('*')
    .gte('created_at', since)
    .order('created_at', { ascending: true })

  if (location && collectorIds.length > 0) {
    query = query.in('collector_id', collectorIds)
  }
  if (region !== 'all') {
    query = query.eq('target_region', region)
  }

  const { data } = await query
  const pings: PingResult[] = data ?? []

  const regions = [...new Set(pings.map((r) => r.target_region))].sort()
  const buckets = new Map<string, Map<string, PingBucket>>()

  for (const row of pings) {
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

  const chartData: PingChartPoint[] = [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([time, regionMap]) => {
      const point: PingChartPoint = { time }
      for (const r of regions) {
        const b = regionMap.get(r)
        if (b && b.avg.length > 0) {
          point[r] = Math.round(avg(b.avg))
          point[`${r}_min`] = Math.round(Math.min(...b.min))
          point[`${r}_max`] = Math.round(Math.max(...b.max))
          point[`${r}_jitter`] = Math.round(avg(b.jitter) * 10) / 10
          point[`${r}_loss`] = Math.round(avg(b.loss) * 10) / 10
        }
      }
      return point
    })

  return {
    chartData,
    regions,
    stats: {
      avgRtt: pings.length ? Math.round(pings.reduce((s, r) => s + r.rtt_avg, 0) / pings.length) : null,
      avgLoss: pings.length
        ? (pings.reduce((s, r) => s + r.packet_loss, 0) / pings.length).toFixed(1)
        : null,
    },
  }
}
