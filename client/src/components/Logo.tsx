import { clsx } from 'clsx'
import { Sparkles } from 'lucide-react'

export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <div className={clsx('flex items-center gap-2.5', className)}>
      <span className="relative flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 via-accent-500 to-brand-600 shadow-glow-brand">
        <Sparkles className="size-5 text-white" />
      </span>
      <span
        className={clsx(
          'text-xl font-extrabold tracking-tight',
          light ? 'text-white' : 'text-slate-900'
        )}
      >
        Resume<span className="text-gradient-brand">AI</span>
      </span>
    </div>
  )
}
