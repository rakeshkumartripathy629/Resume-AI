import { useState } from 'react'
import { ArrowLeftRight } from 'lucide-react'
import type { TailoredResume } from '../../types/tailor'

function ResumeTextBlock({ resume, label }: { resume: TailoredResume; label: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
      <span className="mb-3 inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
        {label}
      </span>
      <div className="space-y-3 text-sm text-slate-700">
        {resume.contact.fullName && (
          <p className="font-bold text-slate-900">{resume.contact.fullName}</p>
        )}
        {resume.summary && (
          <div>
            <p className="mb-1 text-[10px] font-bold text-slate-400 uppercase">Summary</p>
            <p className="leading-relaxed">{resume.summary}</p>
          </div>
        )}
        {resume.skills.length > 0 && (
          <div>
            <p className="mb-1 text-[10px] font-bold text-slate-400 uppercase">Skills</p>
            <p>{resume.skills.join(', ')}</p>
          </div>
        )}
        {resume.experience.length > 0 && (
          <div>
            <p className="mb-1 text-[10px] font-bold text-slate-400 uppercase">Experience</p>
            {resume.experience.map((exp) => (
              <div key={exp.role + exp.company} className="mb-2">
                <p className="font-semibold">{exp.role} — {exp.company}</p>
                <ul className="mt-1 space-y-0.5 pl-4">
                  {exp.bullets.map((b) => (
                    <li key={b} className="list-disc text-xs leading-relaxed">{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
        {resume.education.length > 0 && (
          <div>
            <p className="mb-1 text-[10px] font-bold text-slate-400 uppercase">Education</p>
            {resume.education.map((edu) => (
              <p key={edu.institution} className="text-xs">
                {edu.degree} in {edu.field} — {edu.institution}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface ResumeComparisonProps {
  original: string
  tailored: TailoredResume
}

export function ResumeComparison({ original, tailored }: ResumeComparisonProps) {
  const [view, setView] = useState<'side' | 'original' | 'tailored'>('side')

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={() => setView('side')}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            view === 'side'
              ? 'bg-brand-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <ArrowLeftRight className="mr-1 inline size-3" />
          Side by Side
        </button>
        <button
          onClick={() => setView('original')}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            view === 'original'
              ? 'bg-brand-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Original
        </button>
        <button
          onClick={() => setView('tailored')}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            view === 'tailored'
              ? 'bg-brand-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Tailored
        </button>
      </div>

      {view === 'side' ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <ResumeTextBlock
            label="Original"
            resume={{
              contact: { fullName: '', email: '', phone: '', location: '', linkedin: '', portfolio: '' },
              summary: original.split('\n').slice(0, 5).join(' '),
              skills: [],
              experience: [],
              education: [],
              projects: [],
              certifications: [],
            }}
          />
          <ResumeTextBlock label="Tailored" resume={tailored} />
        </div>
      ) : view === 'original' ? (
        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-700">
            {original}
          </pre>
        </div>
      ) : (
        <ResumeTextBlock label="Tailored" resume={tailored} />
      )}
    </div>
  )
}
