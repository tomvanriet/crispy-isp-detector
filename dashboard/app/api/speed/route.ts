import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { fetchSpeedPayload } from '@/lib/data'
import { TIMEFRAMES } from '@/lib/timeframe'
import type { Timeframe } from '@/lib/timeframe'
import type { Collector } from '@/lib/types'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const location = searchParams.get('location') || undefined
  const tfParam = searchParams.get('timeframe')
  const timeframe: Timeframe = TIMEFRAMES.some((tf) => tf === tfParam) ? (tfParam as Timeframe) : '24h'

  const supabase = createServerClient()

  // Only fetch collectors when filtering by location — otherwise unused.
  const collectors: Collector[] = location
    ? ((await supabase.from('collectors').select('*')).data ?? [])
    : []

  const payload = await fetchSpeedPayload(location, timeframe, collectors)

  return NextResponse.json(payload, {
    headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=60' },
  })
}
