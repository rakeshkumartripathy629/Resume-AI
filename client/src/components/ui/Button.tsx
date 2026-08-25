import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { clsx } from 'clsx'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'accent' | 'secondary' | 'outline' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-brand-600 to-accent-600 text-white shadow-lg shadow-brand-500/25 hover:from-brand-700 hover:to-accent-700 hover:shadow-brand-500/35 hover:brightness-110 focus-visible:ring-brand-500',
  accent:
    'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-700 hover:shadow-emerald-500/35 hover:brightness-110 focus-visible:ring-emerald-500',
  secondary:
    'bg-slate-900 text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800 focus-visible:ring-slate-500',
  outline:
    'border border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:text-brand-600 hover:shadow-md focus-visible:ring-brand-500',
  ghost: 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 focus-visible:ring-slate-400',
  danger:
    'bg-red-600 text-white shadow-lg shadow-red-500/25 hover:bg-red-700 focus-visible:ring-red-500',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-sm gap-1.5 rounded-lg',
  md: 'h-11 px-5 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-7 text-sm gap-2.5 rounded-xl',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', loading = false, disabled, children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  )
})
