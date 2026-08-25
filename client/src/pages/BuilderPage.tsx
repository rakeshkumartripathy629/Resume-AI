import { useEffect, useRef, useState } from 'react'
import { Check, CloudOff, Download, FileText, FileUp, Loader2 } from 'lucide-react'
import { Navbar } from '../components/layout/Navbar'
import { Button } from '../components/ui/Button'
import { PersonalInfoSection } from '../components/builder/PersonalEducationSections'
import { EducationSection } from '../components/builder/PersonalEducationSections'
import {
  ExperienceSection,
  SkillsSection,
} from '../components/builder/ExperienceSkillsSections'
import { ProjectsSection, CertificationsSection } from '../components/builder/ProjectsSections'
import { ResumePreview } from '../components/builder/ResumePreview'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { saveBuilderResume, setTitle, fetchVersions, restoreVersion } from '../features/builder/builderSlice'
import type { SaveStatus } from '../features/builder/builderSlice'
import { contentToTailoredResume } from '../lib/builderToTailored'
import { generateResumePdf } from '../lib/generatePdf'
import { generateResumeDocx } from '../lib/generateDocx'

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
  const { id, title, content, status, version, versions } = useAppSelector((state) => state.builder)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [exporting, setExporting] = useState<'pdf' | 'docx' | null>(null)

  useEffect(() => {
    if (id) {
      void dispatch(fetchVersions(id))
    }
  }, [dispatch, id])

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

  function handleDownloadPdf() {
    setExporting('pdf')
    try {
      const resume = contentToTailoredResume(content)
      generateResumePdf(resume, `${title.replace(/\s+/g, '_')}.pdf`)
    } finally {
      setTimeout(() => setExporting(null), 500)
    }
  }

  async function handleDownloadDocx() {
    setExporting('docx')
    try {
      const resume = contentToTailoredResume(content)
      await generateResumeDocx(resume, `${title.replace(/\s+/g, '_')}.docx`)
    } finally {
      setTimeout(() => setExporting(null), 500)
    }
  }

  function handleRestoreVersion(v: number) {
    if (!id || v === version) return
    void dispatch(restoreVersion({ resumeId: id, version: v }))
  }

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
          {version > 1 && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-500">
              v{version}
            </span>
          )}
          {versions.length > 0 && (
            <select
              onChange={(e) => handleRestoreVersion(Number(e.target.value))}
              value=""
              className="h-9 rounded-xl border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-500 transition-all hover:border-brand-300 focus:border-brand-400 focus:outline-none"
            >
              <option value="" disabled>
                Restore version…
              </option>
              {versions.map((v) => (
                <option key={v.version} value={v.version}>
                  v{v.version} — {new Date(v.savedAt).toLocaleDateString()}
                </option>
              ))}
            </select>
          )}
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-xs font-medium text-slate-400 md:block">
              Autosaves as you type
            </span>
            <Button
              variant="ghost"
              size="sm"
              loading={exporting === 'pdf'}
              disabled={!!exporting}
              onClick={handleDownloadPdf}
              className="text-slate-500 hover:text-brand-600"
            >
              <FileText className="size-4" /> PDF
            </Button>
            <Button
              variant="ghost"
              size="sm"
              loading={exporting === 'docx'}
              disabled={!!exporting}
              onClick={handleDownloadDocx}
              className="text-slate-500 hover:text-brand-600"
            >
              <FileUp className="size-4" /> DOCX
            </Button>
          </div>
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

          <FormCard step={5} title="Projects">
            <ProjectsSection />
          </FormCard>

          <FormCard step={6} title="Certifications">
            <CertificationsSection />
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
