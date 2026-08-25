import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { api, apiErrorMessage } from '../../lib/api'
import {
  emptyResumeContent,
  type EducationItem,
  type ExperienceItem,
  type PersonalInfo,
  type ResumeContent,
  type ResumeDocument,
} from '../../types/resume'

export type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error'

interface BuilderState {
  id: string | null
  title: string
  content: ResumeContent
  status: SaveStatus
  error: string | null
}

type SaveResponse = { success: boolean; data: ResumeDocument }

export const saveBuilderResume = createAsyncThunk(
  'builder/save',
  async (
    payload: { id: string | null; title: string; content: ResumeContent },
    { rejectWithValue }
  ) => {
    try {
      if (payload.id) {
        const response = await api.patch<SaveResponse>(`/resumes/${payload.id}`, {
          title: payload.title,
          content: payload.content,
        })
        return response.data.data
      }
      const response = await api.post<SaveResponse>('/resumes', {
        title: payload.title,
        content: payload.content,
      })
      return response.data.data
    } catch (error) {
      return rejectWithValue(apiErrorMessage(error))
    }
  }
)

const initialState: BuilderState = {
  id: null,
  title: 'Untitled resume',
  content: emptyResumeContent,
  status: 'idle',
  error: null,
}

const builderSlice = createSlice({
  name: 'builder',
  initialState,
  reducers: {
    setTitle(state, action: PayloadAction<string>) {
      state.title = action.payload
      state.status = state.status === 'saving' ? 'saving' : 'dirty'
    },
    updatePersonalInfo(state, action: PayloadAction<Partial<PersonalInfo>>) {
      Object.assign(state.content.personalInfo, action.payload)
      state.status = state.status === 'saving' ? 'saving' : 'dirty'
    },
    addExperience(state) {
      state.content.experience.push({
        company: '',
        role: '',
        startDate: '',
        endDate: '',
        current: false,
        bullets: [''],
      })
      state.status = state.status === 'saving' ? 'saving' : 'dirty'
    },
    updateExperience(
      state,
      action: PayloadAction<{ index: number; item: Partial<ExperienceItem> }>
    ) {
      const { index, item } = action.payload
      const current = state.content.experience[index]
      if (current) {
        state.content.experience[index] = { ...current, ...item }
        state.status = state.status === 'saving' ? 'saving' : 'dirty'
      }
    },
    removeExperience(state, action: PayloadAction<number>) {
      state.content.experience.splice(action.payload, 1)
      state.status = state.status === 'saving' ? 'saving' : 'dirty'
    },
    addEducation(state) {
      state.content.education.push({
        institution: '',
        degree: '',
        field: '',
        startDate: '',
        endDate: '',
        grade: '',
      })
      state.status = state.status === 'saving' ? 'saving' : 'dirty'
    },
    updateEducation(
      state,
      action: PayloadAction<{ index: number; item: Partial<EducationItem> }>
    ) {
      const { index, item } = action.payload
      const current = state.content.education[index]
      if (current) {
        state.content.education[index] = { ...current, ...item }
        state.status = state.status === 'saving' ? 'saving' : 'dirty'
      }
    },
    removeEducation(state, action: PayloadAction<number>) {
      state.content.education.splice(action.payload, 1)
      state.status = state.status === 'saving' ? 'saving' : 'dirty'
    },
    addSkill(state, action: PayloadAction<string>) {
      const skill = action.payload.trim()
      if (skill && !state.content.skills.includes(skill)) {
        state.content.skills.push(skill)
        state.status = state.status === 'saving' ? 'saving' : 'dirty'
      }
    },
    removeSkill(state, action: PayloadAction<string>) {
      state.content.skills = state.content.skills.filter((s) => s !== action.payload)
      state.status = state.status === 'saving' ? 'saving' : 'dirty'
    },
    resetBuilder() {
      return initialState
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(saveBuilderResume.pending, (state) => {
        if (state.status !== 'dirty') state.status = 'saving'
        state.error = null
      })
      .addCase(saveBuilderResume.fulfilled, (state, action) => {
        state.id = action.payload.id
        // Keep local content authoritative — only adopt server id/status
        state.status = state.status === 'dirty' ? 'dirty' : 'saved'
      })
      .addCase(saveBuilderResume.rejected, (state, action) => {
        state.status = 'error'
        state.error =
          (action.payload as string | undefined) ?? action.error.message ?? 'Save failed'
      })
  },
})

export const {
  setTitle,
  updatePersonalInfo,
  addExperience,
  updateExperience,
  removeExperience,
  addEducation,
  updateEducation,
  removeEducation,
  addSkill,
  removeSkill,
  resetBuilder,
} = builderSlice.actions

export default builderSlice.reducer
