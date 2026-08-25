import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  FileText,
  FileDown,
  RotateCcw,
  Sparkles,
  Pencil,
  Eye,
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { TailorProgress } from '../components/tailor/TailorProgress'
import { ATSScoreCard } from '../components/tailor/ATSScoreCard'
import { ResumeComparison } from '../components/tailor/ResumeComparison'
import { ResumePreviewCard } from '../components/tailor/ResumePreviewCard'
import { ResumeEditor } from '../components/tailor/ResumeEditor'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import {
  tailorResume,
  setTailorInputs,
  updateEditedResume,
  resetTailor,
} from '../features/tailor/tailorSlice'
import { generateResumePdf } from '../lib/generatePdf'
import { generateResumeDocx } from '../lib/generateDocx'
import type { TailoredResume } from '../types/tailor'

type Tab = 'ats' | 'compare' | 'preview' | 'edit'

export function TailorPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { status, result, editedResume, error } = useAppSelector((s) => s.tailor)
  const { resumeText, jobDescription } = useAppSelector((s) => s.scorer)
  const [activeTab, setActiveTab] = useState<Tab>('ats')
  const [downloading, setDownloading] = useState<'pdf' | 'docx' | null>(null)

  // Auto-kick-off tailoring on mount if scorer inputs exist
  useEffect(() => {
    if (!resumeText || !jobDescription) {
      navigate('/scorer', { replace: true })
      return
    }
    if (status === 'idle') {
      dispatch(setTailorInputs({ resumeText, jobDescription }))
      dispatch(tailorResume({ resumeText, jobDescription }))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSaveEdits = (updated: TailoredResume) => {
    dispatch(updateEditedResume(updated))
    setActiveTab('preview')
  }

  const handleDownloadPdf = async () => {
    if (!editedResume) return
    setDownloading('pdf')
    try {
      await generateResumePdf(editedResume)
    } catch (err) {
      console.error('PDF generation failed:', err)
    } finally {
      setTimeout(() => setDownloading(null), 1000)
    }
  }

  const handleDownloadDocx = async () => {
    if (!editedResume) return
    setDownloading('docx')
    try {
      await generateResumeDocx(editedResume)
    } catch (err) {
      console.error('DOCX generation failed:', err)
    } finally {
      setTimeout(() => setDownloading(null), 1000)
    }
  }

  const handleRetry = () => {
    dispatch(resetTailor())
    dispatch(tailorResume({ resumeText, jobDescription }))
  }

  const handleBackToScorer = () => {
    dispatch(resetTailor())
    navigate('/scorer')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-brand-50/30">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <button
              onClick={handleBackToScorer}
              className="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-400 transition-colors hover:text-brand-600"
            >
              <ArrowLeft className="size-4" />
              Back to score
            </button>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              <Sparkles className="mr-2 inline size-5 text-brand-500" />
              ATS Resume Tailoring
            </h1>
          </div>

          {status === 'succeeded' && editedResume && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleDownloadPdf}
                disabled={downloading === 'pdf'}
              >
                <FileText className="size-4" />
                {downloading === 'pdf' ? 'Generating...' : 'PDF'}
              </Button>
              <Button
                onClick={handleDownloadDocx}
                disabled={downloading === 'docx'}
              >
                <FileDown className="size-4" />
                {downloading === 'docx' ? 'Generating...' : 'DOCX'}
              </Button>
            </div>
          )}
        </div>

        {status === 'tailoring' && <TailorProgress />}

        {status === 'failed' && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <p className="text-sm font-semibold text-red-700">
              {error ?? 'Tailoring failed. Please try again.'}
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <Button variant="outline" onClick={handleBackToScorer}>
                Back to score
              </Button>
              <Button onClick={handleRetry}>
                <RotateCcw className="size-4" />
                Retry
              </Button>
            </div>
          </div>
        )}

        {status === 'succeeded' && result && (
          <div className="space-y-6 animate-fade-in">
            {result.tailoringNotes.length > 0 && (
              <div className="rounded-xl border border-brand-200/60 bg-brand-50/50 p-5">
                <h3 className="mb-2 text-xs font-bold text-brand-700 uppercase tracking-wider">
                  What changed
                </h3>
                <ul className="space-y-1">
                  {result.tailoringNotes.map((note) => (
                    <li key={note} className="flex items-start gap-2 text-xs text-brand-700">
                      <span className="mt-1 block size-1 shrink-0 rounded-full bg-brand-400" />
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
              {([
                { key: 'ats', label: 'ATS Score', icon: <Sparkles className="size-3.5" /> },
                { key: 'compare', label: 'Compare', icon: <RotateCcw className="size-3.5" /> },
                { key: 'preview', label: 'Preview', icon: <Eye className="size-3.5" /> },
                { key: 'edit', label: 'Edit', icon: <Pencil className="size-3.5" /> },
              ] as const).map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                    activeTab === key
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>

            <div className="animate-fade-in">
              {activeTab === 'ats' && <ATSScoreCard analysis={result.atsAnalysis} />}
              {activeTab === 'compare' && (
                <ResumeComparison
                  original={resumeText}
                  tailored={result.tailoredResume}
                />
              )}
              {activeTab === 'preview' && editedResume && (
                <ResumePreviewCard resume={editedResume} />
              )}
              {activeTab === 'edit' && editedResume && (
                <ResumeEditor resume={editedResume} onSave={handleSaveEdits} />
              )}
            </div>

            <div className="flex flex-col justify-between gap-3 border-t border-slate-100 pt-6 sm:flex-row">
              <Button variant="outline" onClick={handleRetry}>
                <RotateCcw className="size-4" />
                Regenerate
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleDownloadPdf}
                  disabled={downloading === 'pdf'}
                >
                  <FileText className="size-4" />
                  Download PDF
                </Button>
                <Button
                  onClick={handleDownloadDocx}
                  disabled={downloading === 'docx'}
                >
                  <FileDown className="size-4" />
                  Download DOCX
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
