export const dynamic = 'force-dynamic'

import { createServerClient } from '@/lib/supabase'
import { fetchPingPayload, fetchSpeedPayload } from '@/lib/data'
import LocationFilter from '@/app/components/LocationFilter'
import RegionFilter from '@/app/components/RegionFilter'
import TimeframeFilter from '@/app/components/TimeframeFilter'
import TopStatsClient from '@/app/components/TopStatsClient'
import PingSectionClient from '@/app/components/PingSectionClient'
import SpeedSectionClient from '@/app/components/SpeedSectionClient'
import { TIMEFRAMES, DEFAULT_TIMEFRAME } from '@/lib/timeframe'
import type { Timeframe } from '@/lib/timeframe'
import type { Collector } from '@/lib/types'

function resolveTimeframe(param: string | undefined, fallback: Timeframe): Timeframe {
  return TIMEFRAMES.some((tf) => tf === param) ? (param as Timeframe) : fallback
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    location?: string
    region?: string
    timeframe?: string
    pingTf?: string
    lossTf?: string
    speedTf?: string
  }>
}) {
  const { location, region: regionParam, timeframe: tfParam, pingTf: pingTfParam, lossTf: lossTfParam, speedTf: speedTfParam } =
    await searchParams

  const region = regionParam ?? 'Africa'
  const timeframe = resolveTimeframe(tfParam, DEFAULT_TIMEFRAME)
  const pingTf = resolveTimeframe(pingTfParam, timeframe)
  const lossTf = resolveTimeframe(lossTfParam, timeframe)
  const speedTf = resolveTimeframe(speedTfParam, timeframe)

  const supabase = createServerClient()
  const { data } = await supabase.from('collectors').select('*')
  const collectors: Collector[] = data ?? []
  const locations = [...new Set(collectors.map((c) => c.location))].sort()

  // Fetch initial data server-side so the page renders with content immediately.
  // The client components take over and re-fetch independently when filters change.
  const [initialPingData, initialLossData, initialSpeedData] = await Promise.all([
    fetchPingPayload(location, region, pingTf, collectors),
    fetchPingPayload(location, region, lossTf, collectors),
    fetchSpeedPayload(location, speedTf, collectors),
  ])

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <LocationFilter locations={locations} selected={location} />
          {locations.length > 1 && <span className="mx-1 h-4 w-px bg-white/10" />}
          <RegionFilter selected={region} />
        </div>
        <TimeframeFilter selected={timeframe} clearParams={['pingTf', 'lossTf', 'speedTf']} subParams={['pingTf', 'lossTf', 'speedTf']} />
      </div>

      <TopStatsClient initialPingData={initialPingData} initialSpeedData={initialSpeedData} />
      <PingSectionClient initialData={initialPingData} initialLossData={initialLossData} />
      <SpeedSectionClient initialData={initialSpeedData} />
    </>
  )
}
