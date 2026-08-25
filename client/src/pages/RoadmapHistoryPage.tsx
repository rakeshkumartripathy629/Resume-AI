import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Route, Calendar, Loader2, Layers, RefreshCw } from 'lucide-react'
import { Navbar } from '../components/layout/Navbar'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { fetchRoadmaps } from '../features/roadmap/roadmapSlice'

const LEVEL_META: Record<string, { label: string; className: string }> = {
  beginner: { label: 'Beginner', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  intermediate: { label: 'Intermediate', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  advanced: { label: 'Advanced', className: 'bg-red-50 text-red-700 border-red-200' },
}

export function RoadmapHistoryPage() {
  const dispatch = useAppDispatch()
  const { history, historyStatus } = useAppSelector((state) => state.roadmap)

  useEffect(() => {
    if (historyStatus === 'idle') {
      void dispatch(fetchRoadmaps())
    }
  }, [dispatch, historyStatus])

  return (
    <div className="min-h-screen bg-mesh">
      <Navbar authed />

      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-400 transition-colors hover:text-slate-700"
        >
          <ArrowLeft className="size-4" /> Dashboard
        </Link>

        <div className="mt-4 flex items-center justify-between">
          <div className="animate-fade-in">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-brand-600">
              <Route className="size-4" />
              Roadmap history
            </div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
              Career roadmaps
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              {history.length} roadmap{history.length !== 1 ? 's' : ''} generated
            </p>
          </div>
          <button
            type="button"
            onClick={() => void dispatch(fetchRoadmaps())}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition-all hover:border-brand-300 hover:text-brand-600 hover:shadow-sm"
          >
            <RefreshCw className="size-3.5" /> Refresh
          </button>
        </div>

        {historyStatus === 'loading' && history.length === 0 && (
          <div className="mt-16 flex flex-col items-center">
            <Loader2 className="size-8 animate-spin text-brand-500" />
            <p className="mt-4 text-sm font-semibold text-slate-400">Loading roadmaps…</p>
          </div>
        )}

        {historyStatus === 'failed' && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm font-medium text-red-700">
            Failed to load roadmaps.
          </div>
        )}

        {historyStatus !== 'loading' && history.length === 0 && (
          <div className="mt-16 rounded-3xl border border-slate-100 bg-white p-10 text-center shadow-sm">
            <Route className="mx-auto size-10 text-slate-300" />
            <p className="mt-4 text-sm font-semibold text-slate-500">No roadmaps yet</p>
            <p className="mt-1 text-xs text-slate-400">
              Generate your first career roadmap to see it here.
            </p>
            <Link
              to="/roadmaps"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:from-brand-700 hover:to-accent-700 hover:brightness-110"
            >
              Generate roadmap
            </Link>
          </div>
        )}

        <div className="mt-6 space-y-3">
          {history.map((item) => {
            const level = LEVEL_META[item.experienceLevel] ?? LEVEL_META.intermediate
            return (
              <div
                key={item.id}
                className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-md shadow-violet-500/20">
                  <Layers className="size-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">
                    {item.targetRole}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${level.className}`}
                    >
                      {level.label}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                      {item.phaseCount} phases
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Calendar className="size-3" />
                      {new Date(item.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
