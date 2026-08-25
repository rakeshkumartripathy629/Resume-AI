import { useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import {
  addProject,
  addCertification,
  removeProject,
  removeCertification,
  updateProject,
  updateCertification,
} from '../../features/builder/builderSlice'
import { Field, FieldInput } from './Field'

export function ProjectsSection() {
  const dispatch = useAppDispatch()
  const projects = useAppSelector((state) => state.builder.content.projects)

  return (
    <div className="space-y-3">
      {projects.length === 0 && (
        <p className="rounded-lg bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
          No projects added yet. Showcase your best work.
        </p>
      )}

      {projects.map((item, index) => (
        <div key={index} className="relative rounded-xl border border-slate-200 p-4">
          <button
            type="button"
            onClick={() => dispatch(removeProject(index))}
            className="absolute right-3 top-3 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
            aria-label="Remove project"
          >
            <Trash2 className="size-4" />
          </button>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Project name">
              <FieldInput
                value={item.name}
                placeholder="E-commerce Platform"
                onChange={(e) =>
                  dispatch(updateProject({ index, item: { name: e.target.value } }))
                }
              />
            </Field>
            <Field label="Link">
              <FieldInput
                value={item.link}
                placeholder="github.com/you/project"
                onChange={(e) =>
                  dispatch(updateProject({ index, item: { link: e.target.value } }))
                }
              />
            </Field>
          </div>
          <Field label="Description">
            <textarea
              rows={3}
              value={item.description}
              placeholder="Built a full-stack marketplace with real-time inventory, payment processing, and admin dashboard…"
              onChange={(e) =>
                dispatch(updateProject({ index, item: { description: e.target.value } }))
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </Field>
          <TechChipInput
            value={item.tech}
            onChange={(tech) => dispatch(updateProject({ index, item: { tech } }))}
          />
        </div>
      ))}

      <button
        type="button"
        onClick={() => dispatch(addProject())}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 py-3 text-sm font-semibold text-slate-500 transition-colors hover:border-indigo-400 hover:bg-indigo-50/40 hover:text-indigo-600"
      >
        <Plus className="size-4" />
        Add project
      </button>
    </div>
  )
}

export function CertificationsSection() {
  const dispatch = useAppDispatch()
  const certifications = useAppSelector((state) => state.builder.content.certifications)

  return (
    <div className="space-y-3">
      {certifications.length === 0 && (
        <p className="rounded-lg bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
          No certifications added yet.
        </p>
      )}

      {certifications.map((item, index) => (
        <div key={index} className="relative rounded-xl border border-slate-200 p-4">
          <button
            type="button"
            onClick={() => dispatch(removeCertification(index))}
            className="absolute right-3 top-3 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
            aria-label="Remove certification"
          >
            <Trash2 className="size-4" />
          </button>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Certification name">
              <FieldInput
                value={item.name}
                placeholder="AWS Solutions Architect"
                onChange={(e) =>
                  dispatch(updateCertification({ index, item: { name: e.target.value } }))
                }
              />
            </Field>
            <Field label="Issuer">
              <FieldInput
                value={item.issuer}
                placeholder="Amazon Web Services"
                onChange={(e) =>
                  dispatch(updateCertification({ index, item: { issuer: e.target.value } }))
                }
              />
            </Field>
            <Field label="Date">
              <FieldInput
                type="month"
                value={item.date}
                onChange={(e) =>
                  dispatch(updateCertification({ index, item: { date: e.target.value } }))
                }
              />
            </Field>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => dispatch(addCertification())}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 py-3 text-sm font-semibold text-slate-500 transition-colors hover:border-indigo-400 hover:bg-indigo-50/40 hover:text-indigo-600"
      >
        <Plus className="size-4" />
        Add certification
      </button>
    </div>
  )
}

function TechChipInput({
  value,
  onChange,
}: {
  value: string[]
  onChange: (tech: string[]) => void
}) {
  const [draft, setDraft] = useState('')

  function commit(): void {
    const tag = draft.trim()
    if (tag && !value.includes(tag)) {
      onChange([...value, tag])
      setDraft('')
    } else {
      setDraft('')
    }
  }

  return (
    <div className="mt-3">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-400">
        Technologies
      </span>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault()
              commit()
            }
          }}
          onBlur={commit}
          placeholder="Type a technology and press Enter…"
          className="h-10 flex-1 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
      </div>
      {value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {value.map((tech) => (
            <span
              key={tech}
              className="group inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 py-1 pl-2.5 pr-1.5 text-xs font-semibold text-violet-700"
            >
              {tech}
              <button
                type="button"
                onClick={() => onChange(value.filter((t) => t !== tech))}
                className="rounded-full p-0.5 text-violet-400 transition-colors hover:bg-violet-200 hover:text-violet-700"
                aria-label={`Remove ${tech}`}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
