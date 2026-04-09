'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { TIMEFRAMES } from '@/lib/timeframe'
import type { Timeframe } from '@/lib/timeframe'

interface Props {
  selected: Timeframe
  paramName?: string
  variant?: 'segment' | 'inline'
  clearParams?: string[]
  subParams?: string[]
}

export default function TimeframeFilter({ selected, paramName = 'timeframe', variant = 'segment', clearParams, subParams }: Props) {
  const searchParams = useSearchParams()
  // Read active value from URL directly so it updates immediately on click,
  // falling back to the server-resolved `selected` when param is absent.
  const active = (searchParams.get(paramName) ?? selected) as Timeframe

  // Compute the effective timeframe for each sub-section (explicit override or
  // falls back to the master). If they all agree, show that value as selected
  // in the master; if they diverge, show nothing selected.
  const displayActive = (() => {
    if (!subParams?.length) return active
    const effectives = subParams.map((p) => (searchParams.get(p) ?? active) as Timeframe)
    return effectives.every((v) => v === effectives[0]) ? effectives[0] : null
  })()

  const buildHref = (tf: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set(paramName, tf)
    clearParams?.forEach((p) => params.delete(p))
    return `/?${params.toString()}`
  }

  if (variant === 'segment') {
    return (
      <div className="flex items-center gap-px rounded-lg border border-white/10 bg-zinc-900 p-1">
        {TIMEFRAMES.map((tf) => (
          <Link
            key={tf}
            href={buildHref(tf)}
            replace
            scroll={false}
            prefetch={false}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              displayActive === tf
                ? 'bg-zinc-700 text-white shadow'
                : 'text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-300'
            }`}
          >
            {tf}
          </Link>
        ))}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-0.5">
      {TIMEFRAMES.map((tf) => (
        <Link
          key={tf}
          href={buildHref(tf)}
          replace
          scroll={false}
          prefetch={false}
          className={`rounded px-2 py-0.5 text-xs transition-colors ${
            active === tf
              ? 'bg-zinc-700/80 text-zinc-200'
              : 'text-zinc-600 hover:bg-zinc-800/40 hover:text-zinc-400'
          }`}
        >
          {tf}
        </Link>
      ))}
    </div>
  )
}
