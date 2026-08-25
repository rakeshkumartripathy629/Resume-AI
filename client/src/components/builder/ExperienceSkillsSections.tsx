import { useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import {
  addExperience,
  addSkill,
  removeExperience,
  removeSkill,
  updateExperience,
} from '../../features/builder/builderSlice'
import { Field, FieldInput } from './Field'

export function ExperienceSection() {
  const dispatch = useAppDispatch()
  const experience = useAppSelector((state) => state.builder.content.experience)
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div className="space-y-3">
      {experience.length === 0 && (
        <p className="rounded-lg bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
          No experience added yet. Add your most recent role first.
        </p>
      )}

      {experience.map((item, index) => {
        const isOpen = openIndex === index
        return (
          <div key={index} className="overflow-hidden rounded-xl border border-slate-200">
            <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5">
              <button
                type="button"
                className="flex flex-1 items-center gap-2 text-left"
                onClick={() => setOpenIndex(isOpen ? null : index)}
              >
                <span className="text-sm font-bold text-slate-700">
                  {item.role || 'New role'}
                </span>
                {item.company && (
                  <span className="text-xs font-medium text-slate-400">· {item.company}</span>
                )}
              </button>
              <div className="flex items-center gap-1">
                {(item.bullets[0] || item.company) && (
                  <span className="mr-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                    ✓ filled
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => dispatch(removeExperience(index))}
                  className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                  aria-label="Remove experience"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>

            {isOpen && (
              <div className="space-y-3 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Role">
                    <FieldInput
                      value={item.role}
                      placeholder="Senior Frontend Engineer"
                      onChange={(e) =>
                        dispatch(updateExperience({ index, item: { role: e.target.value } }))
                      }
                    />
                  </Field>
                  <Field label="Company">
                    <FieldInput
                      value={item.company}
                      placeholder="Acme Corp"
                      onChange={(e) =>
                        dispatch(updateExperience({ index, item: { company: e.target.value } }))
                      }
                    />
                  </Field>
                  <Field label="Start date">
                    <FieldInput
                      type="month"
                      value={item.startDate}
                      onChange={(e) =>
                        dispatch(updateExperience({ index, item: { startDate: e.target.value } }))
                      }
                    />
                  </Field>
                  <Field label="End date">
                    <FieldInput
                      type="month"
                      value={item.endDate}
                      disabled={item.current}
                      onChange={(e) =>
                        dispatch(updateExperience({ index, item: { endDate: e.target.value } }))
                      }
                    />
                  </Field>
                </div>

                <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
                  <input
                    type="checkbox"
                    checked={item.current}
                    onChange={(e) =>
                      dispatch(
                        updateExperience({ index, item: { current: e.target.checked } })
                      )
                    }
                    className="size-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  I currently work here
                </label>

                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      Achievement bullets (one per line)
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={item.bullets.join('\n')}
                    placeholder={'Built a design system used by 4 teams\nReduced page load time by 38%'}
                    onChange={(e) =>
                      dispatch(
                        updateExperience({
                          index,
                          item: { bullets: e.target.value.split('\n') },
                        })
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    Tip: start with action verbs and add numbers where possible.
                  </p>
                </div>
              </div>
            )}
          </div>
        )
      })}

      <button
        type="button"
        onClick={() => {
          dispatch(addExperience())
          setOpenIndex(experience.length)
        }}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 py-3 text-sm font-semibold text-slate-500 transition-colors hover:border-indigo-400 hover:bg-indigo-50/40 hover:text-indigo-600"
      >
        <Plus className="size-4" />
        Add experience
      </button>
    </div>
  )
}

export function SkillsSection() {
  const dispatch = useAppDispatch()
  const skills = useAppSelector((state) => state.builder.content.skills)
  const [draft, setDraft] = useState('')

  function commit(): void {
    if (draft.trim()) {
      dispatch(addSkill(draft))
      setDraft('')
    }
  }

  return (
    <div>
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
          placeholder="Type a skill and press Enter…"
          className="h-10 flex-1 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
        <button
          type="button"
          onClick={commit}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
        >
          <Plus className="size-4" />
          Add
        </button>
      </div>

      {skills.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span
              key={skill}
              className="group inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 py-1.5 pl-3 pr-2 text-sm font-semibold text-indigo-800"
            >
              {skill}
              <button
                type="button"
                onClick={() => dispatch(removeSkill(skill))}
                className="rounded-full p-0.5 text-indigo-400 transition-colors hover:bg-indigo-200 hover:text-indigo-700"
                aria-label={`Remove ${skill}`}
              >
                <X className="size-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
