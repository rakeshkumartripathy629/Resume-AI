import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  FileText,
  Lock,
  Mail,
  Mic,
  Settings2,
  Target,
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
    <div className="flex min-h-screen bg-white">
      {/* Branding panel */}
      <div className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-700 via-violet-700 to-fuchsia-700 p-12 lg:flex">
        <div className="pointer-events-none absolute -left-24 -top-24 size-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-16 size-[28rem] rounded-full bg-fuchsia-400/20 blur-3xl" />
        <div className="pointer-events-none absolute left-1/3 top-1/2 size-72 rounded-full bg-indigo-400/20 blur-3xl" />

        <Logo light />

        <div className="relative">
          <h1 className="max-w-md text-4xl font-extrabold leading-tight text-white">
            Land your dream job with an{' '}
            <span className="bg-gradient-to-r from-amber-200 to-yellow-100 bg-clip-text text-transparent">
              AI career copilot
            </span>
          </h1>
          <ul className="mt-10 space-y-4">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3.5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                  <Icon className="size-5 text-white" />
                </span>
                <span className="text-sm font-medium text-indigo-50">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs font-medium text-indigo-200">
          Powered by LangChain + LangGraph agents
        </p>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {mode === 'signin'
              ? 'Sign in to continue building your career.'
              : 'Start scoring resumes and acing interviews in minutes.'}
          </p>

          {!isFirebaseConfigured && (
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
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
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm font-medium text-red-600">
              {formError}
            </div>
          )}

          <Button
            variant="outline"
            size="lg"
            className="mt-6 w-full"
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
              className="w-full"
              loading={submitting === 'email'}
              disabled={!isFirebaseConfigured || submitting !== null}
            >
              {mode === 'signin' ? 'Sign in' : 'Create account'}
              <ArrowRight className="size-4" />
            </Button>
          </form>

          <p className="mt-7 text-center text-sm text-slate-500">
            {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              type="button"
              className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin')
                setFormError(null)
              }}
            >
              {mode === 'signin' ? 'Sign up free' : 'Sign in'}
            </button>
          </p>

          <p className="mt-8 flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <FileText className="size-3.5" />
            Secured by Firebase Authentication
          </p>
        </div>
      </div>
    </div>
  )
}
