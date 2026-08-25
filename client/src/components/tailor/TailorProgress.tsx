import { useEffect, useState } from 'react'
import { Loader2, CheckCircle2 } from 'lucide-react'

const STEPS = [
  'Extracting job requirements',
  'Analyzing resume match',
  'Generating tailored resume & ATS analysis',
]

export function TailorProgress() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => Math.min(prev + 1, STEPS.length - 1))
    }, 15_000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex flex-col items-center gap-6 py-16">
      <div className="relative">
        <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-br from-brand-400/30 to-accent-400/30 blur-2xl" />
        <Loader2 className="relative size-12 animate-spin text-brand-600" />
      </div>
      <h3 className="text-xl font-bold text-slate-900">Tailoring your resume</h3>
      <p className="text-sm text-slate-500">
        Our AI is optimizing your resume for this specific role...
      </p>
      <div className="w-full max-w-xs space-y-3">
        {STEPS.map((step, i) => (
          <div
            key={step}
            className={`flex items-center gap-3 text-sm transition-all duration-500 ${
              i < current
                ? 'text-emerald-600'
                : i === current
                  ? 'text-brand-600 font-semibold'
                  : 'text-slate-300'
            }`}
          >
            {i < current ? (
              <CheckCircle2 className="size-4 shrink-0" />
            ) : i === current ? (
              <Loader2 className="size-4 shrink-0 animate-spin" />
            ) : (
              <div className="size-4 shrink-0 rounded-full border-2 border-slate-200" />
            )}
            {step}
          </div>
        ))}
      </div>
    </div>
  )
}
