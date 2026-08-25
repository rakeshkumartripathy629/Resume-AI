import { useEffect, useState, type FormEvent } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  FileSearch,
  FileText,
} from 'lucide-react'
import { Navbar } from '../components/layout/Navbar'
import { Button } from '../components/ui/Button'
import { TextAreaCard } from '../components/ui/TextArea'
import { ScoreResultView } from '../components/scorer/ScoreResultView'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { scoreResume, setJobDescription, setResumeText } from '../features/scorer/scorerSlice'
import { fetchCoinBalance } from '../features/coins/coinsSlice'

const MIN_RESUME = 80
const MIN_JD = 40

export function ScorerPage() {
  const dispatch = useAppDispatch()
  const { resumeText, jobDescription, status, result, error } = useAppSelector(
    (state) => state.scorer
  )
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'succeeded') {
      void dispatch(fetchCoinBalance())
    }
  }, [status, dispatch])

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
    <div className="min-h-screen bg-mesh">
      <Navbar authed />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        {/* Stepper */}
        <div className="mb-8 flex items-center gap-3">
          <StepBadge active={!result} done={Boolean(result)} n={1} label="Inputs" />
          <span className={`h-0.5 flex-1 rounded-full transition-colors duration-500 ${result ? 'bg-gradient-to-r from-brand-400 to-accent-400' : 'bg-slate-200'}`} />
          <StepBadge active={status === 'loading'} done={Boolean(result)} n={2} label="Results" />
        </div>

        {!result ? (
          <form onSubmit={handleSubmit}>
            <div className="mb-6 animate-fade-in">
              <h1 className="flex items-center gap-3 text-3xl font-extrabold tracking-tight text-slate-900">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-blue-500 shadow-lg shadow-brand-500/20">
                  <FileSearch className="size-6 text-white" />
                </span>
                Resume Scorer
              </h1>
              <p className="mt-2 text-sm text-slate-400">
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
                <p className="animate-pulse text-sm font-semibold text-brand-600">
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
        className={`flex size-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
          done
            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
            : active
              ? 'bg-gradient-to-r from-brand-500 to-accent-500 text-white shadow-md shadow-brand-500/30'
              : 'bg-slate-100 text-slate-400'
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
