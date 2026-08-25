import { useState, useCallback } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '../ui/Button'
import type { TailoredResume, TailoredExperience } from '../../types/tailor'

interface ResumeEditorProps {
  resume: TailoredResume
  onSave: (updated: TailoredResume) => void
}

function EditSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-slate-100 bg-white p-5">
      <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-900">{title}</h4>
      {children}
    </section>
  )
}

function Field({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  multiline?: boolean
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-semibold text-slate-500">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 transition-colors focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 transition-colors focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
        />
      )}
    </div>
  )
}

export function ResumeEditor({ resume, onSave }: ResumeEditorProps) {
  const [draft, setDraft] = useState<TailoredResume>(resume)

  const update = useCallback(<K extends keyof TailoredResume>(key: K, value: TailoredResume[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }, [])

  const updateExp = useCallback(
    (index: number, patch: Partial<TailoredExperience>) => {
      setDraft((prev) => ({
        ...prev,
        experience: prev.experience.map((exp, i) =>
          i === index ? { ...exp, ...patch } : exp
        ),
      }))
    },
    []
  )

  const addBullet = useCallback((expIndex: number) => {
    setDraft((prev) => ({
      ...prev,
      experience: prev.experience.map((exp, i) =>
        i === expIndex ? { ...exp, bullets: [...exp.bullets, ''] } : exp
      ),
    }))
  }, [])

  const updateBullet = useCallback(
    (expIndex: number, bulletIndex: number, value: string) => {
      setDraft((prev) => ({
        ...prev,
        experience: prev.experience.map((exp, i) =>
          i === expIndex
            ? { ...exp, bullets: exp.bullets.map((b, j) => (j === bulletIndex ? value : b)) }
            : exp
        ),
      }))
    },
    []
  )

  const removeBullet = useCallback((expIndex: number, bulletIndex: number) => {
    setDraft((prev) => ({
      ...prev,
      experience: prev.experience.map((exp, i) =>
        i === expIndex
          ? { ...exp, bullets: exp.bullets.filter((_, j) => j !== bulletIndex) }
          : exp
      ),
    }))
  }, [])

  const removeExp = useCallback((index: number) => {
    setDraft((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index),
    }))
  }, [])

  const addExp = useCallback(() => {
    setDraft((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        { role: '', company: '', startDate: '', endDate: '', current: false, bullets: [''] },
      ],
    }))
  }, [])

  return (
    <div className="space-y-4">
      {/* Contact */}
      <EditSection title="Contact Information">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Full Name"
            value={draft.contact.fullName}
            onChange={(v) => update('contact', { ...draft.contact, fullName: v })}
          />
          <Field
            label="Email"
            value={draft.contact.email}
            onChange={(v) => update('contact', { ...draft.contact, email: v })}
          />
          <Field
            label="Phone"
            value={draft.contact.phone}
            onChange={(v) => update('contact', { ...draft.contact, phone: v })}
          />
          <Field
            label="Location"
            value={draft.contact.location}
            onChange={(v) => update('contact', { ...draft.contact, location: v })}
          />
          <Field
            label="LinkedIn"
            value={draft.contact.linkedin}
            onChange={(v) => update('contact', { ...draft.contact, linkedin: v })}
          />
          <Field
            label="Portfolio"
            value={draft.contact.portfolio}
            onChange={(v) => update('contact', { ...draft.contact, portfolio: v })}
          />
        </div>
      </EditSection>

      {/* Summary */}
      <EditSection title="Professional Summary">
        <Field
          label=""
          value={draft.summary}
          onChange={(v) => update('summary', v)}
          multiline
        />
      </EditSection>

      {/* Skills */}
      <EditSection title="Skills">
        <Field
          label="Skills (comma separated)"
          value={draft.skills.join(', ')}
          onChange={(v) =>
            update(
              'skills',
              v
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
            )
          }
        />
      </EditSection>

      {/* Experience */}
      <EditSection title="Experience">
        <div className="space-y-4">
          {draft.experience.map((exp, i) => (
            <div key={i} className="rounded-lg border border-slate-100 bg-slate-50/50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase">
                  Position {i + 1}
                </span>
                <button
                  onClick={() => removeExp(i)}
                  className="text-red-400 transition-colors hover:text-red-600"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Role"
                  value={exp.role}
                  onChange={(v) => updateExp(i, { role: v })}
                />
                <Field
                  label="Company"
                  value={exp.company}
                  onChange={(v) => updateExp(i, { company: v })}
                />
                <Field
                  label="Start Date"
                  value={exp.startDate}
                  onChange={(v) => updateExp(i, { startDate: v })}
                />
                <Field
                  label="End Date"
                  value={exp.endDate}
                  onChange={(v) => updateExp(i, { endDate: v })}
                />
              </div>
              <div className="mt-3">
                <label className="mb-1 block text-[11px] font-semibold text-slate-500">
                  Achievement Bullets
                </label>
                <div className="space-y-2">
                  {exp.bullets.map((bullet, j) => (
                    <div key={j} className="flex gap-2">
                      <input
                        value={bullet}
                        onChange={(e) => updateBullet(i, j, e.target.value)}
                        className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
                      />
                      <button
                        onClick={() => removeBullet(i, j)}
                        className="text-slate-300 transition-colors hover:text-red-500"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addBullet(i)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:text-brand-700"
                  >
                    <Plus className="size-3" />
                    Add bullet
                  </button>
                </div>
              </div>
            </div>
          ))}
          <button
            onClick={addExp}
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            <Plus className="size-3.5" />
            Add experience
          </button>
        </div>
      </EditSection>

      {/* Save */}
      <div className="flex justify-end pt-2">
        <Button onClick={() => onSave(draft)}>
          <Pencil className="size-4" />
          Save changes
        </Button>
      </div>
    </div>
  )
}
