'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import SpeedChart from '@/app/components/SpeedChart'
import TimeframeFilter from '@/app/components/TimeframeFilter'
import { TIMEFRAMES, DEFAULT_TIMEFRAME } from '@/lib/timeframe'
import type { Timeframe } from '@/lib/timeframe'
import type { SpeedPayload } from '@/lib/data'

interface Props {
  initialData: SpeedPayload
}

export default function SpeedSectionClient({ initialData }: Props) {
  const searchParams = useSearchParams()

  const globalTf = (TIMEFRAMES.find((tf) => tf === searchParams.get('timeframe')) ?? DEFAULT_TIMEFRAME) as Timeframe
  const speedTf = (TIMEFRAMES.find((tf) => tf === searchParams.get('speedTf')) ?? globalTf) as Timeframe
  const location = searchParams.get('location') ?? undefined

  const [payload, setPayload] = useState<SpeedPayload | null>(initialData)
  const isFirstMount = useRef(true)
  const cache = useRef(new Map<string, SpeedPayload>())

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false
      return
    }

    const key = `${location}|${speedTf}`
    const cached = cache.current.get(key)
    if (cached) {
      setPayload(cached)
      return
    }

    setPayload(null)
    const params = new URLSearchParams({ timeframe: speedTf })
    if (location) params.set('location', location)

    fetch(`/api/speed?${params}`)
      .then((r) => r.json())
      .then((data: SpeedPayload) => {
        cache.current.set(key, data)
        setPayload(data)
      })
      .catch(() => setPayload(initialData))
  }, [location, speedTf])

  return (
    <div>
      <section className="rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-zinc-200">Speed Tests</h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              {payload?.stats.latestDownload != null
                ? `latest: ↓${payload.stats.latestDownload} / ↑${payload.stats.latestUpload} Mbps`
                : payload
                  ? 'no recent tests'
                  : ''}
            </p>
          </div>
          <TimeframeFilter selected={speedTf} paramName="speedTf" variant="inline" />
        </div>
        {payload == null ? (
          <div className="h-[320px] animate-pulse rounded-lg bg-white/5" />
        ) : payload.chartData.length > 0 ? (
          <SpeedChart data={payload.chartData} />
        ) : (
          <p className="py-16 text-center text-sm text-zinc-600">No speed test data in the last {speedTf}</p>
        )}
      </section>
    </div>
  )
}
