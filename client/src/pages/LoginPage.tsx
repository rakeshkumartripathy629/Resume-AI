import { useState, useEffect, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  FileSearch,
  FileText,
  Lock,
  Mail,
  Mic,
  Map,
  Settings2,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Zap,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { isFirebaseConfigured } from '../lib/firebase'
import { apiErrorMessage } from '../lib/api'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Logo } from '../components/Logo'

const features = [
  { icon: Target, text: 'AI resume scoring against any job description' },
  { icon: Mic, text: 'Mock interviews with instant feedback reports' },
  { icon: Settings2, text: 'Smart builder with role-tailored suggestions' },
]

/* ── 3D Floating Resume Card ──────────────────────────────────────── */

function FloatingResumeCard() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      const x = (e.clientX / window.innerWidth - 0.5) * 20
      const y = (e.clientY / window.innerHeight - 0.5) * 20
      setMousePos({ x, y })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div
      className="relative mx-auto mt-12 w-64"
      style={{
        transform: `perspective(1000px) rotateY(${mousePos.x * 0.3}deg) rotateX(${-mousePos.y * 0.3}deg)`,
        transition: 'transform 0.1s ease-out',
      }}
    >
      {/* Main card */}
      <div className="glass-card relative overflow-hidden rounded-2xl p-5 shadow-2xl">
        {/* Shimmer overlay */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl">
          <div
            className="absolute -inset-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
            style={{ animation: 'shimmer-line 3s ease-in-out infinite' }}
          />
        </div>

        {/* Header */}
        <div className="relative mb-4 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-sm">
            <Sparkles className="size-5 text-white" />
          </div>
          <div>
            <div className="h-3 w-24 rounded-full bg-gradient-to-r from-white/60 to-white/30" />
            <div className="mt-1.5 h-2 w-16 rounded-full bg-white/20" />
          </div>
        </div>

        {/* Score badge */}
        <div className="relative mb-4 flex items-center gap-3 rounded-xl bg-white/10 backdrop-blur-sm px-3 py-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/80 text-xs font-bold text-white shadow-lg shadow-emerald-500/30">
            92
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-300">Excellent Match</p>
            <div className="mt-0.5 flex gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={`size-3 ${i <= 4 ? 'fill-amber-400 text-amber-400' : 'fill-white/20 text-white/20'}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Skill bars */}
        <div className="relative space-y-2.5">
          {[
            { label: 'Keywords', pct: 95, color: 'from-white/60 to-white/30' },
            { label: 'Skills', pct: 88, color: 'from-white/50 to-white/20' },
            { label: 'Impact', pct: 78, color: 'from-white/40 to-white/15' },
          ].map((s) => (
            <div key={s.label}>
              <div className="flex justify-between text-[10px] font-semibold text-white/60">
                <span>{s.label}</span>
                <span>{s.pct}%</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${s.color}`}
                  style={{ width: `${s.pct}%`, transition: 'width 1.5s ease' }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Tags */}
        <div className="relative mt-4 flex flex-wrap gap-1.5">
          {['React', 'Node.js', 'TypeScript'].map((kw) => (
            <span
              key={kw}
              className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/70 backdrop-blur-sm"
            >
              {kw}
            </span>
          ))}
        </div>
      </div>

      {/* Floating orbit icons around the card */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="animate-orbit" style={{ position: 'absolute', left: '50%', top: '50%' }}>
          <div className="flex size-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md shadow-lg border border-white/20">
            <Mic className="size-4 text-white" />
          </div>
        </div>
        <div className="animate-orbit-reverse" style={{ position: 'absolute', left: '50%', top: '50%', animationDelay: '-3s' }}>
          <div className="flex size-8 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md shadow-lg border border-white/20">
            <FileText className="size-4 text-white" />
          </div>
        </div>
        <div className="animate-orbit" style={{ position: 'absolute', left: '50%', top: '50%', animationDelay: '-6s' }}>
          <div className="flex size-8 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md shadow-lg border border-white/20">
            <Map className="size-4 text-white" />
          </div>
        </div>
        <div className="animate-orbit-reverse" style={{ position: 'absolute', left: '50%', top: '50%', animationDelay: '-9s' }}>
          <div className="flex size-7 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md shadow-lg border border-white/20">
            <BarChart3 className="size-3.5 text-white" />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Floating Particles ───────────────────────────────────────────── */

function LoginParticles() {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: Math.random() * 4 + 1,
    delay: Math.random() * 8,
    duration: Math.random() * 6 + 4,
  }))

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-white/20"
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

/* ── Main Login Page ──────────────────────────────────────────────── */

export function LoginPage() {
  const { profile, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState<'google' | 'email' | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  if (profile) {
    const from = (location.state as { from?: string } | null)?.from ?? '/dashboard'
    return <Navigate to={from} replace />
  }

  async function handleGoogle(): Promise<void> {
    setFormError(null)
    setSubmitting('google')
    try {
      await signInWithGoogle()
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setFormError(apiErrorMessage(err))
    } finally {
      setSubmitting(null)
    }
  }

  async function handleEmail(event: FormEvent): Promise<void> {
    event.preventDefault()
    setFormError(null)
    setSubmitting('email')
    try {
      if (mode === 'signup') {
        await signUpWithEmail(email, password)
      } else {
        await signInWithEmail(email, password)
      }
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setFormError(apiErrorMessage(err))
    } finally {
      setSubmitting(null)
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* ── 3D Animated Left Panel ────────────────────────────────────── */}
      <div className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-12 lg:flex">
        {/* Aurora background */}
        <div className="absolute inset-0 aurora-bg opacity-30" />

        {/* Floating particles */}
        <LoginParticles />

        {/* Glowing orbs */}
        <div className="pointer-events-none absolute -left-20 -top-20 size-80 rounded-full bg-indigo-500/30 blur-[100px] animate-glow-pulse" />
        <div className="pointer-events-none absolute -bottom-32 -right-16 size-96 rounded-full bg-purple-500/20 blur-[120px] animate-glow-pulse" style={{ animationDelay: '1s' }} />
        <div className="pointer-events-none absolute left-1/3 top-1/3 size-64 rounded-full bg-pink-500/15 blur-[80px] animate-glow-pulse" style={{ animationDelay: '2s' }} />

        {/* Grid pattern */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:40px_40px]" />

        {/* Logo */}
        <div className="relative animate-slide-in-left">
          <Logo light />
        </div>

        {/* Content */}
        <div className="relative">
          <h1 className="max-w-md text-4xl font-extrabold leading-tight text-white animate-slide-in-left" style={{ animationDelay: '0.2s' }}>
            Land your dream job with an{' '}
            <span className="bg-gradient-to-r from-amber-200 via-yellow-200 to-orange-200 bg-clip-text text-transparent animate-text-shimmer">
              AI career copilot
            </span>
          </h1>

          <ul className="mt-10 space-y-4 stagger-children">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3.5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md border border-white/10 transition-all duration-300 hover:bg-white/20 hover:scale-110 hover:rotate-3">
                  <Icon className="size-5 text-white" />
                </span>
                <span className="text-sm font-medium text-indigo-100">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 3D Floating Resume Card */}
        <div className="relative">
          <FloatingResumeCard />
        </div>

        <p className="relative text-xs font-medium text-indigo-300/60">
          AI-powered resume scoring &amp; career tools
        </p>
      </div>

      {/* ── Form Panel ────────────────────────────────────────────────── */}
      <div className="relative flex flex-1 items-center justify-center px-6 py-12">
        {/* Subtle background effects */}
        <div className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-indigo-500/5 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 size-64 rounded-full bg-purple-500/5 blur-[80px]" />

        <div className="w-full max-w-md animate-slide-in-right">
          {/* Mobile logo */}
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            {mode === 'signin'
              ? 'Sign in to continue building your career.'
              : 'Start scoring resumes and acing interviews in minutes.'}
          </p>

          {!isFirebaseConfigured && (
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 animate-fade-in">
              <div className="flex gap-3">
                <AlertTriangle className="size-5 shrink-0 text-amber-500" />
                <div className="text-sm">
                  <p className="font-semibold text-amber-800">Firebase not configured</p>
                  <p className="mt-1 text-amber-700">
                    Add your web app config to <code className="rounded bg-amber-100 px-1 font-mono text-xs">client/.env</code>{' '}
                    (<code className="rounded bg-amber-100 px-1 font-mono text-xs">VITE_FIREBASE_*</code>) and service
                    account creds to{' '}
                    <code className="rounded bg-amber-100 px-1 font-mono text-xs">services/auth-service/.env</code>, then
                    restart both.
                  </p>
                </div>
              </div>
            </div>
          )}

          {formError && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm font-medium text-red-600 animate-shake">
              {formError}
            </div>
          )}

          {/* Google Sign In */}
          <Button
            variant="outline"
            size="lg"
            className="mt-6 w-full magnetic-btn"
            loading={submitting === 'google'}
            disabled={!isFirebaseConfigured || submitting !== null}
            onClick={() => void handleGoogle()}
          >
            {submitting === 'google' ? (
              'Connecting…'
            ) : (
              <>
                <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#EA4335"
                    d="M12 5.04c1.62 0 3.06.56 4.2 1.64l3.12-3.12C17.46 1.8 14.96.75 12 .75 7.62.75 3.84 3.27 2.06 6.82l3.66 2.84C6.6 7.02 9.05 5.04 12 5.04z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.25 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.68 2.85c2.15-1.99 3.5-4.92 3.5-8.67z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.73 14.34a7.2 7.2 0 0 1 0-4.68L2.06 6.82a11.26 11.26 0 0 0 0 10.36l3.67-2.84z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23.25c3.04 0 5.6-1 7.46-2.72l-3.68-2.85c-1.02.69-2.33 1.09-3.78 1.09-2.95 0-5.4-1.98-6.28-4.63l-3.66 2.84c1.78 3.55 5.56 6.27 11.94 6.27z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </Button>

          <div className="my-7 flex items-center gap-4">
            <span className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">or</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          {/* Email form */}
          <form onSubmit={handleEmail} className="space-y-4">
            <Input
              label="Email address"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              icon={<Mail className="size-4" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!isFirebaseConfigured || submitting !== null}
            />
            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              minLength={6}
              required
              icon={<Lock className="size-4" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={!isFirebaseConfigured || submitting !== null}
            />
            <Button
              type="submit"
              size="lg"
              className="w-full magnetic-btn"
              loading={submitting === 'email'}
              disabled={!isFirebaseConfigured || submitting !== null}
            >
              {mode === 'signin' ? 'Sign in' : 'Create account'}
              <ArrowRight className="size-4" />
            </Button>
          </form>

          <p className="mt-7 text-center text-sm text-slate-400">
            {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              type="button"
              className="font-semibold text-brand-600 hover:text-brand-800 hover:underline transition-colors"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin')
                setFormError(null)
              }}
            >
              {mode === 'signin' ? 'Sign up free' : 'Sign in'}
            </button>
          </p>

          <p className="mt-8 flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="size-3.5" />
            Secured by Firebase Authentication
          </p>
        </div>
      </div>
    </div>
  )
}
