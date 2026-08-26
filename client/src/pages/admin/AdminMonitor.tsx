import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { fetchAdminScores, fetchAdminTailors, fetchAdminInterviews, fetchAdminRoadmaps } from '../../features/admin/adminSlice'
import { Loader2, ChevronLeft, ChevronRight, FileText, Sparkles, Mic, Map } from 'lucide-react'

function formatDate(d: string) { return d ? new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' }) : '—' }

type Tab = 'scores' | 'tailors' | 'interviews' | 'roadmaps'

const tabs: Array<{ key: Tab; label: string; icon: typeof FileText }> = [
  { key: 'scores', label: 'Scores', icon: FileText },
  { key: 'tailors', label: 'Tailors', icon: Sparkles },
  { key: 'interviews', label: 'Interviews', icon: Mic },
  { key: 'roadmaps', label: 'Roadmaps', icon: Map },
]

export default function AdminMonitor() {
  const dispatch = useAppDispatch()
  const { scores, scoresPagination, tailors, tailorsPagination, interviews, interviewsPagination, roadmaps, roadmapsPagination, loading, error } = useAppSelector((s) => s.admin)
  const [activeTab, setActiveTab] = useState<Tab>('scores')
  const [page, setPage] = useState(1)

  useEffect(() => {
    setPage(1)
  }, [activeTab])

  useEffect(() => {
    if (activeTab === 'scores') void dispatch(fetchAdminScores({ page, limit: 20 }))
    if (activeTab === 'tailors') void dispatch(fetchAdminTailors({ page, limit: 20 }))
    if (activeTab === 'interviews') void dispatch(fetchAdminInterviews({ page, limit: 20 }))
    if (activeTab === 'roadmaps') void dispatch(fetchAdminRoadmaps({ page, limit: 20 }))
  }, [dispatch, activeTab, page])

  const pagination = activeTab === 'scores' ? scoresPagination : activeTab === 'tailors' ? tailorsPagination : activeTab === 'interviews' ? interviewsPagination : roadmapsPagination
  const items = activeTab === 'scores' ? scores : activeTab === 'tailors' ? tailors : activeTab === 'interviews' ? interviews : roadmaps

  return (
    <div className="space-y-4">
      <div className="flex gap-2 rounded-2xl border border-slate-200/80 bg-white/60 p-1 shadow-sm backdrop-blur-sm">
        {tabs.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                activeTab === t.key
                  ? 'bg-gradient-to-r from-brand-600 to-accent-600 text-white shadow-md shadow-brand-500/20'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}
            >
              <Icon className="size-4" />
              {t.label}
            </button>
          )
        })}
      </div>

      {loading && (
        <div className="flex min-h-[200px] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-brand-500" />
        </div>
      )}

      {!loading && error && (
        <div className="glass rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-sm font-medium text-red-600">{error}</div>
      )}

      {!loading && !error && activeTab === 'scores' && (
        <div className="glass overflow-hidden rounded-2xl border border-slate-100/80 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500">User</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500">Job Title</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500">Company</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500">Score</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500">Verdict</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {scores.map((s) => (
                  <tr key={s.id} className="border-b border-slate-50 transition-colors hover:bg-brand-50/30">
                    <td className="px-4 py-3 font-semibold text-slate-800">{s.userEmail}</td>
                    <td className="px-4 py-3 text-slate-700">{s.jobTitle}</td>
                    <td className="px-4 py-3 text-slate-700">{s.company}</td>
                    <td className="px-4 py-3 font-bold text-brand-600">{s.overallScore}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        s.overallScore >= 80 ? 'bg-emerald-100 text-emerald-700' : s.overallScore >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'
                      }`}>
                        {s.verdict}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(s.createdAt)}</td>
                  </tr>
                ))}
                {scores.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-sm font-medium text-slate-400">No scores yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && !error && activeTab === 'tailors' && (
        <div className="glass overflow-hidden rounded-2xl border border-slate-100/80 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500">User</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500">Job Title</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500">Company</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500">ATS Score</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500">Keywords</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {tailors.map((t) => (
                  <tr key={t.id} className="border-b border-slate-50 transition-colors hover:bg-brand-50/30">
                    <td className="px-4 py-3 font-semibold text-slate-800">{t.userEmail}</td>
                    <td className="px-4 py-3 text-slate-700">{t.jobTitle}</td>
                    <td className="px-4 py-3 text-slate-700">{t.company}</td>
                    <td className="px-4 py-3 font-bold text-brand-600">{t.atsScore}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-600">{t.keywordCount}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(t.createdAt)}</td>
                  </tr>
                ))}
                {tailors.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-sm font-medium text-slate-400">No tailored resumes yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && !error && activeTab === 'interviews' && (
        <div className="glass overflow-hidden rounded-2xl border border-slate-100/80 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500">User</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500">Role</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500">Difficulty</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500">Status</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500">Score</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {interviews.map((i) => (
                  <tr key={i.id} className="border-b border-slate-50 transition-colors hover:bg-brand-50/30">
                    <td className="px-4 py-3 font-semibold text-slate-800">{i.userEmail}</td>
                    <td className="px-4 py-3 text-slate-700">{i.role}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        i.difficulty === 'hard' ? 'bg-red-100 text-red-600' : i.difficulty === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>{i.difficulty}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        i.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}>{i.status}</span>
                    </td>
                    <td className="px-4 py-3 font-bold text-brand-600">{i.overallScore ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(i.createdAt)}</td>
                  </tr>
                ))}
                {interviews.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-sm font-medium text-slate-400">No interviews yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && !error && activeTab === 'roadmaps' && (
        <div className="glass overflow-hidden rounded-2xl border border-slate-100/80 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500">User</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500">Target Role</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500">Level</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500">Phases</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {roadmaps.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 transition-colors hover:bg-brand-50/30">
                    <td className="px-4 py-3 font-semibold text-slate-800">{r.userEmail}</td>
                    <td className="px-4 py-3 text-slate-700">{r.targetRole}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-700">{r.experienceLevel}</span>
                    </td>
                    <td className="px-4 py-3 font-bold text-brand-600">{r.phaseCount}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(r.createdAt)}</td>
                  </tr>
                ))}
                {roadmaps.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-sm font-medium text-slate-400">No roadmaps yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-slate-500">
            Page {pagination.page} of {pagination.pages} · {pagination.total} records
          </p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="glass rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40">
              <ChevronLeft className="size-4" />
            </button>
            <button disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)} className="glass rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40">
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
