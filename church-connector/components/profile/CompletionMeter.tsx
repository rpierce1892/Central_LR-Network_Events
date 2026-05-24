interface CompletionMeterProps {
  pct: number
}

export function CompletionMeter({ pct }: CompletionMeterProps) {
  const color = pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-400'

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs text-stone-600">
        <span>Profile completeness</span>
        <span className={pct >= 80 ? 'text-green-600 font-semibold' : 'text-amber-600 font-semibold'}>
          {pct}%
        </span>
      </div>
      <div className="h-2 rounded-full bg-stone-200 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {pct < 80 && (
        <p className="text-xs text-stone-500">
          Reach 80% to appear in guest matches.
        </p>
      )}
    </div>
  )
}
