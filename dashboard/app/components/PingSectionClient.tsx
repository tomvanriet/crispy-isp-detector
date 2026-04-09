'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import PingChart from '@/app/components/PingChart'
import PacketLossChart from '@/app/components/PacketLossChart'
import TimeframeFilter from '@/app/components/TimeframeFilter'
import { TIMEFRAMES, DEFAULT_TIMEFRAME } from '@/lib/timeframe'
import type { Timeframe } from '@/lib/timeframe'
import type { PingPayload } from '@/lib/data'

interface Props {
  initialData: PingPayload
  initialLossData: PingPayload
}

export default function PingSectionClient({ initialData, initialLossData }: Props) {
  const searchParams = useSearchParams()

  const globalTf = (TIMEFRAMES.find((tf) => tf === searchParams.get('timeframe')) ?? DEFAULT_TIMEFRAME) as Timeframe
  const pingTf = (TIMEFRAMES.find((tf) => tf === searchParams.get('pingTf')) ?? globalTf) as Timeframe
  const lossTf = (TIMEFRAMES.find((tf) => tf === searchParams.get('lossTf')) ?? globalTf) as Timeframe
  const location = searchParams.get('location') ?? undefined
  const region = searchParams.get('region') ?? 'Africa'

  const [payload, setPayload] = useState<PingPayload | null>(initialData)
  const [lossPayload, setLossPayload] = useState<PingPayload | null>(initialLossData)
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
    } else {
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
    }

    const lossKey = `${location}|${region}|${lossTf}`
    const cachedLoss = cache.current.get(lossKey)
    if (cachedLoss) {
      setLossPayload(cachedLoss)
    } else {
      setLossPayload(null)
      const params = new URLSearchParams({ timeframe: lossTf, region })
      if (location) params.set('location', location)
      fetch(`/api/ping?${params}`)
        .then((r) => r.json())
        .then((data: PingPayload) => {
          cache.current.set(lossKey, data)
          setLossPayload(data)
        })
        .catch(() => setLossPayload(initialLossData))
    }
  }, [location, region, pingTf, lossTf])

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-4">
        <section className="rounded-xl border border-white/10 bg-white/5 p-6">
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
        <section className="rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-zinc-200">Packet Loss by Region</h2>
              <p className="mt-0.5 text-xs text-zinc-500">30 min avg</p>
            </div>
            <TimeframeFilter selected={lossTf} paramName="lossTf" variant="inline" />
          </div>
          {lossPayload == null ? (
            <div className="h-[320px] animate-pulse rounded-lg bg-white/5" />
          ) : lossPayload.chartData.length > 0 ? (
            <PacketLossChart data={lossPayload.chartData} regions={lossPayload.regions} />
          ) : (
            <p className="py-16 text-center text-sm text-zinc-600">No ping data in the last {lossTf}</p>
          )}
        </section>
      </div>
    </div>
  )
}
