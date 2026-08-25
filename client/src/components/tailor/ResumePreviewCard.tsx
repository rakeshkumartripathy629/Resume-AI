import {
  Mail,
  Phone,
  MapPin,
  Globe,
  Briefcase,
  GraduationCap,
  FolderOpen,
  Award,
  Zap,
} from 'lucide-react'
import type { TailoredResume } from '../../types/tailor'

interface ResumePreviewCardProps {
  resume: TailoredResume
}

export function ResumePreviewCard({ resume }: ResumePreviewCardProps) {
  return (
    <div className="mx-auto max-w-[680px] rounded-2xl border border-slate-100 bg-white p-8 shadow-lg shadow-slate-900/5">
      {/* Header */}
      <header className="border-b border-slate-100 pb-5 text-center">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          {resume.contact.fullName}
        </h1>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-500">
          {resume.contact.email && (
            <span className="inline-flex items-center gap-1">
              <Mail className="size-3" />
              {resume.contact.email}
            </span>
          )}
          {resume.contact.phone && (
            <span className="inline-flex items-center gap-1">
              <Phone className="size-3" />
              {resume.contact.phone}
            </span>
          )}
          {resume.contact.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3" />
              {resume.contact.location}
            </span>
          )}
          {resume.contact.linkedin && (
            <span className="inline-flex items-center gap-1">
              <Globe className="size-3" />
              {resume.contact.linkedin}
            </span>
          )}
          {resume.contact.portfolio && (
            <span className="inline-flex items-center gap-1">
              <Globe className="size-3" />
              {resume.contact.portfolio}
            </span>
          )}
        </div>
      </header>

      {/* Summary */}
      {resume.summary && (
        <section className="mt-5">
          <SectionTitle icon={<Zap className="size-3.5" />} title="Professional Summary" />
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{resume.summary}</p>
        </section>
      )}

      {/* Skills */}
      {resume.skills.length > 0 && (
        <section className="mt-5">
          <SectionTitle icon={<Zap className="size-3.5" />} title="Skills" />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {resume.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-brand-200/60 bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700"
              >
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Experience */}
      {resume.experience.length > 0 && (
        <section className="mt-5">
          <SectionTitle icon={<Briefcase className="size-3.5" />} title="Experience" />
          <div className="mt-3 space-y-4">
            {resume.experience.map((exp) => (
              <div key={exp.role + exp.company}>
                <div className="flex items-baseline justify-between gap-4">
                  <p className="font-bold text-slate-900">{exp.role}</p>
                  <span className="shrink-0 text-[11px] text-slate-400">
                    {[exp.startDate, exp.endDate || 'Present'].filter(Boolean).join(' – ')}
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-500">{exp.company}</p>
                <ul className="mt-1.5 space-y-1">
                  {exp.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="flex items-start gap-2 pl-3 text-xs leading-relaxed text-slate-600"
                    >
                      <span className="mt-1 block size-1 shrink-0 rounded-full bg-brand-400" />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {resume.education.length > 0 && (
        <section className="mt-5">
          <SectionTitle icon={<GraduationCap className="size-3.5" />} title="Education" />
          <div className="mt-3 space-y-3">
            {resume.education.map((edu) => (
              <div key={edu.institution}>
                <div className="flex items-baseline justify-between gap-4">
                  <p className="font-bold text-slate-900">
                    {edu.degree} in {edu.field}
                  </p>
                  <span className="shrink-0 text-[11px] text-slate-400">
                    {[edu.startDate, edu.endDate].filter(Boolean).join(' – ')}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{edu.institution}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {resume.projects.length > 0 && (
        <section className="mt-5">
          <SectionTitle icon={<FolderOpen className="size-3.5" />} title="Projects" />
          <div className="mt-3 space-y-3">
            {resume.projects.map((proj) => (
              <div key={proj.name}>
                <p className="font-bold text-slate-900">{proj.name}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                  {proj.description}
                </p>
                {proj.tech.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {proj.tech.map((t) => (
                      <span
                        key={t}
                        className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Certifications */}
      {resume.certifications.length > 0 && (
        <section className="mt-5">
          <SectionTitle icon={<Award className="size-3.5" />} title="Certifications" />
          <div className="mt-3 space-y-2">
            {resume.certifications.map((cert) => (
              <div key={cert.name} className="flex items-baseline justify-between">
                <p className="font-semibold text-slate-900">{cert.name}</p>
                <span className="text-[11px] text-slate-400">{cert.issuer}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <h3 className="flex items-center gap-1.5 border-b border-slate-100 pb-1.5 text-xs font-bold uppercase tracking-wider text-slate-900">
      {icon}
      {title}
    </h3>
  )
}
