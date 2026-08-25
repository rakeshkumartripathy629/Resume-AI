import { ArrowLeft, Hammer } from 'lucide-react'
import { Link } from 'react-router-dom'

export function ComingSoonPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-mesh px-4 text-center">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 shadow-glow-brand">
        <Hammer className="size-8" />
      </span>
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900">
        Coming soon
      </h1>
      <p className="mt-2 max-w-sm text-sm text-slate-400">
        This feature is under construction. We&apos;ll have it ready for you soon.
      </p>
      <Link
        to="/dashboard"
        className="mt-8 inline-flex h-11 items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-accent-600 px-6 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:from-brand-700 hover:to-accent-700 active:scale-[0.98]"
      >
        <ArrowLeft className="size-4" /> Back to dashboard
      </Link>
    </div>
  )
}
