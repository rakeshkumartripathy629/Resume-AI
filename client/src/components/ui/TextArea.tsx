import type { ReactNode } from 'react'

export function TextAreaCard({
  icon,
  title,
  placeholder,
  value,
  onChange,
  minChars,
  rows = 14,
  disabled,
}: {
  icon: ReactNode
  title: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  minChars: number
  rows?: number
  disabled?: boolean
}) {
  const ok = value.trim().length >= minChars

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 focus-within:border-brand-300 focus-within:shadow-glow-brand focus-within:ring-2 focus-within:ring-brand-100">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <span className="flex size-7 items-center justify-center rounded-lg bg-brand-50 text-brand-500">
            {icon}
          </span>
          {title}
        </h3>
        <span className={`text-xs font-semibold tabular-nums ${ok ? 'text-emerald-600' : 'text-slate-400'}`}>
          {value.length.toLocaleString()} chars
        </span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className="w-full resize-y rounded-lg border border-transparent bg-transparent p-1 text-sm leading-relaxed text-slate-700 placeholder:text-slate-300 focus:outline-none"
      />
      <p className={`mt-2 text-xs font-medium ${ok ? 'text-emerald-600' : 'text-slate-400'}`}>
        {ok ? 'Looks good ✓' : `Minimum ${minChars} characters`}
      </p>
    </div>
  )
}
