import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { api, apiErrorMessage } from '../../lib/api'
import type { ResumeContent } from '../../types/resume'

export interface ResumeSummary {
  id: string
  title: string
  status: 'draft' | 'complete'
  createdAt: string
  updatedAt: string
}

interface ResumeDetail {
  id: string
  title: string
  status: 'draft' | 'complete'
  content: ResumeContent
  createdAt: string
  updatedAt: string
}

interface ResumeListState {
  items: ResumeSummary[]
  detail: ResumeDetail | null
  detailStatus: 'idle' | 'loading' | 'succeeded' | 'failed'
  listStatus: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
}

const initialState: ResumeListState = {
  items: [],
  detail: null,
  detailStatus: 'idle',
  listStatus: 'idle',
  error: null,
}

export const fetchResumeList = createAsyncThunk(
  'resumeList/fetchList',
  async (_: void, { rejectWithValue }) => {
    try {
      const response = await api.get<{
        success: boolean
        data: { items: ResumeSummary[] }
      }>('/resumes')
      return response.data.data.items
    } catch (error) {
      return rejectWithValue(apiErrorMessage(error))
    }
  }
)

export const fetchResumeDetail = createAsyncThunk(
  'resumeList/fetchDetail',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await api.get<{
        success: boolean
        data: ResumeDetail
      }>(`/resumes/${id}`)
      return response.data.data
    } catch (error) {
      return rejectWithValue(apiErrorMessage(error))
    }
  }
)

const resumeListSlice = createSlice({
  name: 'resumeList',
  initialState,
  reducers: {
    clearResumeDetail(state) {
      state.detail = null
      state.detailStatus = 'idle'
    },
    clearResumeList() {
      return initialState
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchResumeList.pending, (state) => {
        state.listStatus = 'loading'
        state.error = null
      })
      .addCase(fetchResumeList.fulfilled, (state, action) => {
        state.listStatus = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchResumeList.rejected, (state, action) => {
        state.listStatus = 'failed'
        state.error =
          (action.payload as string | undefined) ??
          action.error.message ??
          'Failed to load resumes'
      })
      .addCase(fetchResumeDetail.pending, (state) => {
        state.detailStatus = 'loading'
        state.error = null
      })
      .addCase(fetchResumeDetail.fulfilled, (state, action) => {
        state.detailStatus = 'succeeded'
        state.detail = action.payload
      })
      .addCase(fetchResumeDetail.rejected, (state, action) => {
        state.detailStatus = 'failed'
        state.error =
          (action.payload as string | undefined) ??
          action.error.message ??
          'Failed to load resume'
      })
  },
})

export const { clearResumeDetail, clearResumeList } = resumeListSlice.actions
export default resumeListSlice.reducer
