import { clsx } from 'clsx'
import { Sparkles } from 'lucide-react'

export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <div className={clsx('flex items-center gap-2.5', className)}>
      <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
        <Sparkles className="size-5 text-white" />
      </span>
      <span
        className={clsx(
          'text-xl font-extrabold tracking-tight',
          light ? 'text-white' : 'text-slate-900'
        )}
      >
        Resume<span className="bg-gradient-to-r from-indigo-500 to-violet-600 bg-clip-text text-transparent">AI</span>
      </span>
    </div>
  )
}
