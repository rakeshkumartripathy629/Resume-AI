import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { api, apiErrorMessage } from '../../lib/api'
import type { ScoreResult } from '../../types/scoring'

interface ScorerState {
  resumeText: string
  jobDescription: string
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  result: ScoreResult | null
  error: string | null
  scoreCount: number | null
  history: ScoreHistoryItem[]
  historyTotal: number
  historyPage: number
  historyPages: number
  historyStatus: 'idle' | 'loading' | 'succeeded' | 'failed'
}

export interface ScoreHistoryItem {
  id: string
  jobTitle: string
  company: string
  overallScore: number
  verdict: string
  createdAt: string
}

interface ScoreResponse {
  success: boolean
  data: ScoreResult
}

interface ScoreListResponse {
  success: boolean
  data: {
    items: ScoreHistoryItem[]
    pagination: { page: number; limit: number; total: number; pages: number }
  }
}

export const scoreResume = createAsyncThunk(
  'scorer/scoreResume',
  async (payload: { resumeText: string; jobDescription: string }, { rejectWithValue }) => {
    try {
      const response = await api.post<ScoreResponse>('/agent/score', payload)
      return response.data.data
    } catch (error) {
      return rejectWithValue(apiErrorMessage(error))
    }
  }
)

export const fetchScoreCount = createAsyncThunk(
  'scorer/fetchScoreCount',
  async (_: void, { rejectWithValue }) => {
    try {
      const response = await api.get<ScoreListResponse>('/agent/scores', { params: { limit: 1 } })
      return response.data.data.pagination.total
    } catch (error) {
      return rejectWithValue(apiErrorMessage(error))
    }
  }
)

export const fetchScores = createAsyncThunk(
  'scorer/fetchScores',
  async (payload: { page?: number; limit?: number }, { rejectWithValue }) => {
    try {
      const response = await api.get<ScoreListResponse>('/agent/scores', {
        params: { page: payload.page ?? 1, limit: payload.limit ?? 10 },
      })
      return response.data.data
    } catch (error) {
      return rejectWithValue(apiErrorMessage(error))
    }
  }
)

const initialState: ScorerState = {
  resumeText: '',
  jobDescription: '',
  status: 'idle',
  result: null,
  error: null,
  scoreCount: null,
  history: [],
  historyTotal: 0,
  historyPage: 1,
  historyPages: 1,
  historyStatus: 'idle',
}

const scorerSlice = createSlice({
  name: 'scorer',
  initialState,
  reducers: {
    setResumeText(state, action: PayloadAction<string>) {
      state.resumeText = action.payload
    },
    setJobDescription(state, action: PayloadAction<string>) {
      state.jobDescription = action.payload
    },
    resetScorer() {
      return initialState
    },
    backToEditor(state) {
      state.status = 'idle'
      state.result = null
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(scoreResume.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(scoreResume.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.result = action.payload
      })
      .addCase(scoreResume.rejected, (state, action) => {
        state.status = 'failed'
        state.error =
          (action.payload as string | undefined) ?? action.error.message ?? 'Scoring failed'
      })
      .addCase(fetchScoreCount.fulfilled, (state, action) => {
        state.scoreCount = action.payload
      })
      .addCase(fetchScores.pending, (state) => {
        state.historyStatus = 'loading'
      })
      .addCase(fetchScores.fulfilled, (state, action) => {
        state.historyStatus = 'succeeded'
        state.history = action.payload.items
        state.historyTotal = action.payload.pagination.total
        state.historyPage = action.payload.pagination.page
        state.historyPages = action.payload.pagination.pages
      })
      .addCase(fetchScores.rejected, (state) => {
        state.historyStatus = 'failed'
      })
  },
})

export const { setResumeText, setJobDescription, resetScorer, backToEditor } =
  scorerSlice.actions

export default scorerSlice.reducer
