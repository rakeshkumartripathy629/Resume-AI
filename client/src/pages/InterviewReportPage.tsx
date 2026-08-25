import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BadgeCheck,
  CircleAlert,
  Loader2,
  RotateCcw,
  Target,
  Trophy,
} from 'lucide-react'
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { Navbar } from '../components/layout/Navbar'
import { ScoreRing } from '../components/scorer/ScoreRing'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { clearCurrent, fetchInterview } from '../features/interview/interviewSlice'
import type { InterviewReport } from '../types/interview'

const BAND_META: Record<InterviewReport['band'], { label: string; className: string }> = {
  excellent: { label: 'Excellent', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  good: { label: 'Good', className: 'bg-sky-50 text-sky-700 border-sky-200' },
  average: { label: 'Average', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  needs_improvement: {
    label: 'Needs improvement',
    className: 'bg-red-50 text-red-700 border-red-200',
  },
}

export function InterviewReportPage() {
  const { id } = useParams<{ id: string }>()
  const dispatch = useAppDispatch()
  const { current: interview, startStatus } = useAppSelector((state) => state.interview)

  useEffect(() => {
    if (id && (!interview || interview.id !== id)) {
      void dispatch(fetchInterview(id))
    }
  }, [id, interview, dispatch])

  const report = interview?.report ?? null

  if (!interview || !report) {
    return (
      <div className="min-h-screen bg-mesh">
        <Navbar authed />
        <main className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
          <Loader2 className="size-8 animate-spin text-brand-500" />
          <p className="mt-4 text-sm font-semibold text-slate-400">
            {startStatus === 'loading' ? 'Generating your report…' : 'Loading report…'}
          </p>
        </main>
      </div>
    )
  }

  const band = BAND_META[report.band]
  const radarData = Object.entries(report.competencyScores).map(([key, value]) => ({
    competency: key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()),
    score: value,
  }))

  return (
    <div className="min-h-screen bg-mesh">
      <Navbar authed />

      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-400 transition-colors hover:text-slate-700"
        >
          <ArrowLeft className="size-4" /> Back to dashboard
        </Link>

        {/* Header */}
        <div className="mt-4 flex flex-col items-center rounded-3xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-900/5 sm:p-10">
          <span
            title="Mock interview"
            className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25"
          >
            <Trophy className="size-7" />
          </span>
          <h1 className="mt-4 text-center text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Interview report — {interview.role}
          </h1>
          <div className={`mt-3 inline-flex rounded-full border px-3.5 py-1 text-xs font-bold uppercase tracking-wider ${band.className}`}>
            {band.label}
          </div>

          <div className="mt-6">
            <ScoreRing score={report.overallScore} />
          </div>

          <p className="mt-6 max-w-2xl text-center text-[15px] leading-relaxed text-slate-500">
            {report.summary}
          </p>

          <div className="mt-8 grid w-full gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-emerald-700">
                <BadgeCheck className="size-4" /> Strengths
              </h2>
              <ul className="mt-3 space-y-2">
                {report.strengths.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-slate-700">
                    <span className="mt-1 size-1.5 shrink-0 rounded-full bg-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-amber-700">
                <CircleAlert className="size-4" /> Improve these
              </h2>
              <ul className="mt-3 space-y-2">
                {report.improvements.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-slate-700">
                    <span className="mt-1 size-1.5 shrink-0 rounded-full bg-amber-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/interview/new">
              <button
                type="button"
                onClick={() => dispatch(clearCurrent())}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-accent-600 px-6 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:from-brand-700 hover:to-accent-700 hover:brightness-110 active:scale-[0.98]"
              >
                <RotateCcw className="size-4" /> Practice again
              </button>
            </Link>
            <Link to="/scorer">
              <button
                type="button"
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-600 transition-all hover:border-brand-300 hover:text-brand-600 hover:shadow-sm active:scale-[0.98]"
              >
                Score my resume next →
              </button>
            </Link>
          </div>
        </div>

        {/* Competency radar */}
        <section className="mt-8 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
            Competency breakdown
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Each dimension scored 0–100 based on your answers.
          </p>
          <div className="mx-auto mt-4 h-80 w-full max-w-xl">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="72%">
                <PolarGrid stroke="#f1f5f9" />
                <PolarAngleAxis
                  dataKey="competency"
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                />
                <Radar
                  dataKey="score"
                  stroke="#7c3aed"
                  fill="#7c3aed"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Tooltip
                  formatter={(value) => [`${value as number}/100`, 'Score']}
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #f1f5f9',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Skill gap proficiency */}
        {Object.keys(report.skillProficiencies).length > 0 && (
          <section className="mt-8 rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-slate-900">
              <Target className="size-5 text-emerald-600" /> Skill gap proficiency
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Your performance on each targeted skill gap from your roadmap.
            </p>
            <div className="mt-5 space-y-3">
              {Object.entries(report.skillProficiencies)
                .sort(([, a], [, b]) => b - a)
                .map(([skill, score]) => {
                  const pct = Math.min(100, Math.max(0, Math.round(score)))
                  const color =
                    pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'
                  return (
                    <div key={skill}>
                      <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                        <span>{skill}</span>
                        <span className="tabular-nums text-slate-500">{pct}%</span>
                      </div>
                      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${color}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
