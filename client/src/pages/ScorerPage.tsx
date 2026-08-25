import { useState, type FormEvent } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  FileSearch,
  FileText,
} from 'lucide-react'
import { Navbar } from '../components/layout/Navbar'
import { Button } from '../components/ui/Button'
import { ScoreResultView } from '../components/scorer/ScoreResultView'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { scoreResume, setJobDescription, setResumeText } from '../features/scorer/scorerSlice'

const MIN_RESUME = 80
const MIN_JD = 40

export function ScorerPage() {
  const dispatch = useAppDispatch()
  const { resumeText, jobDescription, status, result, error } = useAppSelector(
    (state) => state.scorer
  )
  const [localError, setLocalError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent): void {
    event.preventDefault()
    setLocalError(null)
    if (resumeText.trim().length < MIN_RESUME) {
      setLocalError(`Resume needs at least ${MIN_RESUME} characters.`)
      return
    }
    if (jobDescription.trim().length < MIN_JD) {
      setLocalError(`Job description needs at least ${MIN_JD} characters.`)
      return
    }
    void dispatch(
      scoreResume({ resumeText: resumeText.trim(), jobDescription: jobDescription.trim() })
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar authed />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        {/* Stepper */}
        <div className="mb-8 flex items-center gap-3">
          <StepBadge active={!result} done={Boolean(result)} n={1} label="Inputs" />
          <span className={`h-0.5 flex-1 rounded ${result ? 'bg-indigo-500' : 'bg-slate-200'}`} />
          <StepBadge active={status === 'loading'} done={Boolean(result)} n={2} label="Results" />
        </div>

        {!result ? (
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <h1 className="flex items-center gap-3 text-3xl font-extrabold tracking-tight text-slate-900">
                <span className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg shadow-indigo-500/25">
                  <FileSearch className="size-6 text-white" />
                </span>
                Resume Scorer
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Paste your resume and the job description — AI does the rest.
              </p>
            </div>

            {(localError || error) && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                <AlertTriangle className="mt-0.5 size-5 shrink-0" />
                {localError ?? error}
              </div>
            )}

            <div className="grid gap-5 lg:grid-cols-2">
              <TextAreaCard
                icon={<FileText className="size-4" />}
                title="Your resume"
                placeholder={'Paste your full resume text here…\n\ne.g.\nJohn Doe\nSenior Frontend Engineer\n…'}
                value={resumeText}
                onChange={(v) => dispatch(setResumeText(v))}
                minChars={MIN_RESUME}
                disabled={status === 'loading'}
              />
              <TextAreaCard
                icon={<BriefcaseBusiness className="size-4" />}
                title="Job description"
                placeholder={"Paste the job posting you're targeting…\n\ne.g.\nSenior Frontend Engineer at Acme Corp\nWe're looking for…"}
                value={jobDescription}
                onChange={(v) => dispatch(setJobDescription(v))}
                minChars={MIN_JD}
                disabled={status === 'loading'}
              />
            </div>

            <div className="mt-8 flex flex-col items-center gap-3">
              <Button
                type="submit"
                size="lg"
                loading={status === 'loading'}
                disabled={status === 'loading'}
                className="w-full sm:w-auto sm:min-w-64"
              >
                {status !== 'loading' && (
                  <>
                    Score my resume
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
              {status === 'loading' && (
                <p className="animate-pulse text-sm font-semibold text-indigo-600">
                  Extracting requirements → matching keywords → generating scorecard…
                </p>
              )}
            </div>
          </form>
        ) : (
          <ScoreResultView />
        )}
      </main>
    </div>
  )
}

function StepBadge({
  active,
  done,
  n,
  label,
}: {
  active: boolean
  done: boolean
  n: number
  label: string
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`flex size-7 items-center justify-center rounded-full text-xs font-bold ${
          done
            ? 'bg-emerald-500 text-white'
            : active
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
              : 'bg-slate-200 text-slate-500'
        }`}
      >
        {done ? '✓' : n}
      </span>
      <span
        className={`text-xs font-bold uppercase tracking-wider ${
          done || active ? 'text-slate-700' : 'text-slate-400'
        }`}
      >
        {label}
      </span>
    </div>
  )
}

function TextAreaCard({
  icon,
  title,
  placeholder,
  value,
  onChange,
  minChars,
  disabled,
}: {
  icon: React.ReactNode
  title: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  minChars: number
  disabled?: boolean
}) {
  const ok = value.trim().length >= minChars

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <span className="flex size-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
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
        rows={14}
        className="w-full resize-y rounded-lg border border-transparent bg-transparent p-1 text-sm leading-relaxed text-slate-700 placeholder:text-slate-300 focus:outline-none"
      />
      <p className={`mt-2 text-xs font-medium ${ok ? 'text-emerald-600' : 'text-slate-400'}`}>
        {ok ? 'Looks good ✓' : `Minimum ${minChars} characters`}
      </p>
    </div>
  )
}
