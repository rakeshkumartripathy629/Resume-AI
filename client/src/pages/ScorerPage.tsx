import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  File,
  FileSearch,
  FileText,
  FolderOpen,
  Loader2,
  Upload,
  X,
} from 'lucide-react'
import { Navbar } from '../components/layout/Navbar'
import { Button } from '../components/ui/Button'
import { TextAreaCard } from '../components/ui/TextArea'
import { ScoreResultView } from '../components/scorer/ScoreResultView'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { scoreResume, setJobDescription, setResumeText } from '../features/scorer/scorerSlice'
import { fetchCoinBalance } from '../features/coins/coinsSlice'
import {
  fetchResumeList,
  fetchResumeDetail,
  clearResumeDetail,
} from '../features/resumes/resumeListSlice'
import { flattenResumeContent } from '../lib/flattenResume'
import { parseResumeFile, ACCEPTED_EXTENSIONS, MAX_FILE_SIZE_MB } from '../lib/parseResume'
import type { ResumeSummary } from '../features/resumes/resumeListSlice'

const MIN_RESUME = 80
const MIN_JD = 40

type ResumeTab = 'saved' | 'upload' | 'paste'

export function ScorerPage() {
  const dispatch = useAppDispatch()
  const { resumeText, jobDescription, status, result, error } = useAppSelector(
    (state) => state.scorer
  )
  const { items: resumeItems, detail: resumeDetail, detailStatus, listStatus } = useAppSelector(
    (state) => state.resumeList
  )
  const [localError, setLocalError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ResumeTab>('saved')
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null)

  // Fetch resume list on mount
  useEffect(() => {
    void dispatch(fetchResumeList())
  }, [dispatch])

  // When a saved resume is selected, fetch its detail and flatten to text
  useEffect(() => {
    if (selectedResumeId) {
      void dispatch(fetchResumeDetail(selectedResumeId))
    } else {
      dispatch(clearResumeDetail())
    }
  }, [selectedResumeId, dispatch])

  // When resume detail arrives, flatten to text
  useEffect(() => {
    if (resumeDetail?.content && activeTab === 'saved') {
      const text = flattenResumeContent(resumeDetail.content)
      dispatch(setResumeText(text))
    }
  }, [resumeDetail, activeTab, dispatch])

  // Clear resume text when switching tabs (except saved which manages its own)
  useEffect(() => {
    if (activeTab !== 'saved' && !selectedResumeId) {
      dispatch(setResumeText(''))
    }
  }, [activeTab, selectedResumeId, dispatch])

  // Refresh coin balance after a successful (charged) score run
  useEffect(() => {
    if (status === 'succeeded') {
      void dispatch(fetchCoinBalance())
    }
  }, [status, dispatch])

  const canScore =
    resumeText.trim().length >= MIN_RESUME && jobDescription.trim().length >= MIN_JD

  function handleSubmit(event: FormEvent): void {
    event.preventDefault()
    setLocalError(null)
    if (resumeText.trim().length < MIN_RESUME) {
      setLocalError(`Resume needs at least ${MIN_RESUME} characters.`)
      return
    }
    if (jobDescription.trim().length < MIN_JD) {
      setLocalError(`Job description needs at least ${MIN_JD} characters.`)
      return
    }
    void dispatch(
      scoreResume({ resumeText: resumeText.trim(), jobDescription: jobDescription.trim() })
    )
  }

  function handleSelectSavedResume(id: string): void {
    setSelectedResumeId(id)
    setActiveTab('saved')
  }

  return (
    <div className="min-h-screen bg-mesh">
      <Navbar authed />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        {/* Stepper */}
        <div className="mb-8 flex items-center gap-3">
          <StepBadge active={!result} done={Boolean(result)} n={1} label="Inputs" />
          <span className={`h-0.5 flex-1 rounded-full transition-colors duration-500 ${result ? 'bg-gradient-to-r from-brand-400 to-accent-400' : 'bg-slate-200'}`} />
          <StepBadge active={status === 'loading'} done={Boolean(result)} n={2} label="Results" />
        </div>

        {!result ? (
          <form onSubmit={handleSubmit}>
            <div className="mb-6 animate-fade-in">
              <h1 className="flex items-center gap-3 text-3xl font-extrabold tracking-tight text-slate-900">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-blue-500 shadow-lg shadow-brand-500/20">
                  <FileSearch className="size-6 text-white" />
                </span>
                Resume Scorer
              </h1>
              <p className="mt-2 text-sm text-slate-400">
                Paste your resume and the job description — AI does the rest.
              </p>
            </div>

            {(localError || error) && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                <AlertTriangle className="mt-0.5 size-5 shrink-0" />
                {localError ?? error}
              </div>
            )}

            <div className="grid gap-5 lg:grid-cols-2">
              {/* Resume Input Card */}
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-brand-50 text-brand-500">
                    <FileSearch className="size-4" />
                  </span>
                  <h3 className="text-sm font-bold text-slate-800">Your resume</h3>
                  {resumeText.trim().length >= MIN_RESUME && (
                    <span className="ml-auto flex items-center gap-1 text-xs font-semibold text-emerald-600">
                      <CheckCircle2 className="size-3.5" />
                      Ready
                    </span>
                  )}
                </div>

                {/* Tab Selector */}
                <div className="mb-4 flex rounded-xl bg-slate-100/80 p-1">
                  {(
                    [
                      { key: 'saved', label: 'Saved Resume', icon: FolderOpen },
                      { key: 'upload', label: 'Upload Resume', icon: Upload },
                      { key: 'paste', label: 'Paste Resume', icon: FileText },
                    ] as const
                  ).map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setActiveTab(key)
                        if (key !== 'saved') setSelectedResumeId(null)
                      }}
                      className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all duration-200 ${
                        activeTab === key
                          ? 'bg-white text-brand-700 shadow-sm'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <Icon className="size-3.5" />
                      {label}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="min-h-[280px]">
                  {activeTab === 'saved' && (
                    <SavedResumeTab
                      items={resumeItems}
                      listStatus={listStatus}
                      selectedId={selectedResumeId}
                      detailStatus={detailStatus}
                      onSelect={handleSelectSavedResume}
                      onUploadTab={() => setActiveTab('upload')}
                    />
                  )}
                  {activeTab === 'upload' && (
                    <UploadResumeTab
                      onResumeParsed={(text) => dispatch(setResumeText(text))}
                      currentText={resumeText}
                    />
                  )}
                  {activeTab === 'paste' && (
                    <PasteResumeTab
                      value={resumeText}
                      onChange={(v) => dispatch(setResumeText(v))}
                      disabled={status === 'loading'}
                    />
                  )}
                </div>

                {/* Resume character count */}
                {activeTab !== 'paste' && resumeText.length > 0 && (
                  <p className={`mt-3 text-xs font-medium ${resumeText.trim().length >= MIN_RESUME ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {resumeText.trim().length >= MIN_RESUME
                      ? `✓ ${resumeText.length.toLocaleString()} characters — ready to score`
                      : `Need ${MIN_RESUME - resumeText.trim().length} more characters (${resumeText.length.toLocaleString()}/${MIN_RESUME})`}
                  </p>
                )}
              </div>

              {/* Job Description Card */}
              <TextAreaCard
                icon={<BriefcaseBusiness className="size-4" />}
                title="Job description"
                placeholder={"Paste the job posting you're targeting…\n\ne.g.\nSenior Frontend Engineer at Acme Corp\nWe're looking for…"}
                value={jobDescription}
                onChange={(v) => dispatch(setJobDescription(v))}
                minChars={MIN_JD}
                disabled={status === 'loading'}
              />
            </div>

            <div className="mt-8 flex flex-col items-center gap-3">
              <Button
                type="submit"
                size="lg"
                loading={status === 'loading'}
                disabled={!canScore || status === 'loading'}
                className="w-full sm:w-auto sm:min-w-64"
              >
                {status !== 'loading' && (
                  <>
                    Score my resume
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
              {status === 'loading' && (
                <p className="animate-pulse text-sm font-semibold text-brand-600">
                  Extracting requirements → matching keywords → generating scorecard…
                </p>
              )}
            </div>
          </form>
        ) : (
          <ScoreResultView />
        )}
      </main>
    </div>
  )
}

/* ─── Saved Resume Tab ─────────────────────────────────────────── */

function SavedResumeTab({
  items,
  listStatus,
  selectedId,
  detailStatus,
  onSelect,
  onUploadTab,
}: {
  items: ResumeSummary[]
  listStatus: string
  selectedId: string | null
  detailStatus: string
  onSelect: (id: string) => void
  onUploadTab: () => void
}) {
  if (listStatus === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-brand-500" />
        <p className="mt-2 text-xs text-slate-400">Loading resumes…</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-slate-50">
          <FolderOpen className="size-7 text-slate-300" />
        </span>
        <p className="mt-4 text-sm font-bold text-slate-700">No saved resume yet</p>
        <p className="mt-1 text-xs text-slate-400">
          Build one in the Resume Builder or upload a file.
        </p>
        <button
          type="button"
          onClick={onUploadTab}
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-brand-50 px-4 py-2 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-100"
        >
          <Upload className="size-3.5" />
          Upload your resume
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {items.map((resume) => {
        const isSelected = selectedId === resume.id
        const isLoadingDetail = isSelected && detailStatus === 'loading'
        const date = new Date(resume.updatedAt)
        const timeAgo = formatTimeAgo(date)

        return (
          <button
            key={resume.id}
            type="button"
            onClick={() => onSelect(resume.id)}
            className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all duration-200 ${
              isSelected
                ? 'border-brand-300 bg-brand-50/60 ring-2 ring-brand-100 shadow-md shadow-brand-500/10'
                : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'
            }`}
          >
            <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
              isSelected
                ? 'bg-gradient-to-br from-brand-500 to-accent-500 text-white'
                : 'bg-slate-50 text-slate-400'
            }`}>
              <FileText className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className={`truncate text-sm font-bold ${isSelected ? 'text-brand-700' : 'text-slate-900'}`}>
                {resume.title}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                {resume.status === 'complete' ? 'Complete' : 'Draft'} · Updated {timeAgo}
              </p>
            </div>
            {isLoadingDetail ? (
              <Loader2 className="size-4 shrink-0 animate-spin text-brand-500" />
            ) : isSelected ? (
              <CheckCircle2 className="size-5 shrink-0 text-brand-500" />
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

/* ─── Upload Resume Tab ────────────────────────────────────────── */

function UploadResumeTab({
  onResumeParsed,
  currentText,
}: {
  onResumeParsed: (text: string) => void
  currentText: string
}) {
  const [dragOver, setDragOver] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(
    async (file: File) => {
      setParseError(null)
      setParsing(true)
      setUploadedFile(null)

      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setParseError(`File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`)
        setParsing(false)
        return
      }

      const result = await parseResumeFile(file)
      setParsing(false)

      if (result.error) {
        setParseError(result.error)
        return
      }

      setUploadedFile({ name: file.name, size: formatFileSize(file.size) })
      onResumeParsed(result.text)
    },
    [onResumeParsed]
  )

  function handleDrop(e: React.DragEvent): void {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) void processFile(file)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const file = e.target.files?.[0]
    if (file) void processFile(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleRemove(): void {
    setUploadedFile(null)
    setParseError(null)
    onResumeParsed('')
  }

  const hasText = currentText.trim().length > 0

  // Show success state after upload
  if (uploadedFile && hasText) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-emerald-50">
          <CheckCircle2 className="size-7 text-emerald-500" />
        </span>
        <p className="mt-4 text-sm font-bold text-slate-900">{uploadedFile.name}</p>
        <p className="mt-0.5 text-xs text-slate-400">{uploadedFile.size} · Ready to score</p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={handleRemove}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:border-red-200 hover:text-red-600"
          >
            <X className="size-3.5" />
            Remove
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-100"
          >
            <Upload className="size-3.5" />
            Replace
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    )
  }

  // Drag-and-drop upload area
  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed py-10 transition-all duration-200 ${
          dragOver
            ? 'border-brand-400 bg-brand-50/60 shadow-glow-brand'
            : 'border-slate-200 bg-slate-50/50 hover:border-brand-300 hover:bg-brand-50/30'
        }`}
      >
        {parsing ? (
          <>
            <Loader2 className="size-8 animate-spin text-brand-500" />
            <p className="mt-3 text-sm font-semibold text-brand-600">Parsing document…</p>
          </>
        ) : (
          <>
            <span className={`flex size-12 items-center justify-center rounded-2xl transition-colors ${
              dragOver ? 'bg-brand-100 text-brand-600' : 'bg-white text-slate-400'
            }`}>
              <Upload className="size-6" />
            </span>
            <p className="mt-3 text-sm font-bold text-slate-700">Upload your resume</p>
            <p className="mt-1 text-xs text-slate-400">
              Drag & drop your resume here
            </p>
            <p className="mt-1 text-xs text-slate-400">or</p>
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-brand-600 shadow-sm ring-1 ring-slate-200 transition-colors hover:ring-brand-300">
              <File className="size-3.5" />
              Browse files
            </span>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS}
        onChange={handleFileChange}
        className="hidden"
      />

      {parseError && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-600">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          {parseError}
        </div>
      )}

      <p className="mt-3 text-center text-[11px] text-slate-400">
        PDF, DOC, DOCX · Max {MAX_FILE_SIZE_MB}MB
      </p>
    </div>
  )
}

/* ─── Paste Resume Tab ─────────────────────────────────────────── */

function PasteResumeTab({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  disabled: boolean
}) {
  const ok = value.trim().length >= MIN_RESUME

  return (
    <div>
      <div className="rounded-xl border border-transparent p-1 focus-within:ring-2 focus-within:ring-brand-100">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={'Paste your full resume text here…\n\ne.g.\nJohn Doe\nSenior Frontend Engineer\n…'}
          disabled={disabled}
          rows={14}
          className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-sm leading-relaxed text-slate-700 placeholder:text-slate-300 transition-all focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-100 focus:shadow-glow-brand"
        />
      </div>
      <div className="mt-2 flex items-center justify-between px-1">
        <span className={`text-xs font-semibold ${ok ? 'text-emerald-600' : 'text-slate-400'}`}>
          {ok ? 'Looks good ✓' : `Minimum ${MIN_RESUME} characters`}
        </span>
        <span className="text-xs font-semibold tabular-nums text-slate-400">
          {value.length.toLocaleString()} chars
        </span>
      </div>
    </div>
  )
}

/* ─── Helpers ──────────────────────────────────────────────────── */

function StepBadge({
  active,
  done,
  n,
  label,
}: {
  active: boolean
  done: boolean
  n: number
  label: string
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`flex size-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
          done
            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
            : active
              ? 'bg-gradient-to-r from-brand-500 to-accent-500 text-white shadow-md shadow-brand-500/30'
              : 'bg-slate-100 text-slate-400'
        }`}
      >
        {done ? '✓' : n}
      </span>
      <span
        className={`text-xs font-bold uppercase tracking-wider ${
          done || active ? 'text-slate-700' : 'text-slate-400'
        }`}
      >
        {label}
      </span>
    </div>
  )
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
