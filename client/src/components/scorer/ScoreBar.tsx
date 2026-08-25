import { useEffect, useState } from 'react'

export function ScoreBar({ label, score }: { label: string; score: number }) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setWidth(score), 150)
    return () => clearTimeout(timer)
  }, [score])

  const barColor =
    score >= 80
      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
      : score >= 65
        ? 'bg-gradient-to-r from-lime-500 to-lime-600'
        : score >= 45
          ? 'bg-gradient-to-r from-amber-400 to-amber-500'
          : 'bg-gradient-to-r from-red-400 to-red-500'

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        <span className="text-sm font-extrabold tabular-nums text-slate-900">{score}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${barColor}`}
          style={{ width: `${width}%`, transition: 'width 1s cubic-bezier(0.22,1,0.36,1)' }}
        />
      </div>
    </div>
  )
}
