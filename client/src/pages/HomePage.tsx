import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  FileSearch,
  FileText,
  Map,
  Mic,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'

const features = [
  {
    icon: FileSearch,
    title: 'AI Resume Scoring',
    description:
      'Upload your resume and a job description — get an ATS-style score with keyword, skills, and impact analysis in seconds.',
    gradient: 'from-brand-500 to-blue-500',
  },
  {
    icon: Mic,
    title: 'Mock Interviews',
    description:
      'Practice with an AI interviewer tailored to your target role. Get per-answer feedback and a full performance report.',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    icon: FileText,
    title: 'Smart Resume Builder',
    description:
      'Build clean, recruiter-friendly resumes section by section with AI suggestions that make your experience shine.',
    gradient: 'from-fuchsia-500 to-pink-600',
  },
  {
    icon: Map,
    title: 'Career Roadmaps',
    description:
      'Tell us where you want to go — get a personalized week-by-week learning roadmap bridging your skill gaps.',
    gradient: 'from-amber-500 to-orange-500',
  },
]

const steps = [
  {
    number: '01',
    title: 'Create your account',
    description: 'Sign up free with Google or email — your workspace is ready instantly.',
  },
  {
    number: '02',
    title: 'Add your resume & target role',
    description: 'Paste your resume and the job description you are chasing, or start fresh in the builder.',
  },
  {
    number: '03',
    title: 'Practice, improve, land it',
    description: 'Score, rebuild, rehearse interviews and follow your roadmap until you get the offer.',
  },
]

export function HomePage() {
  const { currentUser } = useAuth()
  const dashboardCta = (
    <Link
      to={currentUser ? '/dashboard' : '/login'}
      className="group inline-flex h-13 items-center gap-2.5 rounded-2xl bg-gradient-to-r from-brand-600 to-accent-600 px-8 text-base font-semibold text-white shadow-xl shadow-brand-500/30 transition-all hover:from-brand-700 hover:to-accent-700 hover:shadow-brand-500/40 hover:brightness-110 active:scale-[0.98]"
    >
      {currentUser ? 'Go to Dashboard' : 'Get started free'}
      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
    </Link>
  )

  return (
    <div className="min-h-screen bg-white">
      <Navbar authed={Boolean(currentUser)} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-32 left-1/4 size-[34rem] rounded-full bg-brand-200/40 blur-[100px]" />
        <div className="pointer-events-none absolute -right-24 top-24 size-[28rem] rounded-full bg-accent-200/30 blur-[80px]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[length:56px_56px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" />

        <div className="relative mx-auto max-w-7xl px-4 pb-28 pt-24 text-center sm:px-6 lg:px-8">
          <div className="animate-fade-in mx-auto inline-flex items-center gap-2 rounded-full border border-brand-200/80 bg-brand-50/80 px-4 py-1.5 text-xs font-bold text-brand-700 backdrop-blur-sm">
            <Sparkles className="size-3.5" />
            Powered by LangChain + LangGraph agents
          </div>
          <h1 className="animate-fade-in delay-100 mx-auto mt-7 max-w-3xl text-5xl font-extrabold leading-[1.06] tracking-tight text-slate-900 sm:text-6xl">
            Your AI copilot for{' '}
            <span className="text-gradient">
              landing the job
            </span>
          </h1>
          <p className="animate-fade-in delay-200 mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-500">
            Score your resume against any job description, practice real mock interviews with AI,
            and build resumes that pass the ATS — all in one workspace.
          </p>
          <div className="animate-fade-in delay-300 mt-11 flex flex-col items-center justify-center gap-4 sm:flex-row">
            {dashboardCta}
            <a
              href="#features"
              className="inline-flex h-13 items-center rounded-2xl border border-slate-200 bg-white px-8 text-base font-semibold text-slate-600 shadow-sm transition-all hover:border-brand-300 hover:text-brand-600 hover:shadow-md"
            >
              Explore features
            </a>
          </div>
          <p className="animate-fade-in delay-400 mt-7 flex items-center justify-center gap-2 text-xs font-medium text-slate-400">
            <CheckCircle2 className="size-4 text-emerald-500" />
            Free to start · No credit card required
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-slate-100 bg-mesh py-28 scroll-mt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-brand-600">Features</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Everything you need to outshine the competition
            </h2>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, description, gradient }, index) => (
              <div
                key={title}
                className={`animate-fade-in delay-${(index + 1) * 100} group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 card-hover`}
              >
                <span
                  className={`inline-flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} shadow-lg`}
                >
                  <Icon className="size-6 text-white" />
                </span>
                <h3 className="mt-5 text-lg font-bold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{description}</p>
                <span
                  className={`absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-gradient-to-r ${gradient} transition-transform duration-500 group-hover:scale-x-100`}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
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
              <div key={step.number} className={`animate-slide-up relative text-center delay-${(index + 1) * 100}`}>
                <div className="mx-auto flex size-16 items-center justify-center rounded-2xl border-2 border-brand-100 bg-white shadow-lg shadow-brand-500/10">
                  <Brain className="size-7 text-brand-600" />
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

      {/* CTA */}
      <section className="px-4 pb-28 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-accent-700 to-pink-700 px-8 py-16 text-center shadow-2xl shadow-brand-500/25">
          <div className="pointer-events-none absolute -left-20 -top-20 size-72 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-16 size-80 rounded-full bg-pink-300/20 blur-3xl" />
          <h2 className="relative text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Ready to level up your job hunt?
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-indigo-100">
            Join thousands of candidates using AI to sharpen their resume and nail their interviews.
          </p>
          <div className="relative mt-9 flex justify-center">
            <Link
              to={currentUser ? '/dashboard' : '/login'}
              className="group inline-flex h-13 items-center gap-2.5 rounded-2xl bg-white px-8 text-base font-bold text-brand-700 shadow-xl transition-all hover:bg-brand-50 active:scale-[0.98]"
            >
              {currentUser ? 'Open my workspace' : 'Start now — it\u2019s free'}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
