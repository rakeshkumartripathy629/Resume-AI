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

  const colorGradient =
    score >= 80
      ? ['#059669', '#10b981']
      : score >= 65
        ? ['#65a30d', '#84cc16']
        : score >= 45
          ? ['#d97706', '#f59e0b']
          : ['#dc2626', '#ef4444']
  const gradientId = `score-ring-${score}`

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colorGradient[0]} />
            <stop offset="100%" stopColor={colorGradient[1]} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.22,1,0.36,1)' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-5xl font-extrabold tracking-tight text-slate-900">{score}</span>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">/ 100</span>
      </div>
    </div>
  )
}
