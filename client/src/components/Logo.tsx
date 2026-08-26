import { clsx } from 'clsx'

export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <div className={clsx('flex items-center gap-2.5', className)}>
      <img
        src="/logo.png"
        alt="ResumeAI Logo"
        className="size-9 rounded-xl object-contain shadow-glow-brand"
      />
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
