import { useAppSelector } from '../../store/hooks'
import type { ResumeContent } from '../../types/resume'

function formatDate(value: string, current = false): string {
  if (current) return 'Present'
  if (!value) return ''
  const [year, month] = value.split('-')
  if (!month) return year ?? value
  const date = new Date(Number(year), Number(month) - 1)
  return date.toLocaleString('en-US', { month: 'short', year: 'numeric' })
}

function dateRange(start: string, end: string, current = false): string {
  const from = formatDate(start)
  const to = formatDate(end, current)
  if (!from && !to) return ''
  return `${from}${from || to ? ' — ' : ''}${to || from}`
}

export function ResumePreview() {
  const { title, content } = useAppSelector((state) => state.builder)
  const info = content.personalInfo

  const contacts = [info.email, info.phone, info.location].filter(Boolean)

  return (
    <div className="mx-auto max-w-[46rem] rounded-xl bg-white p-10 shadow-sm ring-1 ring-slate-200">
      {/* Header */}
      <header className="border-b-2 border-slate-900 pb-4 text-center">
        <h1 className="text-3xl font-extrabold uppercase tracking-wide text-slate-900">
          {info.fullName || 'Your Name'}
        </h1>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          {title !== 'Untitled resume' ? title : 'Professional Title'}
        </p>
        {(contacts.length > 0 || info.linkedin || info.portfolio) && (
          <p className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-0.5 text-xs text-slate-600">
            {contacts.map((c) => (
              <span key={c}>{c}</span>
            ))}
            {info.linkedin && <span className="text-indigo-600">{info.linkedin}</span>}
            {info.portfolio && <span className="text-indigo-600">{info.portfolio}</span>}
          </p>
        )}
      </header>

      {/* Summary */}
      {info.summary && (
        <Section title="Summary">
          <p className="text-sm leading-relaxed text-slate-700">{info.summary}</p>
        </Section>
      )}

      {/* Experience */}
      {content.experience.length > 0 && (
        <Section title="Experience">
          <div className="space-y-4">
            {content.experience.map((item, i) => (
              <div key={i}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-bold text-slate-900">
                    {item.role || 'Role'}
                    {item.company && (
                      <span className="font-semibold text-slate-500"> · {item.company}</span>
                    )}
                  </p>
                  <span className="shrink-0 text-xs font-medium tabular-nums text-slate-500">
                    {dateRange(item.startDate, item.endDate, item.current)}
                  </span>
                </div>
                {item.bullets.filter(Boolean).length > 0 && (
                  <ul className="mt-1.5 list-disc space-y-1 pl-5">
                    {item.bullets.filter(Boolean).map((bullet, j) => (
                      <li key={j} className="text-sm leading-snug text-slate-700">
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Education */}
      {content.education.length > 0 && (
        <Section title="Education">
          <div className="space-y-3">
            {content.education.map((item, i) => (
              <div key={i} className="flex items-baseline justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {item.degree}
                    {item.field ? `, ${item.field}` : ''}
                  </p>
                  <p className="text-sm text-slate-600">
                    {item.institution}
                    {item.grade ? ` · ${item.grade}` : ''}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-medium tabular-nums text-slate-500">
                  {dateRange(item.startDate, item.endDate)}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Skills */}
      {content.skills.length > 0 && (
        <Section title="Skills">
          <div className="flex flex-wrap gap-x-2 gap-y-1.5">
            {content.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700"
              >
                {skill}
              </span>
            ))}
          </div>
        </Section>
      )}

      {isCompletelyEmpty(content) && (
        <div className="py-16 text-center">
          <p className="text-sm text-slate-400">
            Start filling the form — your resume preview builds here live.
          </p>
        </div>
      )}
    </div>
  )
}

function isCompletelyEmpty(content: ResumeContent): boolean {
  return (
    Object.values(content.personalInfo).every((v) => !v) &&
    content.experience.length === 0 &&
    content.education.length === 0 &&
    content.skills.length === 0
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2.5 text-xs font-extrabold uppercase tracking-[0.18em] text-indigo-700">
        {title}
      </h2>
      {children}
    </section>
  )
}
