import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Coins,
  GraduationCap,
  Loader2,
  Map,
  RotateCcw,
  Route,
  Sparkles,
} from 'lucide-react'
import { Navbar } from '../components/layout/Navbar'
import { Button } from '../components/ui/Button'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import {
  clearRoadmap,
  generateRoadmap,
} from '../features/roadmap/roadmapSlice'
import { coinSpent } from '../features/coins/coinsSlice'

const LEVELS = [
  { value: 'beginner', label: 'Beginner', hint: 'New to tech or switching fields' },
  { value: 'intermediate', label: 'Intermediate', hint: '1-3 years experience' },
  { value: 'advanced', label: 'Advanced', hint: '3+ years, leveling up' },
] as const

const RESOURCE_ICON: Record<string, typeof BookOpen> = {
  course: GraduationCap,
  book: BookOpen,
  docs: BookOpen,
  project: Sparkles,
  other: BookOpen,
}

export function RoadmapsPage() {
  const dispatch = useAppDispatch()
  const { current: roadmap, status, error } = useAppSelector((state) => state.roadmap)
  const [targetRole, setTargetRole] = useState('')
  const [experienceLevel, setExperienceLevel] =
    useState<(typeof LEVELS)[number]['value']>('beginner')
  const [skillsInput, setSkillsInput] = useState('')

  function handleSubmit(event: FormEvent): void {
    event.preventDefault()
    const currentSkills = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 30)
    void dispatch(generateRoadmap({ targetRole: targetRole.trim(), experienceLevel, currentSkills }))
      .unwrap()
      .then(() => dispatch(coinSpent(8)))
      .catch(() => undefined)
  }

  if (status === 'succeeded' && roadmap) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar authed />

        <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
          <button
            type="button"
            onClick={() => dispatch(clearRoadmap())}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-800"
          >
            <RotateCcw className="size-4" /> Generate another roadmap
          </button>

          {/* Header */}
          <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-900/5 sm:p-9">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-indigo-600">
                  <Map className="size-4" /> Career roadmap
                </p>
                <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                  Path to {roadmap.targetRole}
                </h1>
              </div>
              <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700">
                {LEVELS.find((l) => l.value === roadmap.experienceLevel)?.label}
              </span>
            </div>

            <p className="mt-4 max-w-2xl leading-relaxed text-slate-600">{roadmap.summary}</p>

            {/* Gap analysis */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5">
                <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-700">
                  You already have
                </h2>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {roadmap.gapAnalysis.matchingSkills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-emerald-700 shadow-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-5">
                <h2 className="text-sm font-bold uppercase tracking-wider text-violet-700">
                  You'll need to learn
                </h2>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {roadmap.gapAnalysis.missingSkills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-violet-700 shadow-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <ol className="relative mt-10 space-y-8 before:absolute before:left-[22px] before:top-2 before:h-[calc(100%-16px)] before:w-0.5 before:bg-gradient-to-b before:from-indigo-500 before:to-fuchsia-400">
            {roadmap.phases.map((phase, i) => (
              <li key={i} className="relative pl-16">
                <span className="absolute left-0 top-0 flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 font-extrabold text-white shadow-lg shadow-indigo-500/25">
                  {i + 1}
                </span>
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-lg font-extrabold text-slate-900">{phase.title}</h3>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                      {phase.duration}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {phase.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-md border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  <ul className="mt-4 space-y-2">
                    {phase.milestones.map((milestone, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-slate-700">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                        {milestone}
                      </li>
                    ))}
                  </ul>

                  {phase.resources.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {phase.resources.map((resource, j) => {
                        const Icon = RESOURCE_ICON[resource.type] ?? BookOpen
                        return (
                          <span
                            key={j}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600"
                          >
                            <Icon className="size-3.5 text-slate-400" />
                            {resource.title}
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-10 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 p-6 text-center">
            <p className="text-sm font-semibold text-slate-700">
              Ready to test yourself? Try a mock interview for{' '}
              <strong>{roadmap.targetRole}</strong>.
            </p>
            <Link
              to="/interview/new"
              className="mt-3 inline-flex h-11 items-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:from-indigo-700 hover:to-violet-700 active:scale-[0.98]"
            >
              Start mock interview →
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar authed />

      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-indigo-600">
            <Route className="size-4" />
            Career planning
          </div>
          <h1 className="mt-2 flex items-center gap-3 text-3xl font-extrabold tracking-tight text-slate-900">
            <span className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25">
              <Map className="size-6 text-white" />
            </span>
            Build your career roadmap
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Tell us where you are and where you want to be — we'll chart the path.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8"
        >
          <label htmlFor="targetRole" className="block text-sm font-bold text-slate-900">
            Target role <span className="text-red-500">*</span>
          </label>
          <input
            id="targetRole"
            type="text"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="e.g. Backend Engineer, Data Analyst, DevOps Engineer…"
            minLength={2}
            maxLength={120}
            required
            className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[15px] text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
          />

          <p className="mt-7 block text-sm font-bold text-slate-900">Your level</p>
          <div className="mt-2 grid gap-3 sm:grid-cols-3">
            {LEVELS.map((level) => {
              const selected = experienceLevel === level.value
              return (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => setExperienceLevel(level.value)}
                  className={`rounded-2xl border p-4 text-left transition-all ${
                    selected
                      ? 'border-indigo-500 bg-indigo-50/60 ring-4 ring-indigo-500/10'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <p className={`text-sm font-bold ${selected ? 'text-indigo-700' : 'text-slate-900'}`}>
                    {level.label}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">{level.hint}</p>
                </button>
              )
            })}
          </div>

          <label htmlFor="skills" className="mt-7 block text-sm font-bold text-slate-900">
            Current skills <span className="font-medium text-slate-400">(comma separated)</span>
          </label>
          <textarea
            id="skills"
            rows={3}
            value={skillsInput}
            onChange={(e) => setSkillsInput(e.target.value)}
            placeholder="JavaScript, React, basic SQL, Git…"
            className="mt-1.5 w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
          />

          {error && (
            <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm font-medium text-red-700">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="mt-8 flex flex-col items-stretch justify-between gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center">
            <span className="flex items-center justify-center gap-1.5 rounded-full border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-2 text-sm font-bold text-amber-700">
              <Coins className="size-4 text-amber-500" />
              Costs 8 coins
            </span>
            <Button
              type="submit"
              size="lg"
              loading={status === 'loading'}
              disabled={status === 'loading'}
            >
              {status !== 'loading' && (
                <>
                  Generate roadmap <Sparkles className="size-4" />
                </>
              )}
            </Button>
          </div>
        </form>

        {status === 'loading' && (
          <p className="mt-4 flex items-center justify-center gap-2 animate-pulse text-sm font-semibold text-indigo-600">
            <Loader2 className="size-4 animate-spin" /> Analyzing skill gaps and designing your path…
          </p>
        )}
      </main>
    </div>
  )
}
