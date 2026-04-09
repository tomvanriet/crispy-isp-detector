'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import PingChart from '@/app/components/PingChart'
import StatCard from '@/app/components/StatCard'
import TimeframeFilter from '@/app/components/TimeframeFilter'
import { TIMEFRAMES, DEFAULT_TIMEFRAME } from '@/lib/timeframe'
import type { Timeframe } from '@/lib/timeframe'
import type { PingPayload } from '@/lib/data'

interface Props {
  initialData: PingPayload
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

export default function PingSectionClient({ initialData }: Props) {
  const searchParams = useSearchParams()

  const globalTf = (TIMEFRAMES.find((tf) => tf === searchParams.get('timeframe')) ?? DEFAULT_TIMEFRAME) as Timeframe
  const pingTf = (TIMEFRAMES.find((tf) => tf === searchParams.get('pingTf')) ?? globalTf) as Timeframe
  const location = searchParams.get('location') ?? undefined
  const region = searchParams.get('region') ?? 'Africa'

  const [payload, setPayload] = useState<PingPayload | null>(initialData)
  const isFirstMount = useRef(true)
  const cache = useRef(new Map<string, PingPayload>())

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false
      return
    }

    const key = `${location}|${region}|${pingTf}`
    const cached = cache.current.get(key)
    if (cached) {
      setPayload(cached)
      return
    }

    setPayload(null)
    const params = new URLSearchParams({ timeframe: pingTf, region })
    if (location) params.set('location', location)

    fetch(`/api/ping?${params}`)
      .then((r) => r.json())
      .then((data: PingPayload) => {
        cache.current.set(key, data)
        setPayload(data)
      })
      .catch(() => setPayload(initialData))
  }, [location, region, pingTf])

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-4">
        {payload ? (
          <>
            <StatCard
              label="Avg RTT"
              value={payload.stats.avgRtt != null ? `${payload.stats.avgRtt} ms` : '—'}
              sub={`last ${pingTf} · across all targets`}
              color="blue"
            />
            <StatCard
              label="Packet Loss"
              value={payload.stats.avgLoss != null ? `${payload.stats.avgLoss}%` : '—'}
              sub={`last ${pingTf} · avg across all probes`}
              color={payload.stats.avgLoss != null && parseFloat(payload.stats.avgLoss) > 1 ? 'red' : 'green'}
            />
          </>
        ) : (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        )}
      </div>
      <section className="mb-6 rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-zinc-200">Ping RTT by Region</h2>
            <p className="mt-0.5 text-xs text-zinc-500">30 min avg</p>
          </div>
          <TimeframeFilter selected={pingTf} paramName="pingTf" variant="inline" />
        </div>
        {payload == null ? (
          <div className="h-[320px] animate-pulse rounded-lg bg-white/5" />
        ) : payload.chartData.length > 0 ? (
          <PingChart data={payload.chartData} regions={payload.regions} />
        ) : (
          <p className="py-16 text-center text-sm text-zinc-600">No ping data in the last {pingTf}</p>
        )}
      </section>
    </div>
  )
}
