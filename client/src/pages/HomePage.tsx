import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  FileSearch,
  FileText,
  Map,
  Mic,
  Sparkles,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'

/* ── Floating Particles Background ─────────────────────────────────── */

function Particles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: Math.random() * 4 + 2,
    delay: Math.random() * 5,
    duration: Math.random() * 4 + 4,
  }))

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-brand-400/20"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            animation: `particle-float ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

/* ── 3D Hero Resume Mockup ─────────────────────────────────────────── */

function HeroVisual() {
  return (
    <div className="relative mx-auto mt-16 flex h-[320px] w-full max-w-2xl items-center justify-center sm:h-[380px] lg:mt-20">
      {/* Glow backdrop */}
      <div className="absolute size-[280px] rounded-full bg-brand-400/20 blur-[80px] animate-glow-pulse" />
      <div className="absolute left-1/3 top-1/4 size-[200px] rounded-full bg-accent-400/15 blur-[60px] animate-glow-pulse" style={{ animationDelay: '1s' }} />

      {/* Central morph blob */}
      <div className="absolute size-[260px] bg-gradient-to-br from-brand-400/30 via-accent-400/20 to-pink-400/25 animate-morph" />

      {/* Orbiting rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="size-[320px] rounded-full border border-brand-200/40 animate-pulse-ring" />
        <div className="absolute size-[240px] rounded-full border border-accent-200/30 animate-pulse-ring" style={{ animationDelay: '0.5s' }} />
        <div className="absolute size-[160px] rounded-full border border-pink-200/25 animate-pulse-ring" style={{ animationDelay: '1s' }} />
      </div>

      {/* Central resume card - 3D rotating */}
      <div className="relative animate-rotate-3d preserve-3d">
        <div className="glass-strong relative w-[240px] rounded-2xl border border-white/60 p-5 shadow-2xl shadow-brand-500/20 sm:w-[280px]">
          {/* Shimmer line */}
          <div className="absolute inset-0 overflow-hidden rounded-2xl">
            <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/30 to-transparent" style={{ animation: 'shimmer-line 3s ease-in-out infinite' }} />
          </div>

          {/* Header */}
          <div className="mb-3 flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500">
              <Sparkles className="size-4 text-white" />
            </div>
            <div>
              <div className="h-2.5 w-20 rounded-full bg-gradient-to-r from-brand-500 to-accent-500" />
              <div className="mt-1 h-1.5 w-14 rounded-full bg-slate-200" />
            </div>
          </div>

          {/* Score badge */}
          <div className="mb-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500 text-[10px] font-bold text-white">92</div>
            <div>
              <p className="text-[10px] font-bold text-emerald-700">Excellent Match</p>
              <div className="mt-0.5 flex gap-0.5">
                {[1,2,3,4,5].map(i => <Star key={i} className={`size-2.5 ${i <= 4 ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`} />)}
              </div>
            </div>
          </div>

          {/* Skill bars */}
          {[
            { label: 'Keywords', pct: 95, color: 'from-brand-500 to-blue-500' },
            { label: 'Skills', pct: 88, color: 'from-violet-500 to-purple-500' },
            { label: 'Impact', pct: 78, color: 'from-emerald-500 to-teal-500' },
          ].map((s) => (
            <div key={s.label} className="mb-2">
              <div className="flex justify-between text-[9px] font-semibold text-slate-500">
                <span>{s.label}</span><span>{s.pct}%</span>
              </div>
              <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full rounded-full bg-gradient-to-r ${s.color}`} style={{ width: `${s.pct}%`, transition: 'width 1s ease' }} />
              </div>
            </div>
          ))}

          {/* Missing keywords */}
          <div className="mt-3 flex flex-wrap gap-1">
            {['React', 'Node.js', 'TypeScript'].map((kw) => (
              <span key={kw} className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[8px] font-bold text-amber-700 ring-1 ring-amber-200">{kw}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Floating orbit icons */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Top-right orbiting */}
        <div className="animate-orbit" style={{ position: 'absolute' }}>
          <div className="flex size-10 items-center justify-center rounded-xl bg-white shadow-lg shadow-brand-500/15 border border-slate-100">
            <Mic className="size-5 text-violet-500" />
          </div>
        </div>
        {/* Bottom-left orbiting */}
        <div className="animate-orbit" style={{ position: 'absolute', animationDelay: '-4s' }}>
          <div className="flex size-10 items-center justify-center rounded-xl bg-white shadow-lg shadow-brand-500/15 border border-slate-100">
            <FileText className="size-5 text-pink-500" />
          </div>
        </div>
        {/* Right orbiting reverse */}
        <div className="animate-orbit-reverse" style={{ position: 'absolute', animationDelay: '-2s' }}>
          <div className="flex size-9 items-center justify-center rounded-xl bg-white shadow-lg shadow-brand-500/15 border border-slate-100">
            <Map className="size-4 text-amber-500" />
          </div>
        </div>
        {/* Left orbiting reverse */}
        <div className="animate-orbit-reverse" style={{ position: 'absolute', animationDelay: '-6s' }}>
          <div className="flex size-9 items-center justify-center rounded-xl bg-white shadow-lg shadow-brand-500/15 border border-slate-100">
            <BarChart3 className="size-4 text-emerald-500" />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Animated Counter Hook ──────────────────────────────────────────── */

function useCountUp(target: number, duration = 1800, decimals = 0) {
  const [count, setCount] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true)
          const startTime = performance.now()
          function tick(now: number) {
            const elapsed = now - startTime
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setCount(parseFloat((eased * target).toFixed(decimals)))
            if (progress < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [target, duration, decimals, started])

  return { count, ref }
}

/* ── Single Stat Item ──────────────────────────────────────────────── */

function StatItem({ icon: Icon, target, suffix, label, decimals = 0, index }: {
  icon: typeof Users
  target: number
  suffix: string
  label: string
  decimals?: number
  index: number
}) {
  const { count, ref } = useCountUp(target, 1600, decimals)
  return (
    <div ref={ref} className={`text-center animate-scale-in animate-delay-${(index + 1) * 100}`}>
      <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-xl bg-brand-50">
        <Icon className="size-5 text-brand-600" />
      </div>
      <p className="text-2xl font-extrabold text-slate-900 sm:text-3xl tabular-nums">
        {decimals > 0 ? count.toFixed(decimals) : Math.floor(count).toLocaleString()}{suffix}
      </p>
      <p className="mt-0.5 text-xs font-semibold text-slate-500">{label}</p>
    </div>
  )
}

/* ── Stats Section ─────────────────────────────────────────────────── */

function StatsBar() {
  const stats = [
    { icon: Users, target: 10, suffix: 'K+', label: 'Active Users', decimals: 0 },
    { icon: FileSearch, target: 50, suffix: 'K+', label: 'Resumes Scored', decimals: 0 },
    { icon: TrendingUp, target: 92, suffix: '%', label: 'Match Rate', decimals: 0 },
    { icon: Star, target: 4.9, suffix: '', label: 'User Rating', decimals: 1 },
  ]

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
      <div className="glass-strong grid grid-cols-2 gap-4 rounded-3xl border border-slate-100/80 p-6 shadow-xl shadow-slate-900/5 sm:grid-cols-4 sm:p-8">
        {stats.map((s, i) => (
          <StatItem key={s.label} {...s} index={i} />
        ))}
      </div>
    </div>
  )
}

/* ── 3D Feature Card ───────────────────────────────────────────────── */

function FeatureCard3D({ icon: Icon, title, description, gradient, index }: {
  icon: typeof FileSearch
  title: string
  description: string
  gradient: string
  index: number
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setTilt({ x: y * -10, y: x * 10 })
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
      className={`animate-slide-up animate-delay-${(index + 1) * 100} group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 transition-shadow duration-300 hover:shadow-2xl hover:shadow-brand-500/10`}
      style={{
        transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: 'transform 0.15s ease-out',
      }}
    >
      {/* Hover glow */}
      <div className={`absolute -inset-1 rounded-2xl bg-gradient-to-br ${gradient} opacity-0 blur-xl transition-opacity duration-300 ${isHovered ? 'opacity-15' : ''}`} />

      <div className="relative">
        <span className={`inline-flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
          <Icon className="size-6 text-white" />
        </span>
        <h3 className="mt-5 text-lg font-bold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">{description}</p>
      </div>

      {/* Bottom gradient bar */}
      <span className={`absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-gradient-to-r ${gradient} transition-transform duration-500 group-hover:scale-x-100`} />
    </div>
  )
}

/* ── Main Page ─────────────────────────────────────────────────────── */

const features = [
  {
    icon: FileSearch,
    title: 'AI Resume Scoring',
    description: 'Upload your resume and a job description — get an ATS-style score with keyword, skills, and impact analysis in seconds.',
    gradient: 'from-brand-500 to-blue-500',
  },
  {
    icon: Mic,
    title: 'Mock Interviews',
    description: 'Practice with an AI interviewer tailored to your target role. Get per-answer feedback and a full performance report.',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    icon: FileText,
    title: 'Smart Resume Builder',
    description: 'Build clean, recruiter-friendly resumes section by section with AI suggestions that make your experience shine.',
    gradient: 'from-fuchsia-500 to-pink-600',
  },
  {
    icon: Map,
    title: 'Career Roadmaps',
    description: 'Tell us where you want to go — get a personalized week-by-week learning roadmap bridging your skill gaps.',
    gradient: 'from-amber-500 to-orange-500',
  },
]

const steps = [
  { number: '01', title: 'Create your account', description: 'Sign up free with Google or email — your workspace is ready instantly.' },
  { number: '02', title: 'Add your resume & target role', description: 'Paste your resume and the job description you are chasing, or start fresh in the builder.' },
  { number: '03', title: 'Practice, improve, land it', description: 'Score, rebuild, rehearse interviews and follow your roadmap until you get the offer.' },
]

const testimonials = [
  { name: 'Priya S.', role: 'Software Engineer', text: 'ResumeAI helped me identify keyword gaps I never noticed. Landed 3 interviews in the first week!', rating: 5 },
  { name: 'Arjun K.', role: 'Product Manager', text: 'The mock interview feature is incredible. The AI feedback felt like talking to a real hiring manager.', rating: 5 },
  { name: 'Sneha R.', role: 'Data Scientist', text: 'The career roadmap gave me a clear path. Went from confused to confident in 4 weeks.', rating: 5 },
]

export function HomePage() {
  const { currentUser } = useAuth()
  const dashboardCta = (
    <Link
      to={currentUser ? '/dashboard' : '/login'}
      className="group inline-flex h-14 items-center gap-2.5 rounded-2xl bg-gradient-to-r from-brand-600 to-accent-600 px-8 text-base font-semibold text-white shadow-xl shadow-brand-500/30 transition-all duration-300 hover:from-brand-700 hover:to-accent-700 hover:shadow-brand-500/40 hover:scale-105 active:scale-[0.98]"
    >
      {currentUser ? 'Go to Dashboard' : 'Get started free'}
      <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1.5" />
    </Link>
  )

  return (
    <div className="min-h-screen bg-white">
      <Navbar authed={Boolean(currentUser)} />

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <Particles />
        <div className="pointer-events-none absolute -top-32 left-1/4 size-[34rem] rounded-full bg-brand-200/40 blur-[100px]" />
        <div className="pointer-events-none absolute -right-24 top-24 size-[28rem] rounded-full bg-accent-200/30 blur-[80px]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[length:56px_56px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" />

        <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-24 text-center sm:px-6 lg:px-8">
          <div className="animate-bounce-in mx-auto inline-flex items-center gap-2 rounded-full border border-brand-200/80 bg-brand-50/80 px-4 py-1.5 text-xs font-bold text-brand-700 backdrop-blur-sm">
            <Sparkles className="size-3.5 animate-float" />
            AI-Powered Career Intelligence
          </div>

          <h1 className="animate-fade-in mx-auto mt-7 max-w-3xl text-5xl font-extrabold leading-[1.06] tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
            Your AI copilot for{' '}
            <span className="bg-gradient-to-r from-brand-600 via-accent-500 to-pink-500 bg-clip-text text-transparent animate-gradient-flow">
              landing the job
            </span>
          </h1>

          <p className="animate-fade-in animate-delay-200 mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-500">
            Score your resume against any job description, practice real mock interviews with AI,
            and build resumes that pass the ATS — all in one workspace.
          </p>

          <div className="animate-fade-in animate-delay-300 mt-11 flex flex-col items-center justify-center gap-4 sm:flex-row">
            {dashboardCta}
            <a
              href="#features"
              className="inline-flex h-14 items-center rounded-2xl border border-slate-200 bg-white px-8 text-base font-semibold text-slate-600 shadow-sm transition-all duration-300 hover:border-brand-300 hover:text-brand-600 hover:shadow-md hover:scale-105"
            >
              Explore features
            </a>
          </div>

          <p className="animate-fade-in animate-delay-400 mt-7 flex items-center justify-center gap-2 text-xs font-medium text-slate-400">
            <CheckCircle2 className="size-4 text-emerald-500" />
            Free to start · No credit card required
          </p>

          <HeroVisual />
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────── */}
      <section className="relative -mt-8 pb-16">
        <StatsBar />
      </section>

      {/* ── Features ──────────────────────────────────────────────── */}
      <section id="features" className="border-t border-slate-100 bg-mesh py-28 scroll-mt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-brand-600">Features</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Everything you need to outshine the competition
            </h2>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <FeatureCard3D key={f.title} {...f} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────── */}
      <section id="how-it-works" className="py-28 scroll-mt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-brand-600">How it works</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Three steps to interview-ready
            </h2>
          </div>
          <div className="relative mt-16 grid gap-10 md:grid-cols-3">
            <div className="pointer-events-none absolute left-[16%] right-[16%] top-8 hidden h-0.5 bg-gradient-to-r from-brand-200 via-accent-200 to-pink-200 md:block" />
            {steps.map((step, index) => (
              <div key={step.number} className={`animate-slide-up animate-delay-${(index + 1) * 100} relative text-center`}>
                <div className="mx-auto flex size-16 items-center justify-center rounded-2xl border-2 border-brand-100 bg-white shadow-lg shadow-brand-500/10 transition-all duration-300 hover:scale-110 hover:shadow-brand-500/25 hover:border-brand-300">
                  <span className="text-2xl font-extrabold text-brand-600">{step.number}</span>
                </div>
                <span className="mt-5 block text-xs font-extrabold tracking-widest text-brand-500">
                  STEP {step.number}
                </span>
                <h3 className="mt-1.5 text-lg font-bold text-slate-900">{step.title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-slate-500">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────── */}
      <section className="border-t border-slate-100 bg-mesh py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-brand-600">Testimonials</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Loved by job seekers
            </h2>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t, i) => (
              <div
                key={t.name}
                className={`animate-slide-up animate-delay-${(i + 1) * 100} glass rounded-2xl border border-slate-100/80 p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-brand-500/10 hover:-translate-y-1`}
              >
                <div className="mb-3 flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="size-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-slate-600">"{t.text}"</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-accent-400 text-xs font-bold text-white">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <section className="px-4 pb-28 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-accent-700 to-pink-700 px-8 py-20 text-center shadow-2xl shadow-brand-500/25">
          <div className="pointer-events-none absolute -left-20 -top-20 size-72 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-16 size-80 rounded-full bg-pink-300/20 blur-3xl" />
          <Particles />
          <h2 className="relative text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Ready to level up your job hunt?
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-indigo-100">
            Join thousands of candidates using AI to sharpen their resume and nail their interviews.
          </p>
          <div className="relative mt-9 flex justify-center">
            <Link
              to={currentUser ? '/dashboard' : '/login'}
              className="group inline-flex h-14 items-center gap-2.5 rounded-2xl bg-white px-8 text-base font-bold text-brand-700 shadow-xl transition-all duration-300 hover:bg-brand-50 hover:scale-105 active:scale-[0.98]"
            >
              {currentUser ? 'Open my workspace' : 'Start now — it\u2019s free'}
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1.5" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
