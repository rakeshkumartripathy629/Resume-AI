import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { api, apiErrorMessage } from '../../lib/api'

export interface InterviewSummary {
  id: string
  role: string
  difficulty: 'easy' | 'medium' | 'hard'
  status: 'in_progress' | 'completed'
  questionCount: number
  answeredCount: number
  overallScore: number | null
  createdAt: string
  completedAt: string | null
}

interface InterviewListState {
  items: InterviewSummary[]
  total: number
  page: number
  totalPages: number
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
}

const initialState: InterviewListState = {
  items: [],
  total: 0,
  page: 1,
  totalPages: 1,
  status: 'idle',
  error: null,
}

export const fetchMyInterviews = createAsyncThunk(
  'interviewList/fetch',
  async (_: void, { rejectWithValue }) => {
    try {
      const response = await api.get<{
        success: boolean
        data: { items: InterviewSummary[]; total: number; page: number; totalPages: number }
      }>('/interviews?limit=5')
      return response.data.data
    } catch (error) {
      return rejectWithValue(apiErrorMessage(error))
    }
  }
)

const interviewListSlice = createSlice({
  name: 'interviewList',
  initialState,
  reducers: {
    clearInterviewList() {
      return initialState
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyInterviews.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchMyInterviews.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload.items
        state.total = action.payload.total
        state.page = action.payload.page
        state.totalPages = action.payload.totalPages
      })
      .addCase(fetchMyInterviews.rejected, (state, action) => {
        state.status = 'failed'
        state.error =
          (action.payload as string | undefined) ??
          action.error.message ??
          'Failed to load interviews'
      })
  },
})

export const { clearInterviewList } = interviewListSlice.actions
export default interviewListSlice.reducer
