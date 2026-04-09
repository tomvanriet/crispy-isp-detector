'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

const REGIONS = ['All', 'Africa', 'Global', 'Europe', 'North America', 'South America', 'Asia', 'Oceania']

interface Props {
  selected: string
}

export default function RegionFilter({ selected }: Props) {
  const searchParams = useSearchParams()
  // Read from URL directly for immediate active state update on click.
  // Falls back to server-resolved `selected` when the param is absent.
  const active = searchParams.get('region') ?? selected

  const buildHref = (region: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('region', region === 'All' ? 'all' : region)
    return `/?${params.toString()}`
  }

  return (
    <div className="flex flex-wrap gap-2">
      {REGIONS.map((r) => {
        const isActive = r === 'All' ? active === 'all' : active === r
        return (
          <Link
            key={r}
            href={buildHref(r)}
            replace
            scroll={false}
            prefetch={false}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              isActive
                ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                : 'border-white/10 bg-white/5 text-zinc-400 hover:border-white/20 hover:text-zinc-300'
            }`}
          >
            {r}
          </Link>
        )
      })}
    </div>
  )
}
