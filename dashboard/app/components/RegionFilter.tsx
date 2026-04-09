'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

const REGIONS = ['All', 'Africa', 'Global', 'Europe', 'North America', 'South America', 'Asia', 'Oceania']

interface Props {
  selected: string
}

export default function RegionFilter({ selected }: Props) {
  const searchParams = useSearchParams()

  const buildHref = (region: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (region === 'All') {
      params.delete('region')
      params.set('region', 'all')
    } else {
      params.set('region', region)
    }
    return `/?${params.toString()}`
  }

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {REGIONS.map((r) => {
        const isActive = r === 'All' ? selected === 'all' : selected === r
        return (
          <Link
            key={r}
            href={buildHref(r)}
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
