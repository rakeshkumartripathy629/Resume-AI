import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, FileSearch, Calendar, Loader2, Building2, RefreshCw, Zap } from 'lucide-react'
import { Navbar } from '../components/layout/Navbar'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { fetchTailors } from '../features/tailor/tailorSlice'

export function TailorHistoryPage() {
  const dispatch = useAppDispatch()
  const { history, historyTotal, historyPage, historyPages, historyStatus } = useAppSelector(
    (state) => state.tailor
  )

  useEffect(() => {
    if (historyStatus === 'idle') {
      void dispatch(fetchTailors({ page: 1, limit: 10 }))
    }
  }, [dispatch, historyStatus])

  function loadMore() {
    if (historyPage < historyPages) {
      void dispatch(fetchTailors({ page: historyPage + 1, limit: 10 }))
    }
  }

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
              <FileSearch className="size-4" />
              Tailoring history
            </div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
              Tailored resumes
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              {historyTotal} tailoring{historyTotal !== 1 ? 's' : ''} total
            </p>
          </div>
          <button
            type="button"
            onClick={() => void dispatch(fetchTailors({ page: 1, limit: 10 }))}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition-all hover:border-brand-300 hover:text-brand-600 hover:shadow-sm"
          >
            <RefreshCw className="size-3.5" /> Refresh
          </button>
        </div>

        {historyStatus === 'loading' && history.length === 0 && (
          <div className="mt-16 flex flex-col items-center">
            <Loader2 className="size-8 animate-spin text-brand-500" />
            <p className="mt-4 text-sm font-semibold text-slate-400">Loading tailored resumes…</p>
          </div>
        )}

        {historyStatus === 'failed' && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm font-medium text-red-700">
            Failed to load tailoring history.
          </div>
        )}

        {historyStatus !== 'loading' && history.length === 0 && (
          <div className="mt-16 rounded-3xl border border-slate-100 bg-white p-10 text-center shadow-sm">
            <FileSearch className="mx-auto size-10 text-slate-300" />
            <p className="mt-4 text-sm font-semibold text-slate-500">No tailored resumes yet</p>
            <p className="mt-1 text-xs text-slate-400">
              Tailor your first resume to see history here.
            </p>
            <Link
              to="/scorer"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:from-brand-700 hover:to-accent-700 hover:brightness-110"
            >
              Tailor a resume
            </Link>
          </div>
        )}

        <div className="mt-6 space-y-3">
          {history.map((item) => {
            const scoreColor =
              item.atsScore >= 80
                ? 'from-emerald-500 to-emerald-600'
                : item.atsScore >= 60
                  ? 'from-amber-500 to-amber-600'
                  : 'from-red-500 to-red-600'
            return (
              <div
                key={item.id}
                className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md"
              >
                <div
                  className={`flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${scoreColor} text-white shadow-md`}
                >
                  <span className="text-lg font-extrabold">{item.atsScore}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">
                    {item.jobTitle || 'Untitled'}
                  </p>
                  {item.company && (
                    <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-500">
                      <Building2 className="size-3" /> {item.company}
                    </p>
                  )}
                  <div className="mt-1.5 flex items-center gap-3">
                    <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                      <Zap className="size-3" /> {item.keywordCount} keywords
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

        {historyPage < historyPages && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={loadMore}
              disabled={historyStatus === 'loading'}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:border-brand-300 hover:text-brand-600 hover:shadow-sm disabled:opacity-50"
            >
              {historyStatus === 'loading' ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                'Load more'
              )}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
