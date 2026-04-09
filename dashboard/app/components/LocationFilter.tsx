'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

interface Props {
  locations: string[]
  selected?: string
}

export default function LocationFilter({ locations, selected }: Props) {
  const searchParams = useSearchParams()

  if (locations.length <= 1) return null

  const buildHref = (location: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (location) {
      params.set('location', location)
    } else {
      params.delete('location')
    }
    const str = params.toString()
    return str ? `/?${str}` : '/'
  }

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      <Link
        href={buildHref(null)}
        className={`rounded-full border px-3 py-1 text-xs transition-colors ${
          !selected
            ? 'border-sky-500 bg-sky-500/10 text-sky-400'
            : 'border-white/10 bg-white/5 text-zinc-400 hover:border-white/20 hover:text-zinc-300'
        }`}
      >
        All
      </Link>
      {locations.map((loc) => (
        <Link
          key={loc}
          href={buildHref(loc)}
          className={`rounded-full border px-3 py-1 text-xs transition-colors ${
            selected === loc
              ? 'border-sky-500 bg-sky-500/10 text-sky-400'
              : 'border-white/10 bg-white/5 text-zinc-400 hover:border-white/20 hover:text-zinc-300'
          }`}
        >
          {loc}
        </Link>
      ))}
    </div>
  )
}
