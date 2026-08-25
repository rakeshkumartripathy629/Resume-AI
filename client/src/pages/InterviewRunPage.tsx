import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CircleAlert,
  Lightbulb,
  Loader2,
  Send,
} from 'lucide-react'
import { Navbar } from '../components/layout/Navbar'
import { Button } from '../components/ui/Button'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import {
  completeInterview,
  fetchInterview,
  submitAnswer,
} from '../features/interview/interviewSlice'
import {
  DIFFICULTY_META,
  QUESTION_TYPE_META,
  type AnswerEvaluation,
} from '../types/interview'

export function InterviewRunPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { current: interview, answerStatus, completeStatus, error } = useAppSelector(
    (state) => state.interview
  )
  const [answer, setAnswer] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  // Load interview when landing directly on the URL
  useEffect(() => {
    if (id && (!interview || interview.id !== id)) {
      void dispatch(fetchInterview(id))
    }
  }, [id, interview, dispatch])

  useEffect(() => {
    if (interview) {
      setActiveIndex(Math.min(interview.currentQuestionIndex, interview.questions.length - 1))
    }
  }, [interview?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const answeredCount = interview?.answers.length ?? 0
  const totalCount = interview?.questions.length ?? 0
  const allAnswered = interview ? answeredCount >= totalCount : false

  const activeQuestion = interview?.questions[activeIndex]
  const activeEvaluation: AnswerEvaluation | null =
    interview?.evaluations[activeIndex] ?? null
  const alreadyAnswered = Boolean(
    interview?.answers.some((a) => a.questionIndex === activeIndex)
  )

  const progressPct = useMemo(
    () => (totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0),
    [answeredCount, totalCount]
  )

  function handleSubmit(): void {
    if (!interview || !answer.trim() || answerStatus === 'loading') return
    void dispatch(
      submitAnswer({
        id: interview.id,
        questionIndex: activeIndex,
        answer: answer.trim(),
      })
    )
      .unwrap()
      .then(() => setAnswer(''))
      .catch(() => undefined)
  }

  function handleNext(): void {
    if (!interview) return
    if (activeIndex + 1 < interview.questions.length) {
      setActiveIndex(activeIndex + 1)
    } else {
      void dispatch(completeInterview(interview.id))
        .unwrap()
        .then(() => navigate(`/interview/${interview.id}/report`))
        .catch(() => undefined)
    }
  }

  if (!interview) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar authed />
        <main className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
          <Loader2 className="size-8 animate-spin text-indigo-500" />
          <p className="mt-4 text-sm font-semibold text-slate-500">Loading your interview…</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar authed />

      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        {/* Header */}
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-800"
        >
          <ArrowLeft className="size-4" /> Exit interview
        </Link>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
              {interview.role}
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              {DIFFICULTY_META[interview.difficulty].icon}{' '}
              {DIFFICULTY_META[interview.difficulty].label} · {totalCount} questions
            </p>
          </div>
          {allAnswered && interview.status === 'in_progress' && (
            <Button size="md" loading={completeStatus === 'loading'} onClick={handleNext}>
              Finish & generate report
            </Button>
          )}
        </div>

        {/* Progress */}
        <div className="mt-5">
          <div className="mb-1.5 flex items-center justify-between text-xs font-bold uppercase tracking-wider">
            <span className="text-slate-400">Progress</span>
            <span className="text-indigo-600">
              {answeredCount}/{totalCount} answered
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Question dots */}
        <div className="mt-5 flex flex-wrap gap-2">
          {interview.questions.map((_, i) => {
            const done = interview.answers.some((a) => a.questionIndex === i)
            return (
              <button
                key={i}
                type="button"
                onClick={() => setActiveIndex(i)}
                title={done ? 'Answered' : 'Not answered yet'}
                className={`size-9 rounded-lg border text-sm font-bold transition-all ${
                  i === activeIndex
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                    : done
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300'
                      : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300'
                }`}
              >
                {i + 1}
              </button>
            )
          })}
        </div>

        {(error || completeStatus === 'failed') && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            <AlertTriangle className="mt-0.5 size-5 shrink-0" />
            {error ?? 'Could not finish the interview. Please try again.'}
          </div>
        )}

        {/* Active question */}
        {activeQuestion && (
          <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8">
            <span
              className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                QUESTION_TYPE_META[activeQuestion.type].className
              }`}
            >
              Q{activeIndex + 1} · {QUESTION_TYPE_META[activeQuestion.type].label}
            </span>
            <p className="mt-3 text-lg font-bold leading-snug text-slate-900 sm:text-xl">
              {activeQuestion.text}
            </p>

            {!alreadyAnswered ? (
              <>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value.slice(0, 5000))}
                  placeholder="Type or paste your answer as you would speak it…"
                  rows={7}
                  disabled={answerStatus === 'loading'}
                  className="mt-5 w-full resize-y rounded-2xl border border-slate-300 bg-slate-50/50 p-4 text-sm leading-relaxed text-slate-700 placeholder:text-slate-300 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                />
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-semibold tabular-nums text-slate-400">
                    Min 10 characters · {answer.length.toLocaleString()} typed
                  </span>
                  <Button
                    size="md"
                    loading={answerStatus === 'loading'}
                    disabled={answer.trim().length < 10 || answerStatus === 'loading'}
                    onClick={handleSubmit}
                  >
                    {answerStatus !== 'loading' && (
                      <>
                        Submit answer <Send className="size-4" />
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <AnswerFeedback evaluation={activeEvaluation} onNext={handleNext} isLast={activeIndex + 1 >= totalCount} busy={completeStatus === 'loading'} />
            )}
          </section>
        )}

        {alreadyAnswered && answerStatus === 'failed' && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            <CircleAlert className="mt-0.5 size-5 shrink-0" />
            {error}
          </div>
        )}
      </main>
    </div>
  )
}

function AnswerFeedback({
  evaluation,
  onNext,
  isLast,
  busy,
}: {
  evaluation: AnswerEvaluation | null
  onNext: () => void
  isLast: boolean
  busy: boolean
}) {
  if (!evaluation) {
    return (
      <p className="mt-5 flex items-center gap-2 animate-pulse text-sm font-semibold text-indigo-600">
        <Loader2 className="size-4 animate-spin" /> Loading feedback…
      </p>
    )
  }

  const scoreColor =
    evaluation.score >= 7 ? 'text-emerald-600' : evaluation.score >= 5 ? 'text-amber-600' : 'text-red-600'

  return (
    <div className="mt-6 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-violet-50/60 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-indigo-700">
          <BadgeCheck className="size-4" /> AI feedback
        </p>
        <p className={`text-2xl font-extrabold tabular-nums ${scoreColor}`}>
          {evaluation.score.toFixed(1)}<span className="text-sm text-slate-400">/10</span>
        </p>
      </div>

      {evaluation.strengths.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {evaluation.strengths.map((s, i) => (
            <li key={`s-${i}`} className="flex items-start gap-2 text-sm text-slate-700">
              <BadgeCheck className="mt-0.5 size-4 shrink-0 text-emerald-500" /> {s}
            </li>
          ))}
        </ul>
      )}
      {evaluation.gaps.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {evaluation.gaps.map((g, i) => (
            <li key={`g-${i}`} className="flex items-start gap-2 text-sm text-slate-700">
              <CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-500" /> {g}
            </li>
          ))}
        </ul>
      )}
      {evaluation.modelAnswerHint && (
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-white/70 p-3 text-sm leading-relaxed text-slate-600">
          <Lightbulb className="mt-0.5 size-4 shrink-0 text-yellow-500" />
          <span><strong className="font-bold text-slate-800">Strong answers cover:</strong> {evaluation.modelAnswerHint}</span>
        </p>
      )}

      <div className="mt-5 flex justify-end">
        <Button size="md" onClick={onNext} loading={busy}>
          {isLast ? 'Finish & generate report' : 'Next question'}{' '}
          {!isLast && <ArrowRight className="size-4" />}
        </Button>
      </div>
    </div>
  )
}
