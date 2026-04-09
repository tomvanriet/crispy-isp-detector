'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { TIMEFRAMES } from '@/lib/timeframe'
import type { Timeframe } from '@/lib/timeframe'

interface Props {
  selected: Timeframe
}

export default function TimeframeFilter({ selected }: Props) {
  const searchParams = useSearchParams()

  const buildHref = (tf: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('timeframe', tf)
    return `/?${params.toString()}`
  }

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {TIMEFRAMES.map((tf) => (
        <Link
          key={tf}
          href={buildHref(tf)}
          className={`rounded-full border px-3 py-1 text-xs transition-colors ${
            selected === tf
              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
              : 'border-white/10 bg-white/5 text-zinc-400 hover:border-white/20 hover:text-zinc-300'
          }`}
        >
          {tf}
        </Link>
      ))}
    </div>
  )
}
