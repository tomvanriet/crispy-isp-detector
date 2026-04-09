'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import StatCard from '@/app/components/StatCard'
import { TIMEFRAMES, DEFAULT_TIMEFRAME } from '@/lib/timeframe'
import type { Timeframe } from '@/lib/timeframe'
import type { PingPayload, SpeedPayload } from '@/lib/data'

interface Props {
  initialPingData: PingPayload
  initialSpeedData: SpeedPayload
}

function StatCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-white/10 bg-white/5 p-5">
      <div className="h-3.5 w-16 rounded bg-white/10" />
      <div className="mt-2 h-9 w-28 rounded bg-white/10" />
      <div className="mt-2 h-3 w-36 rounded bg-white/10" />
    </div>
  )
}

export default function TopStatsClient({ initialPingData, initialSpeedData }: Props) {
  const searchParams = useSearchParams()

  const globalTf = (TIMEFRAMES.find((tf) => tf === searchParams.get('timeframe')) ?? DEFAULT_TIMEFRAME) as Timeframe
  const pingTf = (TIMEFRAMES.find((tf) => tf === searchParams.get('pingTf')) ?? globalTf) as Timeframe
  const speedTf = (TIMEFRAMES.find((tf) => tf === searchParams.get('speedTf')) ?? globalTf) as Timeframe
  const location = searchParams.get('location') ?? undefined
  const region = searchParams.get('region') ?? 'Africa'

  const [pingPayload, setPingPayload] = useState<PingPayload | null>(initialPingData)
  const [speedPayload, setSpeedPayload] = useState<SpeedPayload | null>(initialSpeedData)
  const isFirstMount = useRef(true)
  const pingCache = useRef(new Map<string, PingPayload>())
  const speedCache = useRef(new Map<string, SpeedPayload>())

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false
      return
    }

    const pingKey = `${location}|${region}|${pingTf}`
    const cachedPing = pingCache.current.get(pingKey)
    if (cachedPing) {
      setPingPayload(cachedPing)
    } else {
      setPingPayload(null)
      const params = new URLSearchParams({ timeframe: pingTf, region })
      if (location) params.set('location', location)
      fetch(`/api/ping?${params}`)
        .then((r) => r.json())
        .then((data: PingPayload) => {
          pingCache.current.set(pingKey, data)
          setPingPayload(data)
        })
        .catch(() => setPingPayload(initialPingData))
    }

    const speedKey = `${location}|${speedTf}`
    const cachedSpeed = speedCache.current.get(speedKey)
    if (cachedSpeed) {
      setSpeedPayload(cachedSpeed)
    } else {
      setSpeedPayload(null)
      const params = new URLSearchParams({ timeframe: speedTf })
      if (location) params.set('location', location)
      fetch(`/api/speed?${params}`)
        .then((r) => r.json())
        .then((data: SpeedPayload) => {
          speedCache.current.set(speedKey, data)
          setSpeedPayload(data)
        })
        .catch(() => setSpeedPayload(initialSpeedData))
    }
  }, [location, region, pingTf, speedTf])

  const pingScope = [
    region !== 'all' ? region : 'all targets',
    location ? `from ${location}` : null,
  ].filter(Boolean).join(' · ')

  return (
    <div className="mb-6 grid grid-cols-4 gap-4">
      {speedPayload ? (
        <>
          <StatCard
            label="Avg Download"
            value={speedPayload.stats.avgDownload != null ? `${speedPayload.stats.avgDownload} Mbps` : '—'}
            sub={`last ${speedTf}`}
            color="green"
          />
          <StatCard
            label="Avg Upload"
            value={speedPayload.stats.avgUpload != null ? `${speedPayload.stats.avgUpload} Mbps` : '—'}
            sub={`last ${speedTf}`}
            color="blue"
          />
        </>
      ) : (
        <>
          <StatCardSkeleton />
          <StatCardSkeleton />
        </>
      )}
      {pingPayload ? (
        <>
          <StatCard
            label="Avg RTT"
            value={pingPayload.stats.avgRtt != null ? `${pingPayload.stats.avgRtt} ms` : '—'}
            sub={`last ${pingTf} · across ${pingScope}`}
            color="blue"
          />
          <StatCard
            label="Packet Loss"
            value={pingPayload.stats.avgLoss != null ? `${pingPayload.stats.avgLoss}%` : '—'}
            sub={`last ${pingTf} · avg across ${pingScope}`}
            color={pingPayload.stats.avgLoss != null && parseFloat(pingPayload.stats.avgLoss) > 1 ? 'red' : 'green'}
          />
        </>
      ) : (
        <>
          <StatCardSkeleton />
          <StatCardSkeleton />
        </>
      )}
    </div>
  )
}
