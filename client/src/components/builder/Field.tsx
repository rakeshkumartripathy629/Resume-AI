import { clsx } from 'clsx'
import { forwardRef, type InputHTMLAttributes } from 'react'

export const fieldClasses =
  'h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors hover:border-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50 disabled:text-slate-400'

export const FieldInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function FieldInput({ className, ...props }, ref) {
    return <input ref={ref} className={clsx(fieldClasses, className)} {...props} />
  }
)

export function Field({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <label className={clsx('block', className)}>
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </span>
      {children}
    </label>
  )
}
