import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowRight, BriefcaseBusiness, Coins, Loader2, Mic, Target } from 'lucide-react'
import { Navbar } from '../components/layout/Navbar'
import { Button } from '../components/ui/Button'
import { TextAreaCard } from '../components/ui/TextArea'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { startInterview } from '../features/interview/interviewSlice'
import { coinSpent } from '../features/coins/coinsSlice'
import { DIFFICULTY_META, type Difficulty } from '../types/interview'

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']
const INTERVIEW_COST = 10
const QUESTION_COUNT = 6

export function InterviewSetupPage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { startStatus, error } = useAppSelector((state) => state.interview)
  const [role, setRole] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [jdText, setJdText] = useState('')

  function handleSubmit(event: FormEvent): void {
    event.preventDefault()
    void dispatch(startInterview({ role: role.trim(), difficulty, jdText }))
      .unwrap()
      .then((interview) => {
        dispatch(coinSpent(INTERVIEW_COST))
        navigate(`/interview/${interview.id}/run`)
      })
      .catch(() => undefined)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar authed />

      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-indigo-600">
            <Mic className="size-4" />
            Mock interview
          </div>
          <h1 className="mt-2 flex items-center gap-3 text-3xl font-extrabold tracking-tight text-slate-900">
            <span className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-500/25">
              <Mic className="size-6 text-white" />
            </span>
            Set up your interview
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Our AI will ask you {QUESTION_COUNT} role-specific questions and grade every answer.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8"
        >
          <label htmlFor="role" className="block text-sm font-bold text-slate-900">
            Target role <span className="text-red-500">*</span>
          </label>
          <div className="relative mt-1.5">
            <Target className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
            <input
              id="role"
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Frontend Engineer at a product startup"
              minLength={2}
              maxLength={120}
              required
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-12 pr-4 text-[15px] text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>

          <p className="mt-7 block text-sm font-bold text-slate-900">Difficulty</p>
          <div className="mt-2 grid gap-3 sm:grid-cols-3">
            {DIFFICULTIES.map((level) => {
              const meta = DIFFICULTY_META[level]
              const selected = difficulty === level
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => setDifficulty(level)}
                  className={`rounded-2xl border p-4 text-left transition-all ${
                    selected
                      ? 'border-indigo-500 bg-indigo-50/60 ring-4 ring-indigo-500/10'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <span className="text-lg">{meta.icon}</span>
                  <p className={`text-sm font-bold ${selected ? 'text-indigo-700' : 'text-slate-900'}`}>
                    {meta.label}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{meta.description}</p>
                </button>
              )
            })}
          </div>

          <div className="mt-7">
            <TextAreaCard
              icon={<BriefcaseBusiness className="size-4" />}
              title="Job description (optional)"
              placeholder={'Paste the job posting to tailor questions to the exact requirements…\n\nLeave empty for general role questions.'}
              value={jdText}
              onChange={(v) => setJdText(v.slice(0, 8000))}
              minChars={0}
              rows={5}
              disabled={startStatus === 'loading'}
            />
          </div>

          {error && (
            <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm font-medium text-red-700">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="mt-8 flex flex-col items-stretch justify-between gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center">
            <span className="flex items-center justify-center gap-1.5 rounded-full border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-2 text-sm font-bold text-amber-700">
              <Coins className="size-4 text-amber-500" />
              Costs {INTERVIEW_COST} coins
            </span>
            <Button
              type="submit"
              size="lg"
              loading={startStatus === 'loading'}
              disabled={startStatus === 'loading'}
            >
              {startStatus !== 'loading' && (
                <>
                  Start interview <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </div>
        </form>

        {startStatus === 'loading' && (
          <p className="mt-4 flex items-center justify-center gap-2 animate-pulse text-sm font-semibold text-indigo-600">
            <Loader2 className="size-4 animate-spin" /> Designing your question set…
          </p>
        )}
      </main>
    </div>
  )
}
