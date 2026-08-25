import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  BadgeCheck,
  CircleAlert,
  ClipboardList,
  RotateCcw,
  TrendingUp,
  Sparkles,
} from 'lucide-react'
import { Button } from '../ui/Button'
import { ScoreRing } from './ScoreRing'
import { ScoreBar } from './ScoreBar'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { backToEditor, resetScorer } from '../../features/scorer/scorerSlice'
import { VERDICT_META, type Verdict } from '../../types/scoring'

export function ScoreResultView() {
  const dispatch = useAppDispatch()
  const { result } = useAppSelector((state) => state.scorer)

  if (!result) return null

  const verdict = VERDICT_META[result.verdict as Verdict] ?? VERDICT_META.needs_work

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <button
          type="button"
          onClick={() => dispatch(backToEditor())}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-400 transition-colors hover:text-brand-600"
        >
          <ArrowLeft className="size-4" />
          Edit inputs
        </button>
      </div>

      {/* Overall card */}
      <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-lg shadow-slate-900/5">
        <div className="bg-mesh relative flex flex-col items-center gap-8 p-8 sm:flex-row sm:p-10">
          <ScoreRing score={result.overallScore} />
          <div className="flex-1 text-center sm:text-left">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${verdict.classes}`}
            >
              <BadgeCheck className="size-3.5" />
              {verdict.label}
            </span>
            <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900">
              Your resume scorecard
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">{result.summary}</p>
          </div>
        </div>

        {/* Category bars */}
        <div className="grid gap-x-10 gap-y-5 border-t border-slate-100 bg-slate-50/60 p-8 sm:grid-cols-2 sm:p-10">
          <ScoreBar label="Keyword match" score={result.categoryScores.keywordMatch} />
          <ScoreBar label="Skills relevance" score={result.categoryScores.skillsRelevance} />
          <ScoreBar label="Experience impact" score={result.categoryScores.experienceImpact} />
          <ScoreBar label="Formatting & clarity" score={result.categoryScores.formattingClarity} />
        </div>
      </div>

      {/* Strengths + Improvements */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-100 bg-white p-7 shadow-sm">
          <h3 className="flex items-center gap-2 font-bold text-slate-900">
            <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-50">
              <BadgeCheck className="size-4.5 text-emerald-600" />
            </span>
            Strengths
          </h3>
          <ul className="mt-4 space-y-3">
            {result.strengths.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-slate-600">
                <BadgeCheck className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-7 shadow-sm">
          <h3 className="flex items-center gap-2 font-bold text-slate-900">
            <span className="flex size-8 items-center justify-center rounded-xl bg-brand-50">
              <TrendingUp className="size-4.5 text-brand-600" />
            </span>
            Prioritized improvements
          </h3>
          <ol className="mt-4 space-y-3">
            {result.improvements.map((item, index) => (
              <li key={item} className="flex items-start gap-3 text-sm text-slate-600">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-700">
                  {index + 1}
                </span>
                {item}
              </li>
            ))}
          </ol>
        </section>
      </div>

      {/* Missing keywords */}
      {result.missingKeywords.length > 0 && (
        <section className="mt-6 rounded-2xl border border-slate-100 bg-white p-7 shadow-sm">
          <h3 className="flex items-center gap-2 font-bold text-slate-900">
            <span className="flex size-8 items-center justify-center rounded-xl bg-amber-50">
              <ClipboardList className="size-4.5 text-amber-600" />
            </span>
            Missing keywords
          </h3>
          <p className="mt-1.5 text-xs text-slate-400">
            Consider working these naturally into your resume if you have relevant experience.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {result.missingKeywords.map((keyword) => (
              <span
                key={keyword}
                className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/80 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700"
              >
                <CircleAlert className="size-3.5" />
                {keyword}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Actions */}
      <div className="mt-8 flex flex-col justify-between gap-3 sm:flex-row">
        <Button variant="outline" onClick={() => dispatch(resetScorer())}>
          <RotateCcw className="size-4" />
          Score another resume
        </Button>
        <div className="flex gap-2">
          <Link to="/tailor">
            <Button variant="accent">
              <Sparkles className="size-4" />
              Create ATS-Optimized Resume
            </Button>
          </Link>
          <Link to="/builder">
            <Button>Improve it in the Builder</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
