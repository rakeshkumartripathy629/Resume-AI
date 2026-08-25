import { Link } from 'react-router-dom'
import { ArrowLeft, Hammer } from 'lucide-react'
import { Navbar } from '../components/layout/Navbar'

export function ComingSoonPage({ title }: { title: string }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar authed />
      <main className="mx-auto flex max-w-7xl flex-col items-center px-4 py-28 text-center">
        <span className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-xl shadow-indigo-500/25">
          <Hammer className="size-8 text-white" />
        </span>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-2 max-w-md text-sm text-slate-500">
          This feature is under construction and will be available in an upcoming phase.
        </p>
        <Link
          to="/dashboard"
          className="mt-8 inline-flex h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition-all hover:border-indigo-400 hover:text-indigo-600"
        >
          <ArrowLeft className="size-4" />
          Back to Dashboard
        </Link>
      </main>
    </div>
  )
}
