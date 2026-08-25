import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  Coins,
  FileSearch,
  FileText,
  Map,
  Mic,
  Plus,
  Sparkles,
  Trophy,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Navbar } from '../components/layout/Navbar'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { fetchCoinBalance } from '../features/coins/coinsSlice'
import { fetchMyInterviews } from '../features/interview/interviewListSlice'
import { fetchScoreCount } from '../features/scorer/scorerSlice'

const tools = [
  {
    to: '/scorer',
    icon: FileSearch,
    title: 'Resume Scorer',
    description: 'Score your resume against any job description with AI analysis.',
    gradient: 'from-brand-500 to-blue-500',
    shadow: 'shadow-brand-500/20',
  },
  {
    to: '/builder',
    icon: FileText,
    title: 'Resume Builder',
    description: 'Craft a clean, ATS-friendly resume section by section.',
    gradient: 'from-fuchsia-500 to-pink-600',
    shadow: 'shadow-fuchsia-500/20',
  },
  {
    to: '/interview/new',
    icon: Mic,
    title: 'Mock Interview',
    description: 'Rehearse with an AI interviewer and get actionable feedback.',
    gradient: 'from-violet-500 to-purple-600',
    shadow: 'shadow-violet-500/20',
  },
  {
    to: '/roadmaps',
    icon: Map,
    title: 'Career Roadmap',
    description: 'Get a personalized learning path toward your target role.',
    gradient: 'from-amber-500 to-orange-500',
    shadow: 'shadow-amber-500/20',
  },
]

export function DashboardPage() {
  const { profile, currentUser } = useAuth()
  const dispatch = useAppDispatch()
  const coinBalance = useAppSelector((state) => state.coins.balance)
  const interviewList = useAppSelector((state) => state.interviewList)
  const scoreCount = useAppSelector((state) => state.scorer.scoreCount)
  const displayName =
    profile?.displayName || profile?.email?.split('@')[0] || currentUser?.email || 'there'

  useEffect(() => {
    void dispatch(fetchCoinBalance())
    void dispatch(fetchMyInterviews())
    void dispatch(fetchScoreCount())
  }, [dispatch])

  return (
    <div className="min-h-screen bg-mesh">
      <Navbar authed />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Greeting */}
        <div className="animate-fade-in flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Welcome back, <span className="text-gradient-brand">{displayName}</span>
            </h1>
            <p className="mt-1.5 text-sm text-slate-400">
              Pick a tool below or jump straight into building.
            </p>
          </div>
          <Link
            to="/builder"
            className="group inline-flex h-11 items-center gap-2 self-start rounded-2xl bg-gradient-to-r from-brand-600 to-accent-600 px-5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:from-brand-700 hover:to-accent-700 hover:brightness-110 active:scale-[0.98]"
          >
            <Plus className="size-4" />
            New Resume
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Stats */}
        <div className="animate-fade-in delay-100 mt-8 grid gap-4 sm:grid-cols-3">
          <Link
            to="/scores/history"
            className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-brand-100 group"
          >
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Resumes scored</p>
            <div className="mt-1 flex items-baseline justify-between">
              <p className="text-3xl font-extrabold text-slate-900">
                {scoreCount === null ? '…' : scoreCount}
              </p>
              <span className="text-xs font-semibold text-brand-500 opacity-0 transition-opacity group-hover:opacity-100">
                View history →
              </span>
            </div>
          </Link>
          <Link
            to="/roadmaps/history"
            className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-brand-100 group"
          >
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Interviews completed</p>
            <div className="mt-1 flex items-baseline justify-between">
              <p className="text-3xl font-extrabold text-slate-900">
                {interviewList.status === 'loading' && interviewList.total === 0
                  ? '…'
                  : interviewList.total}
              </p>
              <span className="text-xs font-semibold text-brand-500 opacity-0 transition-opacity group-hover:opacity-100">
                View all →
              </span>
            </div>
          </Link>
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-amber-200">
            <div className="flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/20">
                <Coins className="size-5" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Coin balance</p>
                <p className="mt-0.5 text-2xl font-extrabold text-slate-900">
                  {coinBalance ?? '—'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick history links */}
        <div className="animate-fade-in delay-100 mt-4 flex flex-wrap gap-3">
          <Link
            to="/scores/history"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition-all hover:border-brand-300 hover:text-brand-600 hover:shadow-sm"
          >
            <FileSearch className="size-3.5" /> Score history
          </Link>
          <Link
            to="/tailor/history"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition-all hover:border-brand-300 hover:text-brand-600 hover:shadow-sm"
          >
            <FileSearch className="size-3.5" /> Tailoring history
          </Link>
          <Link
            to="/roadmaps/history"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition-all hover:border-brand-300 hover:text-brand-600 hover:shadow-sm"
          >
            <Map className="size-3.5" /> Roadmap history
          </Link>
        </div>

        {/* Tools */}
        <div className="animate-fade-in delay-200 mt-12 flex items-center gap-2">
          <Sparkles className="size-5 text-brand-500" />
          <h2 className="text-lg font-bold text-slate-900">Your AI tools</h2>
        </div>
        <div className="animate-fade-in delay-300 mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map(({ to, icon: Icon, title, description, gradient, shadow }) => (
            <Link
              key={title}
              to={to}
              className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 card-hover"
            >
              <div className="flex items-start justify-between">
                <span
                  className={`inline-flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} shadow-lg ${shadow}`}
                >
                  <Icon className="size-6 text-white" />
                </span>
                <ArrowUpRight className="size-5 text-slate-200 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-brand-500" />
              </div>
              <h3 className="mt-5 font-bold text-slate-900">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{description}</p>
            </Link>
          ))}
        </div>

        {/* Recent interviews */}
        <div className="animate-fade-in delay-400 mt-12">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Recent interviews</h2>
            {interviewList.items.length > 0 && (
              <Link
                to="/interview/new"
                className="text-sm font-semibold text-brand-600 transition-colors hover:text-brand-800"
              >
                New interview →
              </Link>
            )}
          </div>

          {interviewList.status === 'loading' && interviewList.items.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-slate-100 bg-white px-6 py-12 text-center text-sm font-semibold text-slate-400">
              Loading…
            </div>
          ) : interviewList.items.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-white/60 px-6 py-14 text-center">
              <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-50">
                <Sparkles className="size-7 text-brand-400" />
              </span>
              <p className="mt-4 font-bold text-slate-700">No activity yet</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-slate-400">
                Score your first resume or take a mock interview — results will show up here.
              </p>
            </div>
          ) : (
            <ul className="mt-5 divide-y divide-slate-50 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
              {interviewList.items.map((interview) => (
                <li key={interview.id}>
                  <Link
                    to={
                      interview.status === 'completed'
                        ? `/interview/${interview.id}/report`
                        : `/interview/${interview.id}/run`
                    }
                    className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-slate-50/80"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-500">
                      <Mic className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900">{interview.role}</p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {new Date(interview.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        · {interview.answeredCount}/{interview.questionCount} answered
                      </p>
                    </div>
                    {interview.overallScore !== null ? (
                      <span className="flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 text-xs font-bold tabular-nums text-emerald-700">
                        <Trophy className="size-3.5" />
                        {interview.overallScore}/100
                      </span>
                    ) : (
                      <span className="rounded-full border border-amber-200/80 bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-600">
                        In progress
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  )
}
