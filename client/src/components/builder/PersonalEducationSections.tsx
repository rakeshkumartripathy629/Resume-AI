import { Plus, Trash2 } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import {
  addEducation,
  removeEducation,
  updateEducation,
  updatePersonalInfo,
} from '../../features/builder/builderSlice'
import { Field, FieldInput } from './Field'

export function PersonalInfoSection() {
  const dispatch = useAppDispatch()
  const info = useAppSelector((state) => state.builder.content.personalInfo)

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Full name">
          <FieldInput
            value={info.fullName}
            placeholder="Rakesh Kumar"
            onChange={(e) => dispatch(updatePersonalInfo({ fullName: e.target.value }))}
          />
        </Field>
        <Field label="Email">
          <FieldInput
            type="email"
            value={info.email}
            placeholder="rakesh@example.com"
            onChange={(e) => dispatch(updatePersonalInfo({ email: e.target.value }))}
          />
        </Field>
        <Field label="Phone">
          <FieldInput
            value={info.phone}
            placeholder="+91 98765 43210"
            onChange={(e) => dispatch(updatePersonalInfo({ phone: e.target.value }))}
          />
        </Field>
        <Field label="Location">
          <FieldInput
            value={info.location}
            placeholder="Bengaluru, India"
            onChange={(e) => dispatch(updatePersonalInfo({ location: e.target.value }))}
          />
        </Field>
        <Field label="LinkedIn">
          <FieldInput
            value={info.linkedin}
            placeholder="linkedin.com/in/rakesh"
            onChange={(e) => dispatch(updatePersonalInfo({ linkedin: e.target.value }))}
          />
        </Field>
        <Field label="Portfolio / GitHub">
          <FieldInput
            value={info.portfolio}
            placeholder="github.com/rakesh"
            onChange={(e) => dispatch(updatePersonalInfo({ portfolio: e.target.value }))}
          />
        </Field>
      </div>

      <Field label="Professional summary">
        <textarea
          rows={4}
          value={info.summary}
          placeholder="Senior engineer with 6+ years building scalable web platforms…"
          onChange={(e) => dispatch(updatePersonalInfo({ summary: e.target.value }))}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
      </Field>
    </div>
  )
}

export function EducationSection() {
  const dispatch = useAppDispatch()
  const education = useAppSelector((state) => state.builder.content.education)

  return (
    <div className="space-y-3">
      {education.length === 0 && (
        <p className="rounded-lg bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
          No education added yet.
        </p>
      )}

      {education.map((item, index) => (
        <div key={index} className="relative rounded-xl border border-slate-200 p-4">
          <button
            type="button"
            onClick={() => dispatch(removeEducation(index))}
            className="absolute right-3 top-3 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
            aria-label="Remove education"
          >
            <Trash2 className="size-4" />
          </button>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Institution">
              <FieldInput
                value={item.institution}
                placeholder="IIT Delhi"
                onChange={(e) =>
                  dispatch(updateEducation({ index, item: { institution: e.target.value } }))
                }
              />
            </Field>
            <Field label="Degree">
              <FieldInput
                value={item.degree}
                placeholder="B.Tech"
                onChange={(e) =>
                  dispatch(updateEducation({ index, item: { degree: e.target.value } }))
                }
              />
            </Field>
            <Field label="Field of study">
              <FieldInput
                value={item.field}
                placeholder="Computer Science"
                onChange={(e) =>
                  dispatch(updateEducation({ index, item: { field: e.target.value } }))
                }
              />
            </Field>
            <Field label="Grade / CGPA">
              <FieldInput
                value={item.grade}
                placeholder="8.7 CGPA"
                onChange={(e) =>
                  dispatch(updateEducation({ index, item: { grade: e.target.value } }))
                }
              />
            </Field>
            <Field label="Start year">
              <FieldInput
                type="month"
                value={item.startDate}
                onChange={(e) =>
                  dispatch(updateEducation({ index, item: { startDate: e.target.value } }))
                }
              />
            </Field>
            <Field label="End year">
              <FieldInput
                type="month"
                value={item.endDate}
                onChange={(e) =>
                  dispatch(updateEducation({ index, item: { endDate: e.target.value } }))
                }
              />
            </Field>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => dispatch(addEducation())}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 py-3 text-sm font-semibold text-slate-500 transition-colors hover:border-indigo-400 hover:bg-indigo-50/40 hover:text-indigo-600"
      >
        <Plus className="size-4" />
        Add education
      </button>
    </div>
  )
}
