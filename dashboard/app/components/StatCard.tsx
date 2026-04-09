interface StatCardProps {
  label: string
  value: string
  sub?: string
  color?: 'green' | 'blue' | 'yellow' | 'red'
}

const colorMap = {
  green: 'text-emerald-400',
  blue: 'text-sky-400',
  yellow: 'text-amber-400',
  red: 'text-rose-400',
}

export default function StatCard({ label, value, sub, color = 'blue' }: StatCardProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className={`mt-1 text-3xl font-semibold tabular-nums ${colorMap[color]}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-zinc-500">{sub}</p>}
    </div>
  )
}
