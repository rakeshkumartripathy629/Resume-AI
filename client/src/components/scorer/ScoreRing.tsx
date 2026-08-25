import { useEffect, useState } from 'react'

export function ScoreRing({ score }: { score: number }) {
  const [displayed, setDisplayed] = useState(0)
  const size = 180
  const stroke = 14
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius

  useEffect(() => {
    const timer = setTimeout(() => setDisplayed(score), 100)
    return () => clearTimeout(timer)
  }, [score])

  const offset = circumference - (displayed / 100) * circumference
  const color =
    score >= 80 ? '#059669' : score >= 65 ? '#65a30d' : score >= 45 ? '#d97706' : '#dc2626'

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1), stroke 0.4s' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-5xl font-extrabold tracking-tight text-slate-900">{score}</span>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">/ 100</span>
      </div>
    </div>
  )
}
