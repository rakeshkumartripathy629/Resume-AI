import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import type { ATSAnalysis, ATSBreakdown } from '../../types/tailor'

function BreakdownBar({ label, score }: { label: string; score: number }) {
  const color =
    score >= 80
      ? 'bg-emerald-500'
      : score >= 60
        ? 'bg-amber-500'
        : 'bg-red-500'
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-medium text-slate-600">
        <span>{label}</span>
        <span>{score}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}

const BREAKDOWN_LABELS: Record<keyof ATSBreakdown, string> = {
  keywordMatch: 'Keyword Match',
  requiredSkills: 'Required Skills',
  preferredSkills: 'Preferred Skills',
  experienceRelevance: 'Experience Relevance',
  jobTitleAlignment: 'Job Title Alignment',
  achievementRelevance: 'Achievement Relevance',
  atsFormatting: 'ATS Formatting',
  resumeCompleteness: 'Resume Completeness',
}

function ScoreRing({ score }: { score: number }) {
  const r = 54
  const c = 2 * Math.PI * r
  const offset = c - (score / 100) * c
  const color =
    score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'
  return (
    <div className="relative size-32">
      <svg className="size-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold text-slate-900">{score}</span>
        <span className="text-[10px] font-semibold text-slate-400">ATS SCORE</span>
      </div>
    </div>
  )
}

interface ATSScoreCardProps {
  analysis: ATSAnalysis
}

export function ATSScoreCard({ analysis }: ATSScoreCardProps) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-bold text-slate-900">ATS Compatibility Analysis</h3>
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <ScoreRing score={analysis.overallScore} />
        <div className="flex-1 space-y-2 w-full">
          {Object.entries(BREAKDOWN_LABELS).map(([key, label]) => (
            <BreakdownBar
              key={key}
              label={label}
              score={analysis.breakdown[key as keyof ATSBreakdown]}
            />
          ))}
        </div>
      </div>

      {/* Matched keywords */}
      {analysis.matchedKeywords.length > 0 && (
        <div className="mt-5">
          <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-emerald-700">
            <TrendingUp className="size-3.5" />
            Matched Keywords
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {analysis.matchedKeywords.map((kw) => (
              <span
                key={kw}
                className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Missing keywords */}
      {analysis.missingKeywords.length > 0 && (
        <div className="mt-4">
          <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-amber-700">
            <AlertTriangle className="size-3.5" />
            Missing Keywords
          </h4>
          <div className="space-y-2">
            {analysis.missingKeywords.map((item) => (
              <div
                key={item.keyword}
                className="rounded-lg border border-amber-200/60 bg-amber-50/50 px-3 py-2"
              >
                <span className="text-xs font-bold text-amber-700">{item.keyword}</span>
                <p className="mt-0.5 text-[11px] text-amber-600/80">{item.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {analysis.recommendations.length > 0 && (
        <div className="mt-5">
          <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-brand-700">
            <TrendingDown className="size-3.5" />
            Recommendations
          </h4>
          <ol className="space-y-1.5">
            {analysis.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700">
                  {i + 1}
                </span>
                {rec}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
