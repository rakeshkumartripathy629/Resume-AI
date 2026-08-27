import { useEffect, useRef, useState } from 'react'
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

/* ── 3D Tilt Card Component ───────────────────────────────────────── */

function TiltCard({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setTilt({ x: y * -12, y: x * 12 })
  }

  function handleMouseLeave() {
    setTilt({ x: 0, y: 0 })
    setIsHovered(false)
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className={`card-3d ${className}`}
      style={{
        transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) ${isHovered ? 'scale(1.02)' : 'scale(1)'}`,
      }}
    >
      {children}
    </div>
  )
}

/* ── Floating Background Mesh ─────────────────────────────────────── */

function FloatingMesh() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-32 -top-32 size-96 rounded-full bg-indigo-200/30 blur-[120px] animate-float-slow" />
      <div className="absolute -bottom-32 -right-32 size-80 rounded-full bg-purple-200/20 blur-[100px] animate-float-slow" style={{ animationDelay: '2s' }} />
      <div className="absolute left-1/2 top-1/3 size-64 rounded-full bg-pink-100/20 blur-[80px] animate-float-slow" style={{ animationDelay: '4s' }} />
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[length:60px_60px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)]" />
    </div>
  )
}

/* ── Animated Stat Counter ────────────────────────────────────────── */

function AnimatedStat({
  value,
  label,
  icon: Icon,
  gradient,
  delay = 0,
}: {
  value: string
  label: string
  icon: typeof Coins
  gradient: string
  delay?: number
}) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-500 hover:shadow-lg hover:border-slate-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg transition-transform duration-300 hover:scale-110 hover:rotate-6`}
        >
          <Icon className="size-5" />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
          <p className="mt-0.5 text-2xl font-extrabold text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  )
}

/* ── Tool Card with 3D Tilt ──────────────────────────────────────── */

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
    <div className="relative min-h-screen overflow-hidden">
      <FloatingMesh />
      <Navbar authed />

      <main className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Greeting */}
        <div className="animate-fade-in flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Welcome back,{' '}
              <span className="bg-gradient-to-r from-brand-600 via-accent-500 to-pink-500 bg-clip-text text-transparent animate-gradient-flow">
                {displayName}
              </span>
            </h1>
            <p className="mt-1.5 text-sm text-slate-400">
              Pick a tool below or jump straight into building.
            </p>
          </div>
          <Link
            to="/builder"
            className="group magnetic-btn inline-flex h-11 items-center gap-2 self-start rounded-2xl bg-gradient-to-r from-brand-600 to-accent-600 px-5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:from-brand-700 hover:to-accent-700 hover:brightness-110 active:scale-[0.98]"
          >
            <Plus className="size-4" />
            New Resume
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <AnimatedStat
            value={scoreCount === null ? '…' : String(scoreCount)}
            label="Resumes scored"
            icon={FileSearch}
            gradient="from-brand-500 to-blue-500"
            delay={100}
          />
          <AnimatedStat
            value={
              interviewList.status === 'loading' && interviewList.total === 0
                ? '…'
                : String(interviewList.total)
            }
            label="Interviews completed"
            icon={Mic}
            gradient="from-violet-500 to-purple-600"
            delay={200}
          />
          <AnimatedStat
            value={coinBalance !== null ? String(coinBalance) : '—'}
            label="Coin balance"
            icon={Coins}
            gradient="from-amber-500 to-orange-500"
            delay={300}
          />
        </div>

        {/* Quick history links */}
        <div className="mt-4 flex flex-wrap gap-3">
          {[
            { to: '/scores/history', icon: FileSearch, label: 'Score history' },
            { to: '/tailor/history', icon: FileSearch, label: 'Tailoring history' },
            { to: '/roadmaps/history', icon: Map, label: 'Roadmap history' },
          ].map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="magnetic-btn inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition-all hover:border-brand-300 hover:text-brand-600 hover:shadow-md hover:-translate-y-0.5"
            >
              <link.icon className="size-3.5" /> {link.label}
            </Link>
          ))}
        </div>

        {/* Tools */}
        <div className="mt-12 flex items-center gap-2">
          <Sparkles className="size-5 text-brand-500 animate-float" />
          <h2 className="text-lg font-bold text-slate-900">Your AI tools</h2>
        </div>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map(({ to, icon: Icon, title, description, gradient, shadow }, i) => (
            <TiltCard
              key={title}
              className={`rounded-2xl border border-slate-100 bg-white p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-brand-500/10 opacity-0 animate-slide-up-stagger`}
              /* @ts-expect-error style animation-delay */
              style={{ animationDelay: `${(i + 1) * 0.1}s` }}
            >
              <Link to={to} className="block">
                <div className="flex items-start justify-between">
                  <span
                    className={`inline-flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} shadow-lg ${shadow} transition-transform duration-300 hover:scale-110 hover:rotate-6`}
                  >
                    <Icon className="size-6 text-white" />
                  </span>
                  <ArrowUpRight className="size-5 text-slate-200 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-brand-500" />
                </div>
                <h3 className="mt-5 font-bold text-slate-900">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{description}</p>
              </Link>
            </TiltCard>
          ))}
        </div>

        {/* Recent interviews */}
        <div className="mt-12">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Recent interviews</h2>
            {interviewList.items.length > 0 && (
              <Link
                to="/interview/new"
                className="magnetic-btn text-sm font-semibold text-brand-600 transition-colors hover:text-brand-800"
              >
                New interview →
              </Link>
            )}
          </div>

          {interviewList.status === 'loading' && interviewList.items.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-slate-100 bg-white px-6 py-12 text-center text-sm font-semibold text-slate-400">
              <div className="mx-auto size-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500" />
              <p className="mt-3">Loading…</p>
            </div>
          ) : interviewList.items.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-white/60 px-6 py-14 text-center animate-fade-in">
              <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-50 animate-bounce-in">
                <Sparkles className="size-7 text-brand-400" />
              </span>
              <p className="mt-4 font-bold text-slate-700">No activity yet</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-slate-400">
                Score your first resume or take a mock interview — results will show up here.
              </p>
            </div>
          ) : (
            <ul className="mt-5 divide-y divide-slate-50 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
              {interviewList.items.map((interview, i) => (
                <li
                  key={interview.id}
                  className="opacity-0 animate-slide-up-stagger"
                  style={{ animationDelay: `${(i + 1) * 0.08}s` }}
                >
                  <Link
                    to={
                      interview.status === 'completed'
                        ? `/interview/${interview.id}/report`
                        : `/interview/${interview.id}/run`
                    }
                    className="flex items-center gap-4 px-5 py-4 transition-all hover:bg-slate-50/80 hover:pl-7"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-500 transition-transform duration-300 hover:scale-110 hover:rotate-6">
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
                      <span className="flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 text-xs font-bold tabular-nums text-emerald-700 transition-all duration-300 hover:scale-105">
                        <Trophy className="size-3.5" />
                        {interview.overallScore}/100
                      </span>
                    ) : (
                      <span className="rounded-full border border-amber-200/80 bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-600 animate-pulse">
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
