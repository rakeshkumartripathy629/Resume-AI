import { useEffect, useRef } from 'react'
import { Check, CloudOff, Loader2 } from 'lucide-react'
import { Navbar } from '../components/layout/Navbar'
import { PersonalInfoSection } from '../components/builder/PersonalEducationSections'
import { EducationSection } from '../components/builder/PersonalEducationSections'
import {
  ExperienceSection,
  SkillsSection,
} from '../components/builder/ExperienceSkillsSections'
import { ResumePreview } from '../components/builder/ResumePreview'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { saveBuilderResume, setTitle } from '../features/builder/builderSlice'
import type { SaveStatus } from '../features/builder/builderSlice'

const AUTOSAVE_DELAY_MS = 1500

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === 'saving') {
    return (
      <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
        <Loader2 className="size-3.5 animate-spin" />
        Saving…
      </span>
    )
  }
  if (status === 'saved') {
    return (
      <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
        <Check className="size-3.5" />
        Saved
      </span>
    )
  }
  if (status === 'error') {
    return (
      <span className="flex items-center gap-1.5 text-xs font-semibold text-red-500">
        <CloudOff className="size-3.5" />
        Save failed
      </span>
    )
  }
  return (
    <span className="text-xs font-semibold text-slate-400">
      {status === 'dirty' ? 'Unsaved changes' : ''}
    </span>
  )
}

export function BuilderPage() {
  const dispatch = useAppDispatch()
  const { id, title, content, status } = useAppSelector((state) => state.builder)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (status !== 'dirty') return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      void dispatch(saveBuilderResume({ id, title, content }))
    }, AUTOSAVE_DELAY_MS)
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [dispatch, id, title, content, status])

  return (
    <div className="min-h-screen bg-mesh">
      <Navbar authed />

      {/* Builder toolbar */}
      <div className="sticky top-[4.5rem] z-30 border-b border-slate-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6 lg:px-8">
          <input
            value={title}
            onChange={(e) => dispatch(setTitle(e.target.value))}
            placeholder="Resume title"
            className="h-9 w-full max-w-xs rounded-xl border border-transparent px-3 text-sm font-bold text-slate-900 transition-all hover:border-slate-200 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100 sm:w-auto"
          />
          <SaveIndicator status={status} />
          <span className="ml-auto hidden text-xs font-medium text-slate-400 md:block">
            Autosaves as you type
          </span>
        </div>
      </div>

      <main className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,6fr)] lg:px-8">
        {/* Form column */}
        <div className="space-y-5">
          <FormCard step={1} title="Personal info & summary">
            <PersonalInfoSection />
          </FormCard>

          <FormCard step={2} title="Work experience">
            <ExperienceSection />
          </FormCard>

          <FormCard step={3} title="Education">
            <EducationSection />
          </FormCard>

          <FormCard step={4} title="Skills">
            <SkillsSection />
          </FormCard>
        </div>

        {/* Preview column */}
        <div className="lg:sticky lg:top-32 lg:self-start">
          <p className="mb-3 text-xs font-extrabold uppercase tracking-widest text-slate-300">
            Live preview
          </p>
          <ResumePreview />
        </div>
      </main>
    </div>
  )
}

function FormCard({
  step,
  title,
  children,
}: {
  step: number
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2.5 font-bold text-slate-900">
        <span className="flex size-7 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-600 text-xs font-bold text-white shadow-md shadow-fuchsia-500/20">
          {step}
        </span>
        {title}
      </h2>
      {children}
    </section>
  )
}
